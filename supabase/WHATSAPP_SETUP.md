# Studio booking → WhatsApp notifications & confirmation

When a visitor books the studio, the office gets a WhatsApp message with the
booking details and two buttons — **✅ Confirm** and **❌ Cancel**. Tapping a
button updates the booking's `status` in the database (`confirmed` / `cancelled`)
and sends a confirmation reply back in WhatsApp. No web dashboard needed.

## Pieces (already built)

| Piece | Where | Status |
|-------|-------|--------|
| `studio_bookings` table + booking RPCs | Supabase `thespians-tribe` | ✅ live |
| AFTER INSERT trigger → calls `wa-notify` via `pg_net` | Supabase | ✅ live |
| `wa-notify` edge function (sends the alert) | `supabase/functions/wa-notify` | ⬜ deploy |
| `wa-webhook` edge function (handles button taps) | `supabase/functions/wa-webhook` | ⬜ deploy |

## What you need to do (one-time)

### 1. WhatsApp Cloud API (Meta)
1. Go to <https://developers.facebook.com> → create an app → add the **WhatsApp** product.
2. Note the **Phone number ID** and the **WhatsApp Business number**.
3. Create a **permanent access token** (System User token with `whatsapp_business_messaging`).

### 2. Create the message template
In WhatsApp Manager → **Message templates** → create:
- **Name:** `studio_booking_alert`
- **Category:** Utility
- **Language:** English
- **Body:** `New studio booking 🎭 {{1}}`
- **Buttons:** two **Quick reply** buttons — label them `✅ Confirm` and `❌ Cancel`.

Wait for it to be **Approved** (usually minutes).

### 3. Set Edge Function secrets (Supabase → Project → Edge Functions → Secrets)
| Secret | Value |
|--------|-------|
| `WHATSAPP_TOKEN` | your permanent access token |
| `WHATSAPP_PHONE_NUMBER_ID` | from step 1 |
| `OFFICE_WHATSAPP` | office number in E.164 **without +** (e.g. `9198XXXXXXXX`) |
| `WHATSAPP_VERIFY_TOKEN` | (value shared privately) |
| `WA_INTERNAL_SECRET` | (value shared privately — must match the DB trigger) |
| `WHATSAPP_TEMPLATE` | `studio_booking_alert` (optional; this is the default) |

### 4. Deploy the two functions
Either approve the assistant's deploy, or from the repo root:
```
supabase functions deploy wa-notify --no-verify-jwt
supabase functions deploy wa-webhook --no-verify-jwt
```

### 5. Point the webhook at `wa-webhook`
In the Meta app → WhatsApp → **Configuration** → Webhook:
- **Callback URL:** `https://qgxgvyoosvbwmnnxggqz.supabase.co/functions/v1/wa-webhook`
- **Verify token:** the `WHATSAPP_VERIFY_TOKEN` value
- **Subscribe** to the `messages` field.

## Test
Make a booking on <https://aniradichita.com/studio.html>. The office number
should receive the alert; tapping Confirm/Cancel updates the booking and replies.
