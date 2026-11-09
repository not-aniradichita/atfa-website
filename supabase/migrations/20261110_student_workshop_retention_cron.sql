-- Daily retention job for student ID documents (03:00 IST). Additive.
-- pg_cron calls the student-workshop edge function with a private shared secret that is generated here
-- inside the database and kept in student_workshop_settings (never in the repo, never in the browser).
-- The function accepts that secret for ONE action only: deleting ID files whose retention date has passed.

insert into public.student_workshop_settings (key, value)
values ('cron_secret', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
on conflict (key) do nothing;

create or replace function public.student_workshop_run_purge() returns void
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare
  s text;
begin
  select value into s from public.student_workshop_settings where key = 'cron_secret';
  if s is null then return; end if;
  perform net.http_post(
    url := 'https://qgxgvyoosvbwmnnxggqz.supabase.co/functions/v1/student-workshop',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', s),
    body := '{"action":"purge_expired"}'::jsonb
  );
end;
$$;
revoke all on function public.student_workshop_run_purge() from public, anon, authenticated;

select cron.schedule('student-workshop-id-retention', '30 21 * * *', 'select public.student_workshop_run_purge()');
