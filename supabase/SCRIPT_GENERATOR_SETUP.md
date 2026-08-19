# AI Script Generator setup (Services page)

The generator on <https://aniradichita.com/services.html> runs on the
`generate-script` edge function, which calls the **Google Gemini API**
(free tier — no credit card, no visitor login).

The function is **deployed**. To switch it on, add one secret:

1. Create a free API key at <https://aistudio.google.com/apikey> (sign in with a
   Google account → "Create API key"). No billing required for the free tier.
2. In Supabase → Project `thespians-tribe` → Edge Functions → **Secrets**, add:
   - `GEMINI_API_KEY` = the key from step 1
   - `GEMINI_MODEL` = `gemini-2.0-flash` (optional; this is the default)
3. That's it — the generator goes live immediately. Test it on the Services page.

**How it works:** the browser builds the creative prompt from the form and POSTs
it to `generate-script`; the function calls Gemini with the key (kept server-side)
and returns the generated concept. Until the key is set, the page shows a friendly
"being switched on" message instead of erroring.

Free-tier limits (Gemini 2.0 Flash) are generous for a marketing tool; if you ever
outgrow them, add billing to the same Google key or switch `GEMINI_MODEL`.
