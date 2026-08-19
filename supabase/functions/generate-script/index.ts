// AI script-concept generator for the Services page.
// 1) Generates a script with the Google Gemini API (key kept server-side).
// 2) Captures the requester's name/phone/email + inputs + script in
//    public.script_leads so the office has every lead.
// Secret required: GEMINI_API_KEY. Optional: GEMINI_MODEL.
//
// NOTE: automatic email of each lead to the office is added separately once an
// email route is chosen (see supabase/SCRIPT_GENERATOR_SETUP.md). Leads are
// captured in the DB regardless.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.0-flash";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });

async function captureLead(
  contact: { name?: string; phone?: string; email?: string },
  meta: Record<string, string>,
  script: string,
) {
  try {
    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    await supa.from("script_leads").insert({
      name: contact.name ?? null,
      phone: contact.phone ?? null,
      email: contact.email ?? null,
      company: meta.company ?? null,
      audience: meta.audience ?? null,
      art_form: meta.art_form ?? null,
      genre: meta.genre ?? null,
      language: meta.language ?? null,
      duration: meta.duration ?? null,
      idea: meta.idea ?? null,
      script,
    });
  } catch (e) {
    console.error("DB insert error:", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const key = Deno.env.get("GEMINI_API_KEY");
    if (!key) return json({ error: "not_configured" });

    const { prompt, contact = {}, meta = {} } = await req.json().catch(() => ({}));
    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 5) {
      return json({ error: "bad_prompt" });
    }
    const safePrompt = String(prompt).slice(0, 6000); // guard the public endpoint

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: safePrompt }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 2048 },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("Gemini error:", JSON.stringify(data));
      return json({ error: "upstream", detail: data?.error?.message });
    }
    const text: string =
      data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || "";
    if (!text) return json({ error: "empty" });

    // Capture the lead + script in the background; visitor doesn't wait on it.
    // @ts-ignore EdgeRuntime is provided by the Supabase runtime.
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(captureLead(contact, meta, text));
    } else {
      await captureLead(contact, meta, text);
    }

    return json({ text });
  } catch (e) {
    console.error(e);
    return json({ error: "server", detail: String(e) });
  }
});
