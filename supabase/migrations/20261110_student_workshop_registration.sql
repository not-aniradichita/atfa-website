-- Student registration & verification for the Acting & Filmmaking Workshop.
-- Project: thespians-tribe (qgxgvyoosvbwmnnxggqz). Additive only.
--
-- NOTHING here is readable or writable through the public API: every table has RLS on with no
-- policies and no grants for anon/authenticated. Only the `student-workshop` edge function
-- (service role) touches them. The student payment links are NOT in this file (the repo is public):
-- they live in student_workshop_links and were inserted separately (see supabase/STUDENT_WORKSHOP_SETUP.md).

-- ───────── applications ─────────
create table if not exists public.student_workshop_applications (
  id                   uuid primary key default gen_random_uuid(),
  app_code             text not null unique,                       -- human-friendly application ID, e.g. SW-261110-7KQ2M
  created_at           timestamptz not null default now(),
  full_name            text not null check (char_length(full_name) between 1 and 120),
  email                text not null check (char_length(email) between 3 and 254),
  phone                text not null check (char_length(phone) between 7 and 30),
  institution          text not null check (char_length(institution) between 1 and 160),
  course_year          text not null check (char_length(course_year) between 1 and 120),
  city                 text not null check (char_length(city) between 1 and 80),
  workshop             text not null check (workshop in ('acting', 'filmmaking', 'combo')),
  consent              boolean not null check (consent),
  consent_at           timestamptz not null default now(),
  consent_version      text not null default 'v1',
  -- ID document (private bucket)
  id_path              text,                                       -- object path inside the private bucket
  id_mime              text,
  id_size              integer,
  id_sha256            text,
  id_deleted_at        timestamptz,
  retention_expires_at timestamptz not null default timestamptz '2026-12-22 00:00:00+05:30',
  -- verification workflow
  status               text not null default 'Pending Verification'
                         check (status in ('Pending Verification', 'Approved', 'Rejected', 'Payment Link Sent', 'Payment Completed')),
  admin_note           text check (char_length(admin_note) <= 2000),
  decided_at           timestamptz,
  decided_by           text,
  approval_seq         integer not null default 0,                 -- bumps only when an admin explicitly re-sends
  payment_link_sent_at timestamptz,
  payment_link_sent_by text,
  ip_hash              text
);
alter table public.student_workshop_applications enable row level security;
revoke all on table public.student_workshop_applications from anon, authenticated;

-- one live application per person per workshop (a rejected one may be re-submitted)
create unique index if not exists student_workshop_applications_one_live
  on public.student_workshop_applications (lower(email), workshop)
  where status <> 'Rejected';
create index if not exists student_workshop_applications_status_idx on public.student_workshop_applications (status, created_at desc);

-- ───────── audit trail ─────────
create table if not exists public.student_workshop_events (
  id             bigint generated always as identity primary key,
  application_id uuid not null references public.student_workshop_applications(id) on delete cascade,
  at             timestamptz not null default now(),
  actor          text not null,                                    -- admin email, or 'system' / 'student'
  action         text not null,
  detail         text
);
alter table public.student_workshop_events enable row level security;
revoke all on table public.student_workshop_events from anon, authenticated;

-- ───────── email outbox (so no email is lost, and none is sent twice) ─────────
create table if not exists public.student_workshop_outbox (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.student_workshop_applications(id) on delete cascade,
  kind           text not null check (kind in ('team_notification', 'student_ack', 'approval', 'rejection')),
  dedupe_key     text not null unique,
  to_emails      text[] not null,
  subject        text not null,
  body_text      text not null,
  status         text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'failed')),
  attempts       integer not null default 0,
  last_error     text,
  created_at     timestamptz not null default now(),
  claimed_at     timestamptz,
  sent_at        timestamptz
);
alter table public.student_workshop_outbox enable row level security;
revoke all on table public.student_workshop_outbox from anon, authenticated;

-- ───────── who may use the admin dashboard (by auth user id, so a look-alike sign-up can never match) ─────────
create table if not exists public.student_workshop_admins (
  user_id  uuid primary key references auth.users(id) on delete cascade,
  email    text not null,
  added_at timestamptz not null default now()
);
alter table public.student_workshop_admins enable row level security;
revoke all on table public.student_workshop_admins from anon, authenticated;

-- ───────── the student-only payment links (values are inserted outside the repo) ─────────
create table if not exists public.student_workshop_links (
  workshop text primary key check (workshop in ('acting', 'filmmaking', 'combo')),
  url      text not null check (url ~ '^https://'),
  updated_at timestamptz not null default now()
);
alter table public.student_workshop_links enable row level security;
revoke all on table public.student_workshop_links from anon, authenticated;

-- ───────── private storage bucket for the ID documents ─────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('student-ids', 'student-ids', false, 5242880, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = false, file_size_limit = 5242880, allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png'];
-- (no storage.objects policies are created: only the service role can read or write the bucket)

-- ───────── application code generator ─────────
create or replace function public.student_workshop_new_code() returns text
language sql volatile
set search_path to 'public'
as $$
  select 'SW-' || to_char(now() at time zone 'Asia/Kolkata', 'YYMMDD') || '-' ||
         (select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '') from generate_series(1, 5));
$$;
revoke all on function public.student_workshop_new_code() from public, anon, authenticated;

-- ───────── approve / reject: one atomic, row-locked step ─────────
-- returns {ok, error?, status, seq, ...}. Never sends email itself; the edge function does, then calls student_workshop_mark_sent.
create or replace function public.student_workshop_decide(
  p_id uuid, p_action text, p_admin text, p_note text, p_resend boolean default false
) returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  a public.student_workshop_applications;
begin
  select * into a from public.student_workshop_applications where id = p_id for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;

  if p_action = 'approve' then
    if a.status = 'Payment Completed' then
      return jsonb_build_object('ok', false, 'error', 'already_completed');
    elsif a.status = 'Payment Link Sent' then
      if not coalesce(p_resend, false) then
        return jsonb_build_object('ok', false, 'error', 'already_sent', 'status', a.status);
      end if;
      update public.student_workshop_applications
         set approval_seq = approval_seq + 1, admin_note = coalesce(nullif(trim(p_note), ''), admin_note)
       where id = p_id returning * into a;
      insert into public.student_workshop_events(application_id, actor, action, detail)
        values (p_id, p_admin, 'resend_approval', 'explicit resend, sequence ' || a.approval_seq);
      return jsonb_build_object('ok', true, 'status', a.status, 'seq', a.approval_seq, 'resend', true);
    elsif a.status = 'Approved' then
      -- already approved, link email not sent yet: just retry the same email
      return jsonb_build_object('ok', true, 'status', a.status, 'seq', a.approval_seq, 'retry', true);
    else
      update public.student_workshop_applications
         set status = 'Approved', decided_at = now(), decided_by = p_admin,
             admin_note = coalesce(nullif(trim(p_note), ''), admin_note),
             retention_expires_at = least(retention_expires_at, now() + interval '30 days')
       where id = p_id returning * into a;
      insert into public.student_workshop_events(application_id, actor, action, detail)
        values (p_id, p_admin, 'approved', nullif(trim(p_note), ''));
      return jsonb_build_object('ok', true, 'status', a.status, 'seq', a.approval_seq);
    end if;

  elsif p_action = 'reject' then
    if a.status in ('Payment Link Sent', 'Payment Completed') then
      return jsonb_build_object('ok', false, 'error', 'link_already_issued', 'status', a.status);
    elsif a.status = 'Rejected' then
      return jsonb_build_object('ok', true, 'status', a.status, 'retry', true);
    else
      update public.student_workshop_applications
         set status = 'Rejected', decided_at = now(), decided_by = p_admin,
             admin_note = coalesce(nullif(trim(p_note), ''), admin_note),
             retention_expires_at = least(retention_expires_at, now() + interval '30 days')
       where id = p_id returning * into a;
      insert into public.student_workshop_events(application_id, actor, action, detail)
        values (p_id, p_admin, 'rejected', nullif(trim(p_note), ''));
      return jsonb_build_object('ok', true, 'status', a.status);
    end if;
  end if;
  return jsonb_build_object('ok', false, 'error', 'bad_action');
end;
$$;
revoke all on function public.student_workshop_decide(uuid, text, text, text, boolean) from public, anon, authenticated;
grant execute on function public.student_workshop_decide(uuid, text, text, text, boolean) to service_role;

-- ───────── a sent approval email is what moves the application to "Payment Link Sent" ─────────
create or replace function public.student_workshop_mark_sent(p_outbox uuid, p_admin text default 'system') returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  o public.student_workshop_outbox;
begin
  update public.student_workshop_outbox
     set status = 'sent', sent_at = now(), last_error = null
   where id = p_outbox returning * into o;
  if o.kind = 'approval' then
    update public.student_workshop_applications
       set status = 'Payment Link Sent', payment_link_sent_at = now(), payment_link_sent_by = p_admin
     where id = o.application_id and status = 'Approved';
    insert into public.student_workshop_events(application_id, actor, action, detail)
      values (o.application_id, p_admin, 'payment_link_emailed', o.dedupe_key);
  end if;
end;
$$;
revoke all on function public.student_workshop_mark_sent(uuid, text) from public, anon, authenticated;
grant execute on function public.student_workshop_mark_sent(uuid, text) to service_role;

-- service role needs table access (it bypasses RLS but still needs grants on tables created by us)
grant all on table public.student_workshop_applications, public.student_workshop_events,
  public.student_workshop_outbox, public.student_workshop_admins, public.student_workshop_links to service_role;
grant usage, select on all sequences in schema public to service_role;

-- ───────── private settings (team recipients, sender address, dashboard URL): values inserted outside the repo ─────────
create table if not exists public.student_workshop_settings (
  key   text primary key,
  value text not null
);
alter table public.student_workshop_settings enable row level security;
revoke all on table public.student_workshop_settings from anon, authenticated;
grant all on table public.student_workshop_settings to service_role;
