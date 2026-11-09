// Sends mail through the Gmail API using OAuth (refresh token). No passwords, no keys in the browser.
//
// Required secrets (Supabase -> Edge Functions -> Secrets), all belonging to the sender Gmail account:
//   GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN   (scope: https://www.googleapis.com/auth/gmail.send,
//   plus gmail.readonly or userinfo/profile only if you want the extra "is this the right account?" check to run)
// The sender address itself is read from the private settings table (student_workshop_settings.sender_email).
//
// If any secret is missing, sendMail() returns { ok:false, error:"email_not_configured" } and nothing is sent.

export type EnvGetter = (key: string) => string | undefined;
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface OutgoingMail {
  from: string; // address of the authorised Gmail account
  fromName?: string;
  to: string[];
  subject: string;
  text: string;
  replyTo?: string;
}

export type SendResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export function b64url(input: string | Uint8Array): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let bin = "";
  for (let i = 0; i < bytes.length; i += 8192) bin += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64Lines(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 8192) bin += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return (btoa(bin).match(/.{1,76}/g) || []).join("\r\n");
}

/** RFC 2047 encoded-word so non-ASCII subjects/names (e.g. the en dash) survive. */
export function encodeHeader(value: string): string {
  // deno-lint-ignore no-control-regex
  if (/^[\x20-\x7e]*$/.test(value)) return value;
  const bytes = new TextEncoder().encode(value);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return `=?UTF-8?B?${btoa(bin)}?=`;
}

function clean(v: string): string {
  return v.replace(/[\r\n]+/g, " ").trim();
}

const ADDR_RE = /^[^@\s<>",;]+@[^@\s<>",;]+\.[^@\s<>",;]+$/;

export function buildMime(m: OutgoingMail): string {
  for (const a of [m.from, ...m.to]) if (!ADDR_RE.test(a)) throw new Error("bad_address");
  if (m.replyTo && !ADDR_RE.test(m.replyTo)) throw new Error("bad_address");
  const fromHdr = m.fromName ? `${encodeHeader(clean(m.fromName))} <${m.from}>` : m.from;
  const headers = [
    `From: ${fromHdr}`,
    `To: ${m.to.join(", ")}`,
    ...(m.replyTo ? [`Reply-To: ${m.replyTo}`] : []),
    `Subject: ${encodeHeader(clean(m.subject))}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
  ];
  return headers.join("\r\n") + "\r\n\r\n" + b64Lines(m.text);
}

export async function sendMail(env: EnvGetter, mail: OutgoingMail, fetchImpl: FetchLike = fetch): Promise<SendResult> {
  const clientId = env("GMAIL_CLIENT_ID");
  const clientSecret = env("GMAIL_CLIENT_SECRET");
  const refresh = env("GMAIL_REFRESH_TOKEN");
  if (!clientId || !clientSecret || !refresh) return { ok: false, error: "email_not_configured" };

  let raw: string;
  try {
    raw = b64url(buildMime(mail));
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  try {
    const tokRes = await fetchImpl("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refresh, grant_type: "refresh_token" }).toString(),
    });
    const tok = await tokRes.json().catch(() => ({}));
    if (!tokRes.ok || !tok.access_token) return { ok: false, error: `gmail_auth_failed: ${tok.error || tokRes.status}` };

    // The mail must really come from the named account: refuse if the authorised account is a different one.
    const prof = await fetchImpl("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
      headers: { Authorization: `Bearer ${tok.access_token}` },
    });
    if (prof.ok) {
      const p = await prof.json().catch(() => ({}));
      if (p.emailAddress && String(p.emailAddress).toLowerCase() !== mail.from.toLowerCase()) {
        return { ok: false, error: `gmail_wrong_account: authorised as ${p.emailAddress}` };
      }
    }

    const res = await fetchImpl("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${tok.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ raw }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: `gmail_send_failed: ${body?.error?.message || res.status}` };
    return { ok: true, id: String(body.id || "") };
  } catch (e) {
    return { ok: false, error: `gmail_network_error: ${(e as Error).message}` };
  }
}
