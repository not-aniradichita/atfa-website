// Sends the office a WhatsApp alert with Confirm/Cancel buttons when a new
// studio booking is created. Invoked by an AFTER INSERT trigger on
// public.studio_bookings via pg_net. Uses the WhatsApp Cloud API.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const GRAPH = "https://graph.facebook.com/v21.0";

function fmtHour(h: number): string {
  const ampm = h < 12 ? "AM" : "PM";
  let hh = h % 12;
  if (hh === 0) hh = 12;
  return `${hh}:00 ${ampm}`;
}

Deno.serve(async (req) => {
  try {
    // Internal auth: only our DB trigger (which knows the shared secret) may call this.
    const internal = Deno.env.get("WA_INTERNAL_SECRET");
    if (internal && req.headers.get("x-internal-secret") !== internal) {
      return new Response("forbidden", { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const id = body.id ?? body?.record?.id;
    if (!id) return new Response(JSON.stringify({ error: "no id" }), { status: 400 });

    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: b, error } = await supa
      .from("studio_bookings").select("*").eq("id", id).single();
    if (error || !b) {
      return new Response(JSON.stringify({ error: "booking not found" }), { status: 404 });
    }

    const token = Deno.env.get("WHATSAPP_TOKEN");
    const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    const office = Deno.env.get("OFFICE_WHATSAPP");
    const template = Deno.env.get("WHATSAPP_TEMPLATE") || "studio_booking_alert";
    if (!token || !phoneId || !office) {
      console.error("WhatsApp env not configured (WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID / OFFICE_WHATSAPP)");
      return new Response(JSON.stringify({ error: "whatsapp not configured" }), { status: 200 });
    }

    const start = fmtHour(b.start_hour);
    const end = fmtHour(b.start_hour + b.duration);
    const addons = Array.isArray(b.addons) && b.addons.length
      ? b.addons.map((a: { name?: string }) => a.name).join(", ")
      : "None";
    // Template body params cannot contain newlines, tabs or 4+ spaces — keep single line.
    const details = [
      `Date: ${b.booking_date}`,
      `Time: ${start} to ${end} (${b.duration}h)`,
      `For: ${b.purpose || "-"}`,
      `Guest: ${b.guest_name} (${b.guest_phone})`,
      `Add-ons: ${addons}`,
      `Total: Rs ${b.total_price}`,
    ].join(" | ");

    const payload = {
      messaging_product: "whatsapp",
      to: office,
      type: "template",
      template: {
        name: template,
        language: { code: "en" },
        components: [
          { type: "body", parameters: [{ type: "text", text: details }] },
          { type: "button", sub_type: "quick_reply", index: "0", parameters: [{ type: "payload", payload: `confirm:${b.id}` }] },
          { type: "button", sub_type: "quick_reply", index: "1", parameters: [{ type: "payload", payload: `cancel:${b.id}` }] },
        ],
      },
    };

    const res = await fetch(`${GRAPH}/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const out = await res.json();
    if (!res.ok) console.error("WhatsApp send failed:", JSON.stringify(out));
    return new Response(JSON.stringify({ ok: res.ok, wa: out }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 200 });
  }
});
