// Receives WhatsApp Cloud API webhooks. When the office taps the Confirm/Cancel
// button on a booking alert, this updates the booking status and replies in
// WhatsApp confirming the action. Set this function's URL as the webhook
// callback in the Meta app, with WHATSAPP_VERIFY_TOKEN as the verify token.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const GRAPH = "https://graph.facebook.com/v21.0";

async function sendText(to: string, text: string) {
  const token = Deno.env.get("WHATSAPP_TOKEN");
  const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  if (!token || !phoneId) return;
  await fetch(`${GRAPH}/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } }),
  });
}

function fmtHour(h: number): string {
  const ampm = h < 12 ? "AM" : "PM";
  let hh = h % 12; if (hh === 0) hh = 12;
  return `${hh}:00 ${ampm}`;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // 1) Webhook verification handshake (GET).
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === Deno.env.get("WHATSAPP_VERIFY_TOKEN")) {
      return new Response(challenge || "", { status: 200 });
    }
    return new Response("forbidden", { status: 403 });
  }

  // 2) Incoming events (POST). Always return 200 so WhatsApp doesn't retry-storm.
  try {
    const body = await req.json();
    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    for (const entry of body.entry || []) {
      for (const ch of entry.changes || []) {
        const val = ch.value || {};
        for (const m of val.messages || []) {
          let payload: string | null = null;
          if (m.type === "button" && m.button) payload = m.button.payload;          // template quick-reply
          else if (m.type === "interactive" && m.interactive?.button_reply) payload = m.interactive.button_reply.id;
          if (!payload) continue;

          const [action, id] = payload.split(":");
          if ((action !== "confirm" && action !== "cancel") || !id) continue;
          const from = m.from || val.contacts?.[0]?.wa_id;
          const newStatus = action === "confirm" ? "confirmed" : "cancelled";

          const { data: b } = await supa
            .from("studio_bookings").select("*").eq("id", id).single();
          if (!b) {
            if (from) await sendText(from, "That booking could not be found (it may have been removed).");
            continue;
          }
          if (b.status !== "pending") {
            if (from) await sendText(from, `ℹ️ This booking is already ${b.status}. No change made.`);
            continue;
          }
          await supa.from("studio_bookings").update({ status: newStatus }).eq("id", id);
          if (from) {
            const emoji = newStatus === "confirmed" ? "✅" : "❌";
            await sendText(
              from,
              `${emoji} Booking ${newStatus.toUpperCase()}\n${b.guest_name} — ${b.booking_date}\n${fmtHour(b.start_hour)} to ${fmtHour(b.start_hour + b.duration)} (${b.duration}h)\nRs ${b.total_price} · ${b.guest_phone}`,
            );
          }
        }
      }
    }
    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response("ok", { status: 200 });
  }
});
