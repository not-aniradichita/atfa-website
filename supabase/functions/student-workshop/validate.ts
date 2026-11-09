// Pure validation helpers for the student registration (no Deno / network APIs, so they are unit-tested in Node).

export const MAX_ID_BYTES = 5 * 1024 * 1024; // 5 MB

export type WorkshopId = "acting" | "filmmaking" | "combo";

export const WORKSHOPS: Record<WorkshopId, { name: string; dates: string }> = {
  acting: { name: "Acting Workshop", dates: "20 & 21 November 2026" },
  filmmaking: { name: "Filmmaking Workshop", dates: "22 November 2026" },
  combo: { name: "Acting + Filmmaking Combo", dates: "20–22 November 2026" },
};

export function isWorkshop(v: unknown): v is WorkshopId {
  return typeof v === "string" && Object.prototype.hasOwnProperty.call(WORKSHOPS, v);
}

export interface StudentFields {
  full_name: string;
  email: string;
  phone: string;
  institution: string;
  course_year: string;
  city: string;
  workshop: WorkshopId;
}

/** Trim, drop control characters (keeps normal punctuation and any language), squash runs of spaces. */
export function cleanText(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  // deno-lint-ignore no-control-regex
  return v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_RE = /^[0-9+()\-\s.]+$/;

export type FieldErrors = Record<string, string>;

export function validateFields(raw: Record<string, unknown>):
  | { ok: true; value: StudentFields }
  | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const full_name = cleanText(raw.full_name, 120);
  const email = cleanText(raw.email, 254).toLowerCase();
  const phone = cleanText(raw.phone, 30);
  const institution = cleanText(raw.institution, 160);
  const course_year = cleanText(raw.course_year, 120);
  const city = cleanText(raw.city, 80);
  const workshop = typeof raw.workshop === "string" ? raw.workshop.trim() : "";

  if (!full_name) errors.full_name = "Please write your full name.";
  if (!EMAIL_RE.test(email) || email.length > 254) errors.email = "Please write an email like name@example.com.";
  const digits = phone.replace(/\D/g, "");
  if (!PHONE_RE.test(phone) || digits.length < 7 || digits.length > 15) {
    errors.phone = "Please write a phone number with 7 to 15 numbers. You can use +, spaces and dashes.";
  }
  if (!institution) errors.institution = "Please write your school or college name.";
  if (!course_year) errors.course_year = "Please write your course or class and your year of study.";
  if (!city) errors.city = "Please write your city.";
  if (!isWorkshop(workshop)) errors.workshop = "Please choose a workshop.";
  const consent = raw.consent === true || raw.consent === "true" || raw.consent === "on" || raw.consent === "1";
  if (!consent) errors.consent = "Please tick this box so we can go ahead.";

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: { full_name, email, phone, institution, course_year, city, workshop: workshop as WorkshopId } };
}

// ───────── ID document checks ─────────

export interface SniffResult {
  ok: boolean;
  mime?: "application/pdf" | "image/jpeg" | "image/png";
  ext?: "pdf" | "jpg" | "png";
  reason?: string;
}

const ALLOWED_DECLARED = new Set(["application/pdf", "image/jpeg", "image/jpg", "image/png", "application/octet-stream", ""]);

/** Quick checks on what the browser told us (name/size/type) before reading the bytes. */
export function checkFileMeta(name: string, size: number, declaredType: string): { ok: true } | { ok: false; reason: string } {
  if (!size || size <= 0) return { ok: false, reason: "The file is empty." };
  if (size > MAX_ID_BYTES) return { ok: false, reason: "The file is bigger than 5 MB. Please choose a smaller file." };
  if (!/\.(pdf|jpe?g|png)$/i.test(name || "")) return { ok: false, reason: "Please upload a PDF, JPG, JPEG or PNG file." };
  if (!ALLOWED_DECLARED.has((declaredType || "").toLowerCase())) return { ok: false, reason: "Please upload a PDF, JPG, JPEG or PNG file." };
  return { ok: true };
}

function latin1(bytes: Uint8Array, from = 0, to = bytes.length): string {
  let s = "";
  const end = Math.min(to, bytes.length);
  for (let i = from; i < end; i += 8192) {
    s += String.fromCharCode(...bytes.subarray(i, Math.min(i + 8192, end)));
  }
  return s;
}

const PDF_ACTIVE = /\/(JavaScript|JS|Launch|EmbeddedFile|RichMedia|XFA|SubmitForm|ImportData)\b/;
const EMBEDDED_MARKUP = /<\s*(script|\?php|html|svg|iframe|object|embed)\b/i;

/**
 * Decides the real type from the file's first bytes (the browser-supplied type and extension are not trusted)
 * and rejects files that carry active content. This is a heuristic safety net, not a virus scanner.
 */
export function sniffFile(bytes: Uint8Array, name = ""): SniffResult {
  if (bytes.length > MAX_ID_BYTES) return { ok: false, reason: "The file is bigger than 5 MB. Please choose a smaller file." };
  const ext = (/\.([a-z0-9]+)$/i.exec(name)?.[1] || "").toLowerCase();
  let kind: SniffResult | null = null;

  if (bytes.length > 5 && latin1(bytes, 0, 5) === "%PDF-") {
    const text = latin1(bytes);
    if (PDF_ACTIVE.test(text)) {
      return { ok: false, reason: "This PDF contains scripts or embedded content, so we cannot accept it. Please upload a plain PDF, or a photo or scan." };
    }
    kind = { ok: true, mime: "application/pdf", ext: "pdf" };
  } else if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    kind = { ok: true, mime: "image/jpeg", ext: "jpg" };
  } else if (
    bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    kind = { ok: true, mime: "image/png", ext: "png" };
  }
  if (!kind) return { ok: false, reason: "This does not look like a real PDF, JPG or PNG file." };

  if (kind.mime !== "application/pdf" && EMBEDDED_MARKUP.test(latin1(bytes))) {
    return { ok: false, reason: "This image contains hidden code, so we cannot accept it. Please upload a normal photo or scan." };
  }
  // the extension has to agree with what the file really is
  const okExt = kind.ext === "jpg" ? ext === "jpg" || ext === "jpeg" : ext === kind.ext;
  if (!okExt) return { ok: false, reason: "The file name does not match the file type. Please upload a PDF, JPG, JPEG or PNG file." };
  return kind;
}

export function randomToken(len = 10): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let s = "";
  for (const b of bytes) s += alphabet[b % alphabet.length];
  return s;
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
