// Email wording (plain text). Pure functions, unit-tested in Node.
import { WORKSHOPS } from "./validate.ts";
import type { WorkshopId } from "./validate.ts";

export interface AppForEmail {
  app_code: string;
  full_name: string;
  email: string;
  phone: string;
  institution: string;
  course_year: string;
  city: string;
  workshop: WorkshopId;
  created_at: string;
}

export const SIGN_OFF = "Regards,\nTeam Aniradichita Theatre & Films Association";

export function workshopName(w: WorkshopId): string {
  return WORKSHOPS[w].name;
}

export function formatIst(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "long", timeStyle: "short" }).format(d) + " IST";
}

/** Keeps names/ids from breaking a header line. */
export function headerSafe(s: string): string {
  // U+2028 / U+2029 are built from char codes so the source stays plain ASCII (raw ones break JS parsers)
  return s.replace(/[\r\n]+/g, " ").split(String.fromCharCode(0x2028)).join(" ").split(String.fromCharCode(0x2029)).join(" ").trim();
}

export function teamNotification(app: AppForEmail, adminUrl: string) {
  const w = workshopName(app.workshop);
  return {
    subject: headerSafe(`New Student Registration – ${w} – ${app.full_name}`),
    text: [
      "A new student registration application has been submitted.",
      "",
      `Applicant: ${app.full_name}`,
      `Email: ${app.email}`,
      `Phone: ${app.phone}`,
      `School/college: ${app.institution}`,
      `Course/class and year: ${app.course_year}`,
      `City: ${app.city}`,
      `Selected workshop: ${w} (${WORKSHOPS[app.workshop].dates})`,
      `Application ID: ${app.app_code}`,
      `Submitted: ${formatIst(app.created_at)}`,
      "",
      "ID card: stored privately (it is NOT attached to this email).",
      "Open it securely (admin sign-in required):",
      `${adminUrl}?app=${encodeURIComponent(app.app_code)}`,
      "",
      "Status: Pending Verification. The student has not been sent any payment link.",
    ].join("\n"),
  };
}

export function studentAck(app: AppForEmail) {
  return {
    subject: "Student Registration Application Received – Aniradichita",
    text: [
      `Hello ${headerSafe(app.full_name)},`,
      "",
      "Thank you for applying for the Aniradichita Acting & Filmmaking Workshop!",
      "",
      `We have received your student registration application for ${workshopName(app.workshop)}.`,
      "",
      "Our team will verify your school/college ID and review your application. Once approved, you will receive an email containing your student registration payment link.",
      "",
      "Please note that submitting this form does not confirm your participation.",
      "",
      `Your application ID: ${app.app_code}`,
      "",
      SIGN_OFF,
    ].join("\n"),
  };
}

export function approval(app: AppForEmail, paymentLink: string) {
  const w = workshopName(app.workshop);
  return {
    subject: headerSafe(`Student Application Approved – ${w} – Aniradichita`),
    text: [
      `Hello ${headerSafe(app.full_name)},`,
      "",
      `Great news! Your student application for the Aniradichita ${w} has been approved.`,
      "",
      "You can now complete your registration using the student payment link below:",
      "",
      paymentLink,
      "",
      "Your participation will be confirmed according to successful payment and the event's registration terms.",
      "",
      "We look forward to welcoming you!",
      "",
      SIGN_OFF,
    ].join("\n"),
  };
}

/** Polite rejection. Internal notes are never included; an optional message written for the student may be. */
export function rejection(app: AppForEmail, studentMessage?: string, regularUrl = "https://aniradichita.com/events/acting-filmmaking-workshop") {
  const w = workshopName(app.workshop);
  const extra = studentMessage && studentMessage.trim() ? ["", studentMessage.trim()] : [];
  return {
    subject: headerSafe(`Student Application Update – ${w} – Aniradichita`),
    text: [
      `Hello ${headerSafe(app.full_name)},`,
      "",
      `Thank you for your interest in the Aniradichita ${w}.`,
      "",
      "We were not able to approve your student registration application this time, as we could not verify your student eligibility from the details and ID provided.",
      ...extra,
      "",
      "You are welcome to apply again with a clear, valid school/college ID. You can also register through the regular registration options on the event page:",
      regularUrl,
      "",
      "Thank you for understanding.",
      "",
      SIGN_OFF,
    ].join("\n"),
  };
}
