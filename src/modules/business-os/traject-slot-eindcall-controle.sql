-- src/modules/business-os/traject-slot-eindcall-controle.sql
--
-- Droge controle, wijzigt niets: wie gaat de komende 14 dagen op slot (oud en nieuw), wie
-- zou de nachtronde nu pakken, en de tekst van de herinnering van morgen.
-- Draaien na traject-slot-eindcall.sql met: node scripts/pa-sql.mjs <dit bestand>

with v as (select (now() at time zone 'Europe/Amsterdam')::date as dag)
select jsonb_build_object(
  'vandaag', (select dag from v),
  'lijst', (select jsonb_agg(jsonb_build_object(
                     'naam', p.naam, 'einde', p.einde, 'oud', p.slot_oud,
                     'nieuw', greatest(p.slot_nieuw, v.dag + 1),
                     'eindcall', (p.eindcall_start at time zone 'Europe/Amsterdam')::date, 'nee', p.nee)
                   order by p.slot_oud, p.naam)
            from public.traject_slot_prognose() p cross join v
            where lower(coalesce(p.email, '')) not like '%test%'
              and least(p.slot_oud, greatest(p.slot_nieuw, v.dag + 1)) <= v.dag + 14),
  'nachtronde_nu', (select jsonb_agg(k.first_name || ' ' || coalesce(k.last_name, ''))
                    from public.traject_verlopen_klanten() k),
  'herinnering_morgen', public.traject_signaal_tekst((select dag + 1 from v)),
  'cron', (select jsonb_agg(jsonb_build_object('job', j.jobname, 'wanneer', j.schedule, 'actief', j.active))
           from cron.job j where j.jobname in ('traject-verlopen-slot', 'traject-signaal-9u'))
) as controle;
