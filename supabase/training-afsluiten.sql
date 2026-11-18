-- Trainingen sluiten zichzelf af (18 nov 2026).
--
-- De klantapp zette is_completed nooit en de duur alleen als de klant de timer
-- gebruikte (313 van 396 trainingen zonder duur). Dit doet het op de server,
-- dus ook voor oude app-versies:
--   * twee uur na de laatste gelogde oefening is de training afgerond;
--   * de duur is de tijd tussen de eerste en de laatste gelogde oefening + 7
--     minuten (geijkt op 100 trainingen mét timer: mediaan verschil 7 min).
--     Alleen als dat tussen 10 en 150 minuten ligt en op de trainingsdag zelf
--     gelogd is; achteraf in één keer invullen levert geen duur op.
-- Een door de klant gemeten duur blijft altijd staan. Alleen kolommen erbij.

alter table public.workout_sessions add column if not exists afgesloten_door text;

create or replace function public.sluit_trainingen_af()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_n integer;
begin
  with l as (
    select session_id, min(created_at) eerst, max(created_at) laatst
    from workout_progress group by session_id
  ), bij as (
    update workout_sessions s set
      is_completed = true,
      completed_at = coalesce(s.completed_at, l.laatst),
      afgesloten_door = coalesce(s.afgesloten_door, 'auto'),
      duration_minutes = case
        when coalesce(s.duration_minutes, 0) > 0 then s.duration_minutes
        when (l.eerst at time zone 'Europe/Amsterdam')::date = s.workout_date
         and extract(epoch from (l.laatst - l.eerst)) / 60 between 10 and 150
          then round(extract(epoch from (l.laatst - l.eerst)) / 60)::int + 7
        else s.duration_minutes end
    from l
    where l.session_id = s.id
      and not coalesce(s.is_completed, false)
      and l.laatst < now() - interval '2 hours'
    returning 1
  )
  select count(*) into v_n from bij;
  return v_n;
end $$;

revoke all on function public.sluit_trainingen_af() from public, anon, authenticated;

select cron.unschedule('trainingen-afsluiten') where exists (select 1 from cron.job where jobname = 'trainingen-afsluiten');
select cron.schedule('trainingen-afsluiten', '*/15 * * * *', $$select public.sluit_trainingen_af()$$);
