// AI script-concept generator for the Services page.
// The public site can't use window.claude (that only exists inside Claude's
// preview sandbox), so generation runs here against the Google Gemini API,
// with the key kept server-side. Set GEMINI_API_KEY as an edge-function secret.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.0-flash";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const key = Deno.env.get("GEMINI_API_KEY");
    if (!key) {
      return new Response(JSON.stringify({ error: "not_configured" }), {
        status: 200, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { prompt } = await req.json().catch(() => ({ prompt: "" }));
    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 5) {
      return new Response(JSON.stringify({ error: "bad_prompt" }), {
        status: 200, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    // Guard against abuse of the public endpoint.
    const safePrompt = prompt.slice(0, 6000);

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
      return new Response(JSON.stringify({ error: "upstream", detail: data?.error?.message }), {
        status: 200, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || "";
    return new Response(JSON.stringify({ text }), {
      status: 200, headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "server", detail: String(e) }), {
      status: 200, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
