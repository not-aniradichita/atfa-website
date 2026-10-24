# Supabase backend for aniradichita.com

Studio booking backend for the ATFA studio page.

- `functions/wa-notify` — sends the office a WhatsApp alert (Confirm/Cancel buttons) on each new booking.
- `functions/wa-webhook` — handles the button taps, updates booking status, replies in WhatsApp.
- See `WHATSAPP_SETUP.md` for one-time configuration.

The booking table (`studio_bookings`) and RPCs (`get_studio_availability`,
`create_studio_booking`) plus the notify trigger live in the Supabase project
`thespians-tribe` (ref qgxgvyoosvbwmnnxggqz). Secrets are NOT stored in this repo.

## SAANJH performer registration (Google Form now; database part unused)

Performers now apply on a Google Form (linked from `events/saanjh/register/performer`; address in
`performerRegistration.formUrl` in `events-data.js`). The earlier on-site form is gone.

The table `public.saanjh_performer_applications` and the function `submit_saanjh_performer_application`
(`migrations/20261024_saanjh_performer_applications.sql`) are still in the Supabase project but nothing on the
website calls them any more. They hold no data (test rows were removed). Drop them whenever convenient:
`drop function public.submit_saanjh_performer_application(text,text,text,text,text,text,text,text,text,text,text,integer,text,text,text,boolean,text); drop table public.saanjh_performer_applications;`
