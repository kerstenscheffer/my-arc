-- src/modules/challenge-monitor/challenge-calls.sql (5 nov 2026)
--
-- Gevoerde en geplande calls van één klant, voor de coach. Alleen toevoegen.
--
-- get_challenge_stand telt calls uit client_calls, maar die tabel wordt sinds nov 2025 niet
-- meer gevuld: bij iedereen stond de eis op 0. De calls staan in Zoom (call_insights, vanaf
-- aug 2026) en Google Agenda (agenda_events, vanaf eind okt 2026). Eén gevoerde call per dag.
-- get_challenge_stand zelf blijft ongewijzigd, dus klanten zien hierdoor niets anders.
--
-- Namen: volledige naam, voornaam + eerste letter, of alleen de voornaam als er precies één
-- lopende klant zo heet. Security definer met coach-check: Marcel mag call_insights niet lezen,
-- maar moet wel dezelfde telling zien. Er komen alleen aantallen en datums terug, geen inhoud.

create or replace function public.challenge_naam_plat(t text)
returns text language sql immutable as $$
  select trim(regexp_replace(
    translate(lower(coalesce(t, '')), 'áàäâãåéèëêíìïîóòöôõúùüûýÿñç', 'aaaaaaeeeeiiiiooooouuuuyync'),
    '[^a-z0-9.]+', ' ', 'g'))
$$;

create or replace function public.get_challenge_calls(p_client_id uuid, p_start date, p_eind date)
returns jsonb
language sql stable security definer set search_path = public as $$
  with k as (
    select challenge_naam_plat(first_name) as voornaam, challenge_naam_plat(last_name) as achternaam,
           split_part(challenge_naam_plat(first_name), ' ', 1) as woord
    from clients where id = p_client_id and rls_is_coach()
  ), u as (
    select k.*, trim(voornaam || ' ' || achternaam) as volledig,
      (select count(distinct challenge_naam_plat(c.first_name) || ' ' || challenge_naam_plat(c.last_name)) from clients c
        where c.coaching_status in ('active', 'paused') and split_part(challenge_naam_plat(c.first_name), ' ', 1) = k.woord) = 1 as uniek
    from k
  ), zoom as (
    select i.call_date as dag from call_insights i, u
    where i.call_date between p_start and p_eind and coalesce(i.call_type, 'client') <> 'sales' and u.voornaam <> ''
      and (challenge_naam_plat(i.contact_name) = u.volledig
        or (u.achternaam <> '' and challenge_naam_plat(i.contact_name) = u.woord || ' ' || left(u.achternaam, 1))
        or (u.uniek and challenge_naam_plat(i.contact_name) in (u.voornaam, u.woord)))
  ), agenda as (
    select (e.start_at at time zone 'Europe/Amsterdam')::date as dag, e.start_at
    from agenda_events e, u
    where e.soort in ('klantcall', 'opstartcall') and not coalesce(e.hele_dag, false)
      and challenge_naam_plat(e.titel) not like 'plan check%' and u.voornaam <> ''
      and (e.start_at at time zone 'Europe/Amsterdam')::date between p_start and p_eind
      and (challenge_naam_plat(e.contact_naam) = u.volledig
        or ' ' || challenge_naam_plat(e.titel) || ' ' like '% ' || u.volledig || ' %'
        or (u.achternaam <> '' and challenge_naam_plat(e.contact_naam) = u.woord || ' ' || left(u.achternaam, 1))
        or (u.uniek and (case when coalesce(e.contact_naam, '') <> '' then challenge_naam_plat(e.contact_naam) in (u.voornaam, u.woord)
                              else ' ' || challenge_naam_plat(e.titel) || ' ' like '% ' || u.woord || ' %' end)))
  ), gevoerd as (
    select dag, true as zoom from zoom
    union select dag, false from agenda where start_at < now() and dag not in (select dag from zoom)
  )
  select jsonb_build_object(
    'gevoerd', (select count(distinct dag) from gevoerd),
    'via_zoom', (select count(distinct dag) from zoom),
    'dagen', (select coalesce(jsonb_agg(jsonb_build_object('dag', dag, 'zoom', zoom) order by dag), '[]'::jsonb) from gevoerd),
    'gepland', (select count(distinct dag) from agenda where start_at >= now())
  )
$$;

revoke all on function public.get_challenge_calls(uuid, date, date) from public, anon;
grant execute on function public.get_challenge_calls(uuid, date, date) to authenticated, service_role;
