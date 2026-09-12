-- src/modules/challenge-monitor/challenge-stand.sql
--
-- De zes challenge-tellers voor één deelnemer over één periode.
-- Toegepast op de database via migratie `challenge_stand_rpc`; hier bewaard
-- zodat de definitie in git staat en niet alleen in Supabase.
--
-- Waarom één functie: anders schrijven het coach-scherm en het klant-scherm
-- allebei hun eigen versie van "telt deze dag mee" en lopen ze uit elkaar. Bij
-- geld dat van de uitkomst afhangt kun je dat niet hebben.
--
-- Leest bewust uit de tabellen die klanten écht vullen:
--   workouts  workout_sessions + workout_progress
--             NIET workout_completions — die is sinds 9 juni 2026 dood, en
--             workout_sessions.completion_percentage staat altijd op 0.00
--   wegingen  weight_challenge_logs
--             NIET weight_logs — 8 rijen, laatst oktober 2025
--   voeding   consumed_meals tegen de slots in het actieve maaltijdplan
--   checkins  client_checkins
--   foto's    progress_photos
--   calls     client_calls met status 'completed'
--
-- Drempels zijn parameters: de regels horen bij de challenge, niet bij de query.
--
-- Nagerekend op 12 sep 2026 (ks10k, 1 aug – 12 sep): 9 geldige workouts uit 18
-- sessies, 31 wegingen, 13 geldige voedingsdagen, 4 check-ins. De losse
-- workout-percentages liepen van 8% tot 113%, dus de 70%-grens onderscheidt.

create or replace function public.get_challenge_stand(
  p_client_id uuid,
  p_start date,
  p_eind date,
  p_workout_pct numeric default 0.70,
  p_voeding_pct numeric default 0.70,
  p_dagen_per_week int default 5
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with
sessies as (
  select s.id, s.workout_date,
         c.workout_schedule ->> s.day_name as dagkey,
         w.week_structure
  from workout_sessions s
  join clients c on c.id = s.client_id
  left join workout_schemas w on w.id = c.assigned_schema_id
  where s.client_id = p_client_id
    and s.workout_date between p_start and p_eind
),
w_gepland as (
  select se.id, se.workout_date,
    (select sum(greatest(coalesce((regexp_match(ex->>'sets','\d+'))[1]::int, 1), 1))
       from jsonb_array_elements(coalesce(se.week_structure -> se.dagkey -> 'exercises', '[]'::jsonb)) ex
    ) as planned_sets
  from sessies se
),
w_gelogd as (
  select p.session_id,
    sum(case when jsonb_array_length(coalesce(p.sets, '[]'::jsonb)) = 0 then 1
             else (select count(*) from jsonb_array_elements(p.sets) st
                    where coalesce(st->>'completed', 'true') <> 'false') end) as done_sets
  from workout_progress p
  where p.session_id in (select id from sessies)
  group by p.session_id
),
workouts as (
  select
    count(*) filter (
      where g.planned_sets > 0
        and coalesce(l.done_sets, 0)::numeric / g.planned_sets >= p_workout_pct
    ) as geldig,
    count(*) as sessies_totaal,
    -- Sessies waarvan het plan niet te herleiden was (geen schema, of de dag
    -- staat niet in workout_schedule). Apart teruggeven in plaats van stil als
    -- "niet gehaald" wegzetten: dan zie je dát er iets ontbreekt.
    count(*) filter (where coalesce(g.planned_sets, 0) = 0) as onbepaald
  from w_gepland g left join w_gelogd l on l.session_id = g.id
),
-- Dezelfde regel als hierboven, maar per sessie in plaats van geteld. De
-- detailschermen tekenden hun eigen versie uit workout_completions (dood sinds
-- 9 juni 2026) en kwamen daardoor op andere getallen uit dan de teller.
w_detail as (
  select g.workout_date,
         coalesce(g.planned_sets, 0) as planned_sets,
         coalesce(l.done_sets, 0) as done_sets,
         (coalesce(g.planned_sets, 0) > 0
          and coalesce(l.done_sets, 0)::numeric / g.planned_sets >= p_workout_pct) as telt
  from w_gepland g left join w_gelogd l on l.session_id = g.id
),
plan as (
  select week_structure from client_meal_plans
  where client_id = p_client_id and is_active order by created_at desc limit 1
),
v_dagen as (
  select d::date as dag,
    (select count(*)
       from jsonb_object_keys(coalesce((select week_structure from plan) -> lower(to_char(d,'FMDay')), '{}'::jsonb)) k
      where k not in ('totals','is_training_day','dayId','scaling','snacks','meals')) as slots
  from generate_series(p_start, p_eind, '1 day') d
),
v_gelogd as (
  select cm.consumed_at::date as dag, count(*) as n
  from consumed_meals cm
  where cm.client_id = p_client_id
    and cm.consumed_at >= p_start::timestamptz
    and cm.consumed_at < (p_eind + 1)::timestamptz
  group by 1
),
v_geldig as (
  select vd.dag,
         (vd.slots > 0 and coalesce(vg.n,0)::numeric / vd.slots >= p_voeding_pct) as telt
  from v_dagen vd left join v_gelogd vg on vg.dag = vd.dag
),
v_weken as (
  select date_trunc('week', dag)::date as week_start,
         count(*) filter (where telt) as geldige_dagen
  from v_geldig group by 1
)
select jsonb_build_object(
  'periode', jsonb_build_object('start', p_start, 'eind', p_eind),
  'workouts', jsonb_build_object(
      'geldig', (select geldig from workouts),
      'sessies', (select sessies_totaal from workouts),
      'onbepaald', (select onbepaald from workouts),
      'dagen', (select coalesce(jsonb_agg(jsonb_build_object(
                    'datum', d.workout_date,
                    'gepland', d.planned_sets,
                    'gedaan', d.done_sets,
                    'telt', d.telt) order by d.workout_date), '[]'::jsonb)
                  from w_detail d)),
  'wegingen', (select count(distinct date) from weight_challenge_logs
                where client_id = p_client_id and date between p_start and p_eind),
  'voeding', jsonb_build_object(
      'geldige_dagen', (select count(*) from v_geldig where telt),
      'dagen', (select coalesce(jsonb_agg(jsonb_build_object(
                   'dag', vd.dag, 'slots', vd.slots,
                   'gelogd', coalesce(vg.n, 0), 'telt', g.telt) order by vd.dag), '[]'::jsonb)
                 from v_dagen vd
                 join v_geldig g on g.dag = vd.dag
                 left join v_gelogd vg on vg.dag = vd.dag),
      'geldige_weken', (select count(*) from v_weken where geldige_dagen >= p_dagen_per_week),
      'weken', (select coalesce(jsonb_agg(jsonb_build_object('week', week_start, 'dagen', geldige_dagen) order by week_start), '[]'::jsonb) from v_weken)),
  'checkins', (select count(*) from client_checkins
                where client_id = p_client_id and checkin_date between p_start and p_eind),
  'fotos', (select count(*) from progress_photos
             where client_id = p_client_id and coalesce(date, created_at::date) between p_start and p_eind),
  'calls', (select count(*) from client_calls
             where client_id = p_client_id and status = 'completed'
               and completed_date::date between p_start and p_eind)
);
$$;

grant execute on function public.get_challenge_stand(uuid, date, date, numeric, numeric, int) to authenticated;
