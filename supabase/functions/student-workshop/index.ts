// Student registration & verification for the Acting & Filmmaking Workshop.
//
//   POST multipart/form-data  -> public student application (fields + `id_file`)
//   POST application/json     -> admin actions (Authorization: Bearer <Supabase user token>), see handleAdmin()
//
// Uses only the auto-provided SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY. Gmail needs GMAIL_CLIENT_ID,
// GMAIL_CLIENT_SECRET and GMAIL_REFRESH_TOKEN (see mail.ts and supabase/STUDENT_WORKSHOP_SETUP.md).
// Team addresses, sender address and the student payment links are read from private DB tables, never from the repo.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { checkFileMeta, MAX_ID_BYTES, randomToken, sniffFile, UUID_RE, validateFields, WORKSHOPS } from "./validate.ts";
import type { WorkshopId } from "./validate.ts";
import { approval, rejection, studentAck, teamNotification } from "./templates.ts";
import type { AppForEmail } from "./templates.ts";
import { sendMail } from "./mail.ts";

const BUCKET = "student-ids";
const SIGNED_URL_SECONDS = 60;
const ORIGINS = new Set([
  "https://aniradichita.com",
  "https://www.aniradichita.com",
  "http://127.0.0.1:4180",
  "http://localhost:4180",
]);

const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const env = (k: string) => Deno.env.get(k) || undefined;

// ───────── small helpers ─────────
function corsHeaders(req: Request): Record<string, string> {
  const o = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ORIGINS.has(o) ? o : "https://aniradichita.com",
    "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
async function sha256Hex(data: Uint8Array | string): Promise<string> {
  const buf = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const d = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function settings(): Promise<Record<string, string>> {
  const { data } = await supa.from("student_workshop_settings").select("key,value");
  const out: Record<string, string> = {};
  for (const r of data || []) out[r.key] = r.value;
  return out;
}
async function audit(applicationId: string, actor: string, action: string, detail?: string) {
  await supa.from("student_workshop_events").insert({ application_id: applicationId, actor, action, detail: detail ?? null });
}

// ───────── email outbox: enqueue once (dedupe_key), claim, send, record ─────────
interface OutboxRow {
  id: string; application_id: string; kind: string; to_emails: string[]; subject: string; body_text: string;
  status: string; attempts: number; last_error: string | null;
}

async function enqueue(applicationId: string, kind: string, dedupeKey: string, to: string[], subject: string, text: string): Promise<OutboxRow | null> {
  await supa.from("student_workshop_outbox").upsert(
    { application_id: applicationId, kind, dedupe_key: dedupeKey, to_emails: to, subject, body_text: text },
    { onConflict: "dedupe_key", ignoreDuplicates: true },
  );
  const { data } = await supa.from("student_workshop_outbox").select("*").eq("dedupe_key", dedupeKey).maybeSingle();
  return (data as OutboxRow) || null;
}

/** Sends one outbox row at most once: only the caller that wins the claim sends. */
async function deliver(row: OutboxRow, actor: string, cfg: Record<string, string>): Promise<{ sent: boolean; error?: string; skipped?: boolean }> {
  if (row.status === "sent") return { sent: true, skipped: true };
  const staleBefore = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data: claimed } = await supa.from("student_workshop_outbox")
    .update({ status: "sending", claimed_at: new Date().toISOString() })
    .eq("id", row.id)
    .or(`status.in.(pending,failed),and(status.eq.sending,claimed_at.lt.${staleBefore})`)
    .select("id");
  if (!claimed || !claimed.length) return { sent: false, skipped: true, error: "already_being_sent" };

  const sender = cfg.sender_email || "";
  const result = sender
    ? await sendMail(env, { from: sender, fromName: cfg.sender_name, to: row.to_emails, subject: row.subject, text: row.body_text })
    : ({ ok: false, error: "sender_not_configured" } as const);

  if (result.ok) {
    await supa.rpc("student_workshop_mark_sent", { p_outbox: row.id, p_admin: actor });
    return { sent: true };
  }
  await supa.from("student_workshop_outbox")
    .update({ status: "failed", last_error: result.error.slice(0, 500), attempts: row.attempts + 1 })
    .eq("id", row.id);
  console.error("email failed", row.kind, result.error);
  return { sent: false, error: result.error };
}

function asEmailApp(a: Record<string, unknown>): AppForEmail {
  return a as unknown as AppForEmail;
}

// ───────── public: student application ─────────
async function handleRegister(req: Request): Promise<Response> {
  const origin = req.headers.get("origin");
  if (origin && !ORIGINS.has(origin)) return json(req, { ok: false, error: "forbidden_origin" }, 403);
  const len = Number(req.headers.get("content-length") || 0);
  if (len > MAX_ID_BYTES + 512 * 1024) return json(req, { ok: false, error: "too_large", errors: { id_file: "The file is bigger than 5 MB. Please choose a smaller file." } }, 413);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json(req, { ok: false, error: "bad_form" }, 400);
  }

  // hidden field real people never fill: pretend success, store nothing
  if (String(form.get("website") || "").trim()) return json(req, { ok: true, applicationCode: "SW-000000-XXXXX", ackEmail: "queued" });

  const raw: Record<string, unknown> = {};
  for (const k of ["full_name", "email", "phone", "institution", "course_year", "city", "workshop", "consent"]) raw[k] = form.get(k) ?? "";
  const v = validateFields(raw);
  const errors: Record<string, string> = v.ok ? {} : { ...v.errors };

  const file = form.get("id_file");
  let bytes: Uint8Array | null = null;
  let sniff: ReturnType<typeof sniffFile> | null = null;
  if (!(file instanceof File)) {
    errors.id_file = "Please upload your school or college ID card.";
  } else {
    const meta = checkFileMeta(file.name, file.size, file.type);
    if (!meta.ok) errors.id_file = meta.reason;
    else {
      bytes = new Uint8Array(await file.arrayBuffer());
      sniff = sniffFile(bytes, file.name);
      if (!sniff.ok) errors.id_file = sniff.reason || "This file cannot be accepted.";
    }
  }
  if (!v.ok || errors.id_file || !bytes || !sniff || !sniff.ok) return json(req, { ok: false, error: "invalid", errors }, 422);
  const f = v.value;

  // throttle: per email and per network address
  const ip = (req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "").split(",")[0].trim();
  const ipHash = ip ? (await sha256Hex("atfa-student:" + ip)).slice(0, 24) : null;
  const hourAgo = new Date(Date.now() - 3600 * 1000).toISOString();
  const [byEmail, byIp] = await Promise.all([
    supa.from("student_workshop_applications").select("id", { count: "exact", head: true }).eq("email", f.email).gte("created_at", hourAgo),
    ipHash
      ? supa.from("student_workshop_applications").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", hourAgo)
      : Promise.resolve({ count: 0 }),
  ]);
  if ((byEmail.count || 0) >= 3 || (byIp.count || 0) >= 10) {
    return json(req, { ok: false, error: "rate_limited", message: "Too many applications from here just now. Please try again in an hour." }, 429);
  }

  // 1) claim the application (unique per person + workshop), 2) store the file privately, 3) point the row at it
  const id = crypto.randomUUID();
  const path = `${id}/id-${randomToken(10)}.${sniff.ext}`;
  let row: Record<string, unknown> | null = null;
  for (let attempt = 0; attempt < 5 && !row; attempt++) {
    const { data: code } = await supa.rpc("student_workshop_new_code");
    const { data, error } = await supa.from("student_workshop_applications").insert({
      id, app_code: code as string, ...f, consent: true, id_path: path, id_mime: sniff.mime, id_size: bytes.length,
      id_sha256: await sha256Hex(bytes), ip_hash: ipHash,
    }).select("*").single();
    if (!error) { row = data; break; }
    if (error.code === "23505" && /one_live/.test(error.message || "")) {
      return json(req, { ok: false, error: "duplicate", message: "We already have an application from this email for this workshop." }, 409);
    }
    if (!(error.code === "23505" && /app_code/.test(error.message || ""))) {
      console.error("insert failed", error);
      return json(req, { ok: false, error: "server_error", message: "Something went wrong and your application was not saved. Please try again." }, 500);
    }
  }
  if (!row) return json(req, { ok: false, error: "server_error", message: "Something went wrong and your application was not saved. Please try again." }, 500);

  const up = await supa.storage.from(BUCKET).upload(path, bytes, { contentType: sniff.mime, upsert: false, cacheControl: "0" });
  if (up.error) {
    console.error("upload failed", up.error);
    await supa.from("student_workshop_applications").delete().eq("id", id); // nothing half-saved
    return json(req, { ok: false, error: "upload_failed", message: "We could not store your ID file, so your application was not saved. Please try again." }, 500);
  }
  await audit(id, "student", "submitted", `${f.workshop}; ${sniff.mime}; ${bytes.length} bytes`);

  // 4) emails (queued first, so nothing is lost if sending fails)
  const cfg = await settings();
  const app = asEmailApp(row);
  const team = (cfg.team_emails || "").split(",").map((s) => s.trim()).filter(Boolean);
  const adminUrl = cfg.admin_url || "https://aniradichita.com/admin/student-applications";
  const tn = teamNotification(app, adminUrl);
  const ack = studentAck(app);
  const [teamRow, ackRow] = await Promise.all([
    team.length ? enqueue(id, "team_notification", `team:${id}`, team, tn.subject, tn.text) : Promise.resolve(null),
    enqueue(id, "student_ack", `ack:${id}`, [f.email], ack.subject, ack.text),
  ]);
  const [t, a] = await Promise.all([
    teamRow ? deliver(teamRow, "system", cfg) : Promise.resolve({ sent: false, error: "no_team_emails" }),
    ackRow ? deliver(ackRow, "system", cfg) : Promise.resolve({ sent: false, error: "no_ack_row" }),
  ]);
  await audit(id, "system", "emails", `team:${t.sent ? "sent" : "queued"}; ack:${a.sent ? "sent" : "queued"}`);

  return json(req, { ok: true, applicationCode: row.app_code, ackEmail: a.sent ? "sent" : "queued" });
}

// ───────── admin ─────────
interface Admin { id: string; email: string }

async function requireAdmin(req: Request): Promise<Admin | null> {
  const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return null;
  const { data, error } = await supa.auth.getUser(jwt);
  if (error || !data?.user?.email) return null;
  const u = data.user;
  if (!u.email_confirmed_at) return null;
  const { data: adm } = await supa.from("student_workshop_admins").select("user_id").eq("user_id", u.id).maybeSingle();
  return adm ? { id: u.id, email: u.email! } : null;
}

const STATUSES = ["Pending Verification", "Approved", "Rejected", "Payment Link Sent", "Payment Completed"];
const LIST_COLS = "id,app_code,created_at,full_name,email,phone,institution,course_year,city,workshop,status,decided_at,decided_by,id_deleted_at,retention_expires_at,admin_note";

async function loadApp(id: string) {
  const { data } = await supa.from("student_workshop_applications").select("*").eq("id", id).maybeSingle();
  return data as (Record<string, unknown> & AppForEmail & { id: string; status: string; approval_seq: number; email: string }) | null;
}

async function emailSummary(ids: string[]) {
  if (!ids.length) return {} as Record<string, Record<string, string>>;
  const { data } = await supa.from("student_workshop_outbox").select("application_id,kind,status,dedupe_key").in("application_id", ids);
  const out: Record<string, Record<string, string>> = {};
  for (const r of data || []) {
    const m = (out[r.application_id] ||= {});
    // keep the "best" state per kind (sent beats failed beats pending)
    const rank = (s: string) => ({ sent: 3, failed: 2, sending: 1, pending: 1 } as Record<string, number>)[s] || 0;
    if (!m[r.kind] || rank(r.status) > rank(m[r.kind])) m[r.kind] = r.status;
  }
  return out;
}

/** Deletes ID documents whose retention period has ended. Returns how many files were removed. */
async function purgeExpired(actor: string): Promise<number> {
  const { data: due } = await supa.from("student_workshop_applications").select("id,id_path")
    .is("id_deleted_at", null).not("id_path", "is", null).lt("retention_expires_at", new Date().toISOString()).limit(200);
  let removed = 0;
  for (const r of due || []) {
    const rm = await supa.storage.from(BUCKET).remove([r.id_path as string]);
    if (!rm.error) {
      await supa.from("student_workshop_applications").update({ id_deleted_at: new Date().toISOString() }).eq("id", r.id);
      await audit(r.id, actor, "id_deleted", "retention period ended");
      removed++;
    }
  }
  return removed;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

/** The daily retention job (pg_cron -> this function). It can do exactly one thing: purge expired IDs. */
async function handleCron(req: Request): Promise<Response> {
  const given = req.headers.get("x-cron-secret") || "";
  const cfg = await settings();
  if (!cfg.cron_secret || !timingSafeEqual(given, cfg.cron_secret)) return json(req, { ok: false, error: "unauthorized" }, 401);
  return json(req, { ok: true, removed: await purgeExpired("system (retention)") });
}

async function handleAdmin(req: Request): Promise<Response> {
  if (req.headers.get("x-cron-secret")) return await handleCron(req);
  const admin = await requireAdmin(req);
  if (!admin) return json(req, { ok: false, error: "unauthorized" }, 401);

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return json(req, { ok: false, error: "bad_json" }, 400);
  }
  const action = String(b.action || "");
  const id = typeof b.id === "string" ? b.id : "";
  const note = typeof b.note === "string" ? b.note.slice(0, 2000) : "";
  const cfg = await settings();

  switch (action) {
    case "whoami":
      return json(req, { ok: true, email: admin.email, emailConfigured: !!(env("GMAIL_CLIENT_ID") && env("GMAIL_CLIENT_SECRET") && env("GMAIL_REFRESH_TOKEN")) });

    case "list": {
      let q = supa.from("student_workshop_applications").select(LIST_COLS).order("created_at", { ascending: false }).limit(500);
      if (typeof b.workshop === "string" && b.workshop && b.workshop in WORKSHOPS) q = q.eq("workshop", b.workshop);
      if (typeof b.status === "string" && b.status && STATUSES.includes(b.status)) q = q.eq("status", b.status);
      if (typeof b.q === "string" && b.q.trim()) {
        const s = b.q.trim().replace(/[%,()]/g, " ").slice(0, 60);
        q = q.or(`full_name.ilike.%${s}%,email.ilike.%${s}%,app_code.ilike.%${s}%,institution.ilike.%${s}%`);
      }
      const { data, error } = await q;
      if (error) return json(req, { ok: false, error: "query_failed" }, 500);
      const emails = await emailSummary((data || []).map((r) => r.id));
      const { count: due } = await supa.from("student_workshop_applications").select("id", { count: "exact", head: true })
        .is("id_deleted_at", null).not("id_path", "is", null).lt("retention_expires_at", new Date().toISOString());
      return json(req, { ok: true, applications: (data || []).map((r) => ({ ...r, emails: emails[r.id] || {} })), idsDueForDeletion: due || 0 });
    }

    case "get": {
      if (!UUID_RE.test(id)) return json(req, { ok: false, error: "bad_id" }, 400);
      const app = await loadApp(id);
      if (!app) return json(req, { ok: false, error: "not_found" }, 404);
      const [ev, ob] = await Promise.all([
        supa.from("student_workshop_events").select("at,actor,action,detail").eq("application_id", id).order("id", { ascending: true }),
        supa.from("student_workshop_outbox").select("id,kind,status,attempts,last_error,created_at,sent_at,to_emails,subject").eq("application_id", id).order("created_at"),
      ]);
      let idUrl: string | null = null;
      if (app.id_path && !app.id_deleted_at && b.withId !== false) {
        const s = await supa.storage.from(BUCKET).createSignedUrl(app.id_path as string, SIGNED_URL_SECONDS);
        idUrl = s.data?.signedUrl || null;
        await audit(id, admin.email, "viewed_id", `signed link valid ${SIGNED_URL_SECONDS}s`);
      }
      const { id_path: _p, ip_hash: _h, ...safe } = app as Record<string, unknown>;
      return json(req, { ok: true, application: safe, events: ev.data || [], emails: ob.data || [], idUrl, idUrlSeconds: SIGNED_URL_SECONDS });
    }

    case "set_note": {
      if (!UUID_RE.test(id)) return json(req, { ok: false, error: "bad_id" }, 400);
      await supa.from("student_workshop_applications").update({ admin_note: note || null }).eq("id", id);
      await audit(id, admin.email, "note_updated");
      return json(req, { ok: true });
    }

    case "approve": {
      if (!UUID_RE.test(id)) return json(req, { ok: false, error: "bad_id" }, 400);
      const resend = b.resend === true;
      const { data: dec, error } = await supa.rpc("student_workshop_decide", { p_id: id, p_action: "approve", p_admin: admin.email, p_note: note, p_resend: resend });
      if (error || !dec) return json(req, { ok: false, error: "decide_failed" }, 500);
      if (!dec.ok) return json(req, { ok: false, error: dec.error, status: dec.status }, dec.error === "not_found" ? 404 : 409);

      const app = await loadApp(id);
      if (!app) return json(req, { ok: false, error: "not_found" }, 404);
      const { data: link } = await supa.from("student_workshop_links").select("url").eq("workshop", app.workshop).maybeSingle();
      if (!link?.url) return json(req, { ok: false, error: "link_missing", status: app.status, message: "Approved, but no student payment link is configured for this workshop." }, 500);

      const mail = approval(app, link.url);
      const row = await enqueue(id, "approval", `approval:${id}:${dec.seq}`, [app.email], mail.subject, mail.text);
      if (!row) return json(req, { ok: false, error: "enqueue_failed" }, 500);
      const r = await deliver(row, admin.email, cfg);
      const fresh = await loadApp(id);
      return json(req, { ok: true, status: fresh?.status, emailSent: r.sent, emailError: r.error || null, retried: !!dec.retry, resent: !!dec.resend });
    }

    case "reject": {
      if (!UUID_RE.test(id)) return json(req, { ok: false, error: "bad_id" }, 400);
      const { data: dec, error } = await supa.rpc("student_workshop_decide", { p_id: id, p_action: "reject", p_admin: admin.email, p_note: note, p_resend: false });
      if (error || !dec) return json(req, { ok: false, error: "decide_failed" }, 500);
      if (!dec.ok) return json(req, { ok: false, error: dec.error, status: dec.status }, dec.error === "not_found" ? 404 : 409);
      let emailSent: boolean | null = null; let emailError: string | null = null;
      if (b.sendEmail !== false) {
        const app = await loadApp(id);
        if (app) {
          const msg = typeof b.studentMessage === "string" ? b.studentMessage.slice(0, 500) : "";
          const mail = rejection(app, msg);
          const row = await enqueue(id, "rejection", `rejection:${id}`, [app.email], mail.subject, mail.text);
          if (row) { const r = await deliver(row, admin.email, cfg); emailSent = r.sent; emailError = r.error || null; }
        }
      }
      return json(req, { ok: true, status: "Rejected", emailSent, emailError });
    }

    case "retry_email": {
      const oid = typeof b.outboxId === "string" ? b.outboxId : "";
      if (!UUID_RE.test(oid)) return json(req, { ok: false, error: "bad_id" }, 400);
      const { data: row } = await supa.from("student_workshop_outbox").select("*").eq("id", oid).maybeSingle();
      if (!row) return json(req, { ok: false, error: "not_found" }, 404);
      const r = await deliver(row as OutboxRow, admin.email, cfg);
      await audit((row as OutboxRow).application_id, admin.email, "email_retry", `${(row as OutboxRow).kind}: ${r.sent ? "sent" : r.error}`);
      return json(req, { ok: true, emailSent: r.sent, emailError: r.error || null });
    }

    case "delete_id": {
      if (!UUID_RE.test(id)) return json(req, { ok: false, error: "bad_id" }, 400);
      const app = await loadApp(id);
      if (!app) return json(req, { ok: false, error: "not_found" }, 404);
      if (app.id_path && !app.id_deleted_at) {
        const rm = await supa.storage.from(BUCKET).remove([app.id_path as string]);
        if (rm.error) return json(req, { ok: false, error: "delete_failed" }, 500);
        await supa.from("student_workshop_applications").update({ id_deleted_at: new Date().toISOString() }).eq("id", id);
        await audit(id, admin.email, "id_deleted", "document removed from storage");
      }
      return json(req, { ok: true });
    }

    case "purge_expired":
      return json(req, { ok: true, removed: await purgeExpired(admin.email) });

    default:
      return json(req, { ok: false, error: "unknown_action" }, 400);
  }
}

// ───────── entry ─────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { ok: false, error: "method_not_allowed" }, 405);
  try {
    const ct = (req.headers.get("content-type") || "").toLowerCase();
    if (ct.startsWith("multipart/form-data")) return await handleRegister(req);
    if (ct.startsWith("application/json")) return await handleAdmin(req);
    return json(req, { ok: false, error: "unsupported_content_type" }, 415);
  } catch (e) {
    console.error("unhandled", e);
    return json(req, { ok: false, error: "server_error" }, 500);
  }
});
