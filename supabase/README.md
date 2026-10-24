# Supabase backend for aniradichita.com

Studio booking backend for the ATFA studio page.

- `functions/wa-notify` — sends the office a WhatsApp alert (Confirm/Cancel buttons) on each new booking.
- `functions/wa-webhook` — handles the button taps, updates booking status, replies in WhatsApp.
- See `WHATSAPP_SETUP.md` for one-time configuration.

The booking table (`studio_bookings`) and RPCs (`get_studio_availability`,
`create_studio_booking`) plus the notify trigger live in the Supabase project
`thespians-tribe` (ref qgxgvyoosvbwmnnxggqz). Secrets are NOT stored in this repo.

## SAANJH performer registration

- `migrations/20261024_saanjh_performer_applications.sql` — creates `public.saanjh_performer_applications` and the
  `submit_saanjh_performer_application(...)` function (already applied to the live project).
- The page `events/saanjh/register/performer` calls that function with the public anon key (config:
  `performerRegistration.endpoint` in `events-data.js`). The anon key can only **submit**; the table has RLS on, no
  policies and no public grants, so applications cannot be read or changed from the website.
- View applications in Supabase -> Table editor -> `saanjh_performer_applications` (they contain names, phone numbers and
  emails: treat them as private). No email/WhatsApp alert is wired yet.
- The function re-checks every field, ignores bot submissions (hidden `p_website` field) and refuses a second
  application with the same email + performance title.
