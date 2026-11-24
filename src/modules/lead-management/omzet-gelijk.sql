-- Eén omzetbedrag overal (24 nov 2026, Kersten: Business OS €1.444, ontvangen €1.747).
--
-- 1. Een coachingpauze schuift alleen betaalmomenten van sales die er al waren
--    toen de pauze begon. Patrick (pauze 30 okt–5 nov) betaalde op 24 nov zijn
--    verlenging; die €303 werd 7 dagen naar 1 dec geschoven. sale_pauzes_team
--    voedt zowel get_payment_schedule als de JS (betaalPauze.js), dus dit ene
--    filter maakt beide gelijk.
-- 2. Teruggestort challenge-geld (challenge_status 'terugbetaald') is nooit van
--    ons; het omzetscherm (getRevenueProjection) liet het al weg, het
--    betaalschema telde het nog.

create or replace function public.sale_pauzes_team()
returns table(movement_id uuid, pauzes jsonb)
language sql stable security definer set search_path = public as $$
  select m.id,
         jsonb_agg(jsonb_build_object(
           'vanaf', (p.paused_at at time zone 'Europe/Amsterdam')::date,
           'tot',   (p.resumed_at at time zone 'Europe/Amsterdam')::date)
           order by p.paused_at)
  from lead_movements m
  join coaching_pauses p on p.client_id = m.client_id
  where m.client_id is not null
    and m.reverted_at is null
    and m.coach_id = any(public.team_coach_ids(auth.uid()))
    -- Alleen pauzes die begonnen op of na de sale-dag.
    and (p.paused_at at time zone 'Europe/Amsterdam')::date >= (m.moved_at at time zone 'Europe/Amsterdam')::date
  group by m.id
$$;

do $$
declare d text;
begin
  d := pg_get_functiondef('public.get_payment_schedule'::regproc);
  if position('''terugbetaald''' in d) = 0 then
    d := replace(d,
      'and coalesce(m.challenge_status, '''') <> ''uitgesteld''',
      'and coalesce(m.challenge_status, '''') not in (''uitgesteld'', ''terugbetaald'')');
    execute d;
  end if;
end $$;
