// Run with:  node --test supabase/functions/student-workshop/student-workshop.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkFileMeta, MAX_ID_BYTES, sniffFile, validateFields, WORKSHOPS } from "./validate.ts";
import { approval, rejection, studentAck, teamNotification } from "./templates.ts";
import { buildMime, encodeHeader, sendMail } from "./mail.ts";

const good = { full_name: "Asha Patel", email: "Asha@Example.com", phone: "+91 98765 43210", institution: "MSU Baroda", course_year: "B.Com, 2nd year", city: "Vadodara", workshop: "acting", consent: "true" };

function pdf(extra = ""): Uint8Array { return new TextEncoder().encode("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n" + extra + "\n%%EOF"); }
const jpg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0xff, 0xd9]);
const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);

test("fields: valid input is normalised", () => {
  const r = validateFields(good);
  assert.equal(r.ok, true);
  if (r.ok) { assert.equal(r.value.email, "asha@example.com"); assert.equal(r.value.workshop, "acting"); }
});
test("fields: every required field is enforced", () => {
  const r = validateFields({});
  assert.equal(r.ok, false);
  if (!r.ok) for (const k of ["full_name", "email", "phone", "institution", "course_year", "city", "workshop", "consent"]) assert.ok(r.errors[k], k);
});
test("fields: bad email, phone, workshop and missing consent", () => {
  for (const [k, v] of [["email", "nope"], ["phone", "abc"], ["phone", "12"], ["workshop", "everything"], ["consent", "false"]] as const) {
    const r = validateFields({ ...good, [k]: v });
    assert.equal(r.ok, false, `${k}=${v}`);
    if (!r.ok) assert.ok(r.errors[k]);
  }
});
test("fields: all three workshops are accepted and mapped", () => {
  for (const w of Object.keys(WORKSHOPS)) assert.equal(validateFields({ ...good, workshop: w }).ok, true);
});
test("fields: control characters and header injection are stripped", () => {
  const r = validateFields({ ...good, full_name: "Asha\r\nBcc: evil@x.com" });
  assert.equal(r.ok, true);
  if (r.ok) assert.ok(!/[\r\n]/.test(r.value.full_name));
});

test("file: accepts real PDF, JPG and PNG", () => {
  assert.deepEqual(sniffFile(pdf(), "id.pdf"), { ok: true, mime: "application/pdf", ext: "pdf" });
  assert.deepEqual(sniffFile(jpg, "id.JPG"), { ok: true, mime: "image/jpeg", ext: "jpg" });
  assert.deepEqual(sniffFile(jpg, "id.jpeg"), { ok: true, mime: "image/jpeg", ext: "jpg" });
  assert.deepEqual(sniffFile(png, "id.png"), { ok: true, mime: "image/png", ext: "png" });
});
test("file: rejects wrong types and disguised files", () => {
  assert.equal(sniffFile(new TextEncoder().encode("MZ\x90\x00 exe"), "id.pdf").ok, false);     // exe renamed
  assert.equal(sniffFile(new TextEncoder().encode("<html><script>alert(1)</script>"), "id.png").ok, false);
  assert.equal(sniffFile(png, "id.pdf").ok, false);                                            // extension lies
  assert.equal(sniffFile(jpg, "id.png").ok, false);
  assert.equal(sniffFile(new Uint8Array(0), "id.pdf").ok, false);
});
test("file: rejects PDFs with scripts / embedded files and images with hidden markup", () => {
  assert.equal(sniffFile(pdf("<</S/JavaScript/JS(app.alert(1))>>"), "id.pdf").ok, false);
  assert.equal(sniffFile(pdf("/Type/EmbeddedFile"), "id.pdf").ok, false);
  assert.equal(sniffFile(pdf("/Launch"), "id.pdf").ok, false);
  const evil = new Uint8Array([...jpg, ...new TextEncoder().encode("<script>x</script>")]);
  assert.equal(sniffFile(evil, "id.jpg").ok, false);
});
test("file: size and type limits (client-style metadata check)", () => {
  assert.equal(checkFileMeta("id.pdf", MAX_ID_BYTES, "application/pdf").ok, true);
  assert.equal(checkFileMeta("id.pdf", MAX_ID_BYTES + 1, "application/pdf").ok, false);
  assert.equal(checkFileMeta("id.pdf", 0, "application/pdf").ok, false);
  assert.equal(checkFileMeta("id.exe", 100, "application/pdf").ok, false);
  assert.equal(checkFileMeta("id.pdf", 100, "text/html").ok, false);
  assert.equal(sniffFile(new Uint8Array(MAX_ID_BYTES + 1), "id.pdf").ok, false);
});
test("file: a big compressed-looking PDF is not falsely rejected", () => {
  const head = new TextEncoder().encode("%PDF-1.7\n"), tail = new TextEncoder().encode("\n%%EOF");
  const all = new Uint8Array(head.length + 4 * 1024 * 1024 + tail.length);
  all.set(head, 0);
  for (let o = head.length; o < all.length - tail.length; o += 65536) crypto.getRandomValues(all.subarray(o, Math.min(o + 65536, all.length - tail.length)));
  all.set(tail, all.length - tail.length);
  // random bytes can contain odd sequences; that must not matter (the active-content tokens are far too long to appear by chance)
  assert.equal(sniffFile(all, "scan.pdf").ok, true);
});

const app = { app_code: "SW-261110-ABCDE", full_name: "Asha Patel", email: "asha@example.com", phone: "+91 98765 43210", institution: "MSU Baroda", course_year: "B.Com, 2nd year", city: "Vadodara", workshop: "combo" as const, created_at: "2026-11-10T08:30:00Z" };

test("templates: team notification has every required detail and no payment link", () => {
  const t = teamNotification(app, "https://aniradichita.com/admin/student-applications");
  assert.equal(t.subject, "New Student Registration – Acting + Filmmaking Combo – Asha Patel");
  for (const s of ["Asha Patel", "asha@example.com", "+91 98765 43210", "MSU Baroda", "B.Com, 2nd year", "Vadodara", "Acting + Filmmaking Combo", "SW-261110-ABCDE", "14:00".slice(0, 0) + "IST", "admin/student-applications?app=SW-261110-ABCDE"]) assert.ok(t.text.includes(s), s);
  assert.ok(!/rzp\.io|razorpay/i.test(t.text));
});
test("templates: student acknowledgement has no payment link", () => {
  const t = studentAck(app);
  assert.equal(t.subject, "Student Registration Application Received – Aniradichita");
  assert.ok(t.text.includes("Hello Asha Patel,") && t.text.includes("does not confirm your participation"));
  assert.ok(!/rzp\.io|razorpay|https?:\/\//i.test(t.text));
});
test("templates: approval carries exactly the given link; rejection hides internal notes", () => {
  const a = approval(app, "https://example.test/pay");
  assert.equal(a.subject, "Student Application Approved – Acting + Filmmaking Combo – Aniradichita");
  assert.ok(a.text.includes("https://example.test/pay"));
  const r = rejection(app, "Please re-apply with a clearer photo.");
  assert.ok(r.text.includes("clearer photo") && !/rzp\.io|razorpay/i.test(r.text));
  assert.ok(!r.text.toLowerCase().includes("internal"));
});

test("mail: MIME headers are right and non-ASCII is encoded", () => {
  const raw = buildMime({ from: "aniket.pandya.3991@gmail.com", fromName: "Aniradichita Theatre & Films", to: ["team@aniradichita.com", "medhathakkar27@gmail.com"], subject: "New Student Registration – Acting Workshop – Asha", text: "Hello – body" });
  assert.match(raw, /^From: Aniradichita Theatre & Films <aniket\.pandya\.3991@gmail\.com>\r\n/);
  assert.match(raw, /\r\nTo: team@aniradichita\.com, medhathakkar27@gmail\.com\r\n/);
  assert.match(raw, /\r\nSubject: =\?UTF-8\?B\?/);
  assert.equal(encodeHeader("plain"), "plain");
  assert.throws(() => buildMime({ from: "a@b.co", to: ["x@y.co\r\nBcc: z@z.co"], subject: "s", text: "t" }));
});

function fakeFetch(opts: { token?: boolean; profile?: string; send?: boolean } = {}) {
  const calls: { url: string; body?: string; auth?: string }[] = [];
  const f = async (url: string, init?: RequestInit) => {
    calls.push({ url, body: init?.body as string, auth: (init?.headers as Record<string, string>)?.Authorization });
    if (url.includes("oauth2.googleapis.com")) return opts.token === false ? new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 }) : new Response(JSON.stringify({ access_token: "tok123" }));
    if (url.endsWith("/profile")) return opts.profile ? new Response(JSON.stringify({ emailAddress: opts.profile })) : new Response("{}", { status: 403 });
    if (url.endsWith("/messages/send")) return opts.send === false ? new Response(JSON.stringify({ error: { message: "quota" } }), { status: 429 }) : new Response(JSON.stringify({ id: "msg1" }));
    return new Response("{}", { status: 404 });
  };
  return { f, calls };
}
const mailMsg = { from: "aniket.pandya.3991@gmail.com", to: ["team@aniradichita.com"], subject: "Hi – there", text: "Body" };
const envOk = (k: string) => ({ GMAIL_CLIENT_ID: "cid", GMAIL_CLIENT_SECRET: "sec", GMAIL_REFRESH_TOKEN: "rt" } as Record<string, string>)[k];

test("mail: not configured -> nothing is sent", async () => {
  const { f, calls } = fakeFetch();
  const r = await sendMail(() => undefined, mailMsg, f);
  assert.deepEqual(r, { ok: false, error: "email_not_configured" });
  assert.equal(calls.length, 0);
});
test("mail: sends through Gmail with the refreshed token", async () => {
  const { f, calls } = fakeFetch();
  const r = await sendMail(envOk, mailMsg, f);
  assert.deepEqual(r, { ok: true, id: "msg1" });
  const send = calls.find((c) => c.url.endsWith("/messages/send"))!;
  assert.equal(send.auth, "Bearer tok123");
  const raw = Buffer.from(JSON.parse(send.body!).raw, "base64url").toString("utf8");
  assert.match(raw, /From: aniket\.pandya\.3991@gmail\.com/);
  assert.match(calls[0].body!, /grant_type=refresh_token/);
});
test("mail: refuses to send as a different Gmail account", async () => {
  const { f, calls } = fakeFetch({ profile: "someone.else@gmail.com" });
  const r = await sendMail(envOk, mailMsg, f);
  assert.equal(r.ok, false);
  assert.ok(!calls.some((c) => c.url.endsWith("/messages/send")));
});
test("mail: auth and send failures are reported, not swallowed", async () => {
  assert.equal((await sendMail(envOk, mailMsg, fakeFetch({ token: false }).f)).ok, false);
  const r = await sendMail(envOk, mailMsg, fakeFetch({ send: false }).f);
  assert.equal(r.ok, false);
  if (!r.ok) assert.match(r.error, /gmail_send_failed/);
});
