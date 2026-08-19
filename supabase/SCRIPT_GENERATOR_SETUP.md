# AI Script Generator setup (Services page)

The generator on <https://aniradichita.com/services.html> runs on the
`generate-script` edge function, which calls the **Google Gemini API**
(free tier — no credit card, no visitor login).

The function is **deployed**. To switch it on, add one secret:

1. Create a free API key at <https://aistudio.google.com/apikey> (sign in with a
   Google account → "Create API key"). No billing required for the free tier.
2. In Supabase → Project `thespians-tribe` → Edge Functions → **Secrets**, add:
   - `GEMINI_API_KEY` = the key from step 1
   - `GEMINI_MODEL` = `gemini-3.6-flash` (optional; this is the default)
3. That's it — the generator goes live immediately. Test it on the Services page.

**How it works:** the browser builds the creative prompt from the form and POSTs
it to `generate-script`; the function calls Gemini with the key (kept server-side)
and returns the generated concept. Until the key is set, the page shows a friendly
"being switched on" message instead of erroring.

Free-tier limits (Gemini 2.0 Flash) are generous for a marketing tool; if you ever
outgrow them, add billing to the same Google key or switch `GEMINI_MODEL`.

## Lead capture

Every generation requires the visitor's **name, phone and email**, and each one is
stored in the `public.script_leads` table together with the inputs and the
generated script. You can view/export these any time from the Supabase dashboard
(Table editor → `script_leads`). This works as soon as `GEMINI_API_KEY` is set —
no extra configuration.

## Emailing each lead to aniket@aniradichita.com

The auto-email step is intentionally **not wired yet** — sending your visitors'
personal details to an outside service is your decision. Pick one:

1. **Your own mailer (recommended, private):** create a free Resend account
   (<https://resend.com>), verify the `aniradichita.com` domain (DNS records), set
   `RESEND_API_KEY` as an edge-function secret. Then the function emails aniket@ on
   every generation. Cleanest and keeps data with a provider you control.
2. **Keyless form-mail (fastest):** use FormSubmit/Web3Forms — no key, but the lead
   data passes through that third party and aniket confirms activation once.
3. **WhatsApp instead of email:** reuse the WhatsApp backend already built to send
   each lead + script to the office number.

Tell the assistant which route and it will wire it in. Until then, no leads are
lost — they are all in `script_leads`.
