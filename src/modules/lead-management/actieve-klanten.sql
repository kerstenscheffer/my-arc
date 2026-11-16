-- Actieve betalende klanten: één definitie voor alle schermen (16 nov 2026).
-- Gedraaid op 16 nov 2026. Alleen toevoegen: oude app-versies merken hier niets van.
--
-- clients.niet_betalend = dit account telt niet mee als betalende klant
-- (eigen, gratis of stilgezet). Zet je in Coach Inzicht -> Looptijd.
-- actieve_betalende_klanten() = wie er vandaag meetelt. Security invoker:
-- de RLS op clients bepaalt wat de aanroeper ziet.

alter table public.clients add column if not exists niet_betalend boolean not null default false;

-- De einddatum telt niet mee: wie afliep zonder beslissing, of met een geboekte
-- verlenging waarvan de weken niet zijn opgehoogd, blijft actief tot de coach
-- 'Nee' kiest in Einde traject (aangepast 16 nov 2026, later op de dag).
create or replace function public.actieve_betalende_klanten()
returns table (client_id uuid, naam text, start date, eind date, onbeperkt boolean)
language sql stable security invoker set search_path = public as $$
  select c.id,
         trim(regexp_replace(coalesce(c.first_name,'') || ' ' || coalesce(c.last_name,''), '\s+', ' ', 'g')),
         c.coaching_start_date,
         case when coalesce(c.coaching_onbeperkt, false) or c.coaching_total_weeks is null then null
              else c.coaching_start_date + (c.coaching_total_weeks * 7 + coalesce(c.coaching_paused_days_total, 0)) end,
         coalesce(c.coaching_onbeperkt, false)
  from clients c
  where c.status = 'active'
    and c.account_locked_at is null
    and coalesce(c.coaching_status, 'active') <> 'ended'
    and not c.niet_betalend
    and c.coaching_start_date is not null
    and c.coaching_start_date <= (now() at time zone 'Europe/Amsterdam')::date
    and (coalesce(c.coaching_onbeperkt, false) or c.coaching_total_weeks is not null)
$$;
revoke all on function public.actieve_betalende_klanten() from public, anon;
grant execute on function public.actieve_betalende_klanten() to authenticated, service_role;

-- klant_stand(van, tot): gestart, verlengd, gestopt in een venster en de stand
-- van nu, met de namen erbij. Eén bron voor alle klanttellers (16 nov 2026).
--   gestart  = coaching_start_date in het venster
--   verlengd = client_doorstap op 'betaald' gezet in het venster
--   gestopt  = account_locked_at in het venster; niet_betalend telt niet mee
create or replace function public.klant_stand(p_van timestamptz, p_tot timestamptz)
returns jsonb language sql stable security invoker set search_path = public as $$
  with naam as (
    select c.id, trim(regexp_replace(coalesce(c.first_name,'') || ' ' || coalesce(c.last_name,''), '\s+', ' ', 'g')) as n
    from clients c
  )
  select jsonb_build_object(
    'actief', (select count(*) from actieve_betalende_klanten()),
    'actief_namen', (select coalesce(jsonb_agg(a.naam order by a.naam), '[]'::jsonb) from actieve_betalende_klanten() a),
    'gestart', (select coalesce(jsonb_agg(jsonb_build_object('naam', n.n, 'datum', c.coaching_start_date) order by c.coaching_start_date), '[]'::jsonb)
                from clients c join naam n on n.id = c.id
                where not c.niet_betalend and c.coaching_start_date >= (p_van at time zone 'Europe/Amsterdam')::date
                  and c.coaching_start_date < (p_tot at time zone 'Europe/Amsterdam')::date),
    'verlengd', (select coalesce(jsonb_agg(jsonb_build_object('naam', n.n, 'datum', (d.gezet_at at time zone 'Europe/Amsterdam')::date, 'pakket', d.pakket) order by d.gezet_at), '[]'::jsonb)
                 from client_doorstap d join naam n on n.id = d.client_id
                 where d.status = 'betaald' and d.gezet_at >= p_van and d.gezet_at < p_tot),
    'gestopt', (select coalesce(jsonb_agg(jsonb_build_object('naam', n.n, 'datum', (c.account_locked_at at time zone 'Europe/Amsterdam')::date, 'reden', c.account_locked_reason) order by c.account_locked_at), '[]'::jsonb)
                from clients c join naam n on n.id = c.id
                where not c.niet_betalend and c.account_locked_at >= p_van and c.account_locked_at < p_tot)
  )
$$;
revoke all on function public.klant_stand(timestamptz, timestamptz) from public, anon;
grant execute on function public.klant_stand(timestamptz, timestamptz) to authenticated, service_role;

-- 16 nov 2026 (later): clients.gestopt_op = de echte stopdatum als die afwijkt van
-- het moment dat het account op slot ging (Nitish stopte in juli, ging later pas
-- op inactief). klant_stand() rekent 'gestopt' sindsdien op
--   coalesce(gestopt_op, account_locked_at in NL-tijd)
-- De live definitie is met die regel opnieuw gedraaid; zie de functie in de database.
alter table public.clients add column if not exists gestopt_op date;
