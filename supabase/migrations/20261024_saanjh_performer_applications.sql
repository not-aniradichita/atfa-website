-- SAANJH performer applications (events/saanjh/register/performer)
-- Project: thespians-tribe (qgxgvyoosvbwmnnxggqz). Additive only: one new table + one new RPC.
--
-- Same pattern as studio bookings: the public site (anon key) can only CALL the RPC below.
-- It cannot read, change or delete rows. View applications in the Supabase dashboard
-- (Table editor -> saanjh_performer_applications).

create table if not exists public.saanjh_performer_applications (
  id                      uuid primary key default gen_random_uuid(),
  created_at              timestamptz not null default now(),
  status                  text not null default 'new',            -- new / shortlisted / contacted ... (organiser's own use)
  full_name               text not null check (char_length(full_name) between 1 and 120),
  phone                   text not null check (char_length(phone) between 7 and 30),
  email                   text not null check (char_length(email) between 3 and 254),
  age_group               text not null check (char_length(age_group) between 1 and 40),
  city                    text not null check (char_length(city) between 1 and 80),
  art_form                text not null,
  art_form_other          text check (char_length(art_form_other) <= 80),
  performance_title       text not null check (char_length(performance_title) between 1 and 150),
  performance_description text not null check (char_length(performance_description) between 1 and 2000),
  language                text not null check (char_length(language) between 1 and 60),
  performance_type        text not null check (performance_type in ('solo', 'group')),
  group_size              integer check (group_size between 2 and 200),
  duration                text check (char_length(duration) <= 60),
  link                    text check (char_length(link) <= 500),
  special_requirements    text check (char_length(special_requirements) <= 1000),
  consent                 boolean not null check (consent)
);

-- Nobody reads or writes this table directly through the public API.
alter table public.saanjh_performer_applications enable row level security;
revoke all on table public.saanjh_performer_applications from anon, authenticated;

-- One application per person per performance title (stops accidental double submits).
create unique index if not exists saanjh_performer_applications_dedupe
  on public.saanjh_performer_applications (lower(email), lower(performance_title));

create or replace function public.submit_saanjh_performer_application(
  p_full_name               text,
  p_phone                   text,
  p_email                   text,
  p_age_group               text,
  p_city                    text,
  p_art_form                text,
  p_art_form_other          text,
  p_performance_title       text,
  p_performance_description text,
  p_language                text,
  p_performance_type        text,
  p_group_size              integer,
  p_duration                text,
  p_link                    text,
  p_special_requirements    text,
  p_consent                 boolean,
  p_website                 text default null          -- honeypot: real people leave it empty
) returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_digits text;
  v_forms  text[] := array['Singing','Dancing','Theatre / Acting','Instrumental Music',
                           'Poetry / Spoken Word','Storytelling','Stand-up Comedy','Other'];
begin
  -- bots fill hidden fields; pretend it worked, store nothing
  if coalesce(trim(p_website), '') <> '' then
    return jsonb_build_object('ok', true);
  end if;

  if coalesce(trim(p_full_name), '') = '' or char_length(trim(p_full_name)) > 120 then
    return jsonb_build_object('ok', false, 'error', 'invalid', 'field', 'full_name');
  end if;

  v_digits := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  if coalesce(p_phone, '') !~ '^[0-9+()\-\s.]+$' or char_length(v_digits) < 7 or char_length(v_digits) > 15 then
    return jsonb_build_object('ok', false, 'error', 'invalid', 'field', 'phone');
  end if;

  if coalesce(trim(p_email), '') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(trim(p_email)) > 254 then
    return jsonb_build_object('ok', false, 'error', 'invalid', 'field', 'email');
  end if;

  if coalesce(trim(p_age_group), '') = '' or char_length(trim(p_age_group)) > 40 then
    return jsonb_build_object('ok', false, 'error', 'invalid', 'field', 'age_group');
  end if;

  if coalesce(trim(p_city), '') = '' or char_length(trim(p_city)) > 80 then
    return jsonb_build_object('ok', false, 'error', 'invalid', 'field', 'city');
  end if;

  if p_art_form is null or not (p_art_form = any (v_forms)) then
    return jsonb_build_object('ok', false, 'error', 'invalid', 'field', 'art_form');
  end if;
  if p_art_form = 'Other' and (coalesce(trim(p_art_form_other), '') = '' or char_length(trim(p_art_form_other)) > 80) then
    return jsonb_build_object('ok', false, 'error', 'invalid', 'field', 'art_form_other');
  end if;

  if coalesce(trim(p_performance_title), '') = '' or char_length(trim(p_performance_title)) > 150 then
    return jsonb_build_object('ok', false, 'error', 'invalid', 'field', 'performance_title');
  end if;

  if coalesce(trim(p_performance_description), '') = '' or char_length(trim(p_performance_description)) > 2000 then
    return jsonb_build_object('ok', false, 'error', 'invalid', 'field', 'performance_description');
  end if;

  if coalesce(trim(p_language), '') = '' or char_length(trim(p_language)) > 60 then
    return jsonb_build_object('ok', false, 'error', 'invalid', 'field', 'language');
  end if;

  if p_performance_type is null or p_performance_type not in ('solo', 'group') then
    return jsonb_build_object('ok', false, 'error', 'invalid', 'field', 'performance_type');
  end if;
  if p_performance_type = 'group' and (p_group_size is null or p_group_size < 2 or p_group_size > 200) then
    return jsonb_build_object('ok', false, 'error', 'invalid', 'field', 'group_size');
  end if;

  if char_length(coalesce(p_duration, '')) > 60
     or char_length(coalesce(p_special_requirements, '')) > 1000 then
    return jsonb_build_object('ok', false, 'error', 'invalid', 'field', 'duration');
  end if;

  if coalesce(trim(p_link), '') <> '' and (trim(p_link) !~* '^https?://\S+$' or char_length(trim(p_link)) > 500) then
    return jsonb_build_object('ok', false, 'error', 'invalid', 'field', 'link');
  end if;

  if not coalesce(p_consent, false) then
    return jsonb_build_object('ok', false, 'error', 'invalid', 'field', 'consent');
  end if;

  insert into public.saanjh_performer_applications (
    full_name, phone, email, age_group, city, art_form, art_form_other,
    performance_title, performance_description, language, performance_type, group_size,
    duration, link, special_requirements, consent
  ) values (
    trim(p_full_name), trim(p_phone), trim(p_email), trim(p_age_group), trim(p_city), p_art_form,
    case when p_art_form = 'Other' then nullif(trim(p_art_form_other), '') end,
    trim(p_performance_title), trim(p_performance_description), trim(p_language), p_performance_type,
    case when p_performance_type = 'group' then p_group_size end,
    nullif(trim(p_duration), ''), nullif(trim(p_link), ''), nullif(trim(p_special_requirements), ''), true
  );

  return jsonb_build_object('ok', true);
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'error', 'duplicate');
end;
$$;

revoke all on function public.submit_saanjh_performer_application(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, text, text, boolean, text
) from public;
grant execute on function public.submit_saanjh_performer_application(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, text, text, boolean, text
) to anon, authenticated, service_role;
