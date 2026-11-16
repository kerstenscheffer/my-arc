-- src/modules/workout/bouwfase/rir.sql
--
-- RIR-progressie (16 nov 2026, Kersten). Bovenop de mesocyclus: elke bouwweek
-- een doel "herhalingen over", aflopend naar bijna-falen. Staat per klant uit
-- tot de coach het aanzet. Alleen toevoegingen; oude app-versies merken niets.
--
--   training_fases.rir_aan      staat de progressie aan voor deze fase?
--   training_fases.rir_schema   eigen weekdoelen van de coach, bv. [3,3,2,1,0];
--                               leeg = de app rekent het uit op de lengte
--   training_feedback.rir       hoeveel de klant over had op de laatste set (4 = 4 of meer)

alter table public.training_fases add column if not exists rir_aan boolean;
alter table public.training_fases add column if not exists rir_schema jsonb;
alter table public.training_feedback add column if not exists rir smallint;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'training_feedback_rir_check') then
    alter table public.training_feedback add constraint training_feedback_rir_check check (rir is null or (rir >= 0 and rir <= 4));
  end if;
end $$;

-- Een nieuwe mesocyclus neemt de instelling over van de vorige fase van die
-- klant, zodat de coach het maar één keer hoeft aan te zetten.
create or replace function public.trg_fase_rir_overnemen() returns trigger
language plpgsql security definer set search_path = public as $$
declare v record;
begin
  if new.rir_aan is null then
    select rir_aan, rir_schema into v from training_fases
      where client_id = new.client_id and rir_aan is not null
      order by created_at desc limit 1;
    if found then
      new.rir_aan := v.rir_aan;
      -- Het schema alleen overnemen als de lengte gelijk is; anders rekent de app het opnieuw uit.
      if new.rir_schema is null and v.rir_schema is not null and jsonb_array_length(v.rir_schema) = coalesce(new.bouw_weken, 0) then
        new.rir_schema := v.rir_schema;
      end if;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_fase_rir_overnemen on public.training_fases;
create trigger trg_fase_rir_overnemen before insert on public.training_fases
  for each row execute function public.trg_fase_rir_overnemen();

-- Melding aan de coach: een klant met RIR-progressie deed op een oefening twee
-- trainingen op rij minder (beste set, geschatte 1RM, meer dan 1% lager). Geen
-- automatische verandering aan het plan: de coach beslist. Draait elke nacht
-- over de trainingen van gisteren, dus één melding per daling.
create or replace function public.rir_achteruit_melding(p_dag date default null, p_droog boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  gisteren date := coalesce(p_dag, (now() at time zone 'Europe/Amsterdam')::date - 1);
  r record;
  uit jsonb := '[]'::jsonb;
begin
  for r in
    with fases as (
      select f.client_id, coalesce(f.coach_id, c.coach_id) coach_id, f.start_datum, coalesce(nullif(c.first_name, ''), 'Klant') naam
      from training_fases f join clients c on c.id = f.client_id
      where f.actief and f.rir_aan and f.deload_gestart_op is null and f.afgerond_op is null
    ), logs as (
      select f.client_id, f.coach_id, f.naam, lower(wp.exercise_name) k, min(wp.exercise_name) oefening, ws.workout_date d,
             max((s->>'weight')::numeric * (1 + (s->>'reps')::numeric / 30)) kracht
      from fases f
      join workout_sessions ws on ws.client_id = f.client_id and ws.workout_date >= f.start_datum and ws.workout_date <= gisteren
      join workout_progress wp on wp.session_id = ws.id
      cross join lateral jsonb_array_elements(case when jsonb_typeof(wp.sets) = 'array' then wp.sets else '[]'::jsonb end) s
      where coalesce(s->>'weight', '') ~ '^[0-9]+(\.[0-9]+)?$' and coalesce(s->>'reps', '') ~ '^[0-9]+(\.[0-9]+)?$'
        and not (s ? 'snelheid')
      group by f.client_id, f.coach_id, f.naam, lower(wp.exercise_name), ws.workout_date
    ), n as (
      select *, row_number() over (partition by client_id, k order by d desc) rn from logs where kracht > 0
    )
    select a.client_id, a.coach_id, a.naam, string_agg(a.oefening, ', ' order by a.oefening) oefeningen, count(*) aantal
    from n a
    join n b on b.client_id = a.client_id and b.k = a.k and b.rn = 2
    join n c on c.client_id = a.client_id and c.k = a.k and c.rn = 3
    where a.rn = 1 and a.d = gisteren and a.kracht < b.kracht * 0.99 and b.kracht < c.kracht * 0.99
    group by a.client_id, a.coach_id, a.naam
  loop
    uit := uit || jsonb_build_object('client_id', r.client_id, 'naam', r.naam, 'oefeningen', r.oefeningen);
    if not p_droog and r.coach_id is not null then
      insert into coach_notifications (coach_id, type, priority, title, message, tags, action_data)
      values (r.coach_id, 'personal', 'normal', 'Prestatie daalt',
        r.naam || ': twee trainingen op rij minder op ' || r.oefeningen || '. De sets blijven gelijk; kijk of er iets moet veranderen.',
        array['rir'], jsonb_build_object('soort', 'rir_achteruit', 'client_id', r.client_id));
    end if;
  end loop;
  return jsonb_build_object('dag', gisteren, 'klanten', jsonb_array_length(uit), 'rijen', uit, 'droog', p_droog);
end $$;
revoke all on function public.rir_achteruit_melding(date, boolean) from public, anon, authenticated;

select cron.unschedule('rir-achteruit') where exists (select 1 from cron.job where jobname = 'rir-achteruit');
select cron.schedule('rir-achteruit', '15 2 * * *', 'select public.rir_achteruit_melding()');

-- ── Uitgebreide vragen per spiergroep (16 nov 2026, model RP) ──
-- Alleen voor klanten met RIR-progressie aan. De oude kolom `gevoel` blijft bij
-- de herstelvraag gevuld (nee / beetje / ja), zodat alles wat daarop leest
-- hetzelfde blijft werken; `spierpijn` is de fijnere versie ernaast.
--   spierpijn  0 nooit gehad · 1 al lang weg · 2 net op tijd weg · 3 nog steeds   (soort 'herstel')
--   pomp       0 weinig · 1 goed · 2 enorm                                        (soort 'spier')
--   werkdruk   0 makkelijk · 1 goed · 2 op mijn grens · 3 te veel                 (soort 'spier')
-- soort 'spier' = één rij per spiergroep per dag, na de laatste oefening van die spier.
alter table public.training_feedback add column if not exists spierpijn smallint;
alter table public.training_feedback add column if not exists pomp smallint;
alter table public.training_feedback add column if not exists werkdruk smallint;
alter table public.training_feedback drop constraint if exists training_feedback_soort_check;
alter table public.training_feedback add constraint training_feedback_soort_check
  check (soort = any (array['oefening', 'herstel', 'workout', 'spier']));
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'training_feedback_rp_check') then
    alter table public.training_feedback add constraint training_feedback_rp_check check (
      (spierpijn is null or spierpijn between 0 and 3) and (pomp is null or pomp between 0 and 2) and (werkdruk is null or werkdruk between 0 and 3));
  end if;
end $$;
