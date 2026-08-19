# Supabase backend for aniradichita.com

Studio booking backend for the ATFA studio page.

- `functions/wa-notify` — sends the office a WhatsApp alert (Confirm/Cancel buttons) on each new booking.
- `functions/wa-webhook` — handles the button taps, updates booking status, replies in WhatsApp.
- See `WHATSAPP_SETUP.md` for one-time configuration.

The booking table (`studio_bookings`) and RPCs (`get_studio_availability`,
`create_studio_booking`) plus the notify trigger live in the Supabase project
`thespians-tribe` (ref qgxgvyoosvbwmnnxggqz). Secrets are NOT stored in this repo.
