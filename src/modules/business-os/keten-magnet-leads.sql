-- src/modules/business-os/keten-magnet-leads.sql (5 nov 2026)
--
-- Nieuwe leads per magnet-woord en geslacht in een periode, voor de uitklaprijen in de
-- Keten. Alleen toevoegen. Security invoker: de RLS op call_leads blijft gelden, dus een
-- klant krijgt hier niets uit. Telt alleen leads die in de periode zijn aangemaakt, dus
-- bestaande leads die opnieuw reageren tellen niet mee (die hebben geen tijdstempel).

create or replace function public.get_keten_magnet_leads(p_van timestamptz, p_tot timestamptz)
returns table (woord text, totaal int, mannen int, vrouwen int)
language sql stable security invoker set search_path = public as $$
  select w.woord,
         count(distinct l.id)::int,
         count(distinct l.id) filter (where l.gender = 'male')::int,
         count(distinct l.id) filter (where l.gender = 'female')::int
  from call_leads l
  cross join lateral unnest(l.lead_magnets_shared) as e(magnet)
  cross join lateral (select magnet_woord(e.magnet::text) as woord) w
  where l.deleted_at is null and l.created_at >= p_van and l.created_at < p_tot
  group by w.woord
$$;

revoke all on function public.get_keten_magnet_leads(timestamptz, timestamptz) from public, anon;
grant execute on function public.get_keten_magnet_leads(timestamptz, timestamptz) to authenticated, service_role;
