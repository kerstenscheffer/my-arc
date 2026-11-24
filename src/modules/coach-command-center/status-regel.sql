-- Statusregel per klant (24 nov 2026, Kersten).
-- Opslag: client_coaching_logs met category 'status' (note = de regel,
-- coach_id = de coach). Geen nieuwe tabel of kolom nodig; category heeft geen
-- check-constraint. De nieuwste rij per klant is de geldende stand.
--
-- Wat dit bestand toevoegt: klanten mogen de statusregel niet zien. De
-- bestaande policy rls_eigen laat een klant zijn eigen logboekrijen lezen en
-- schrijven; deze extra (restrictive) regel sluit daar category 'status' van
-- uit. Alle andere categorieen blijven precies zoals ze waren, dus oude
-- app-versies merken niets. Live gezet via apply_migration op 24 nov 2026.

create policy status_alleen_coach on public.client_coaching_logs
  as restrictive for all
  using (category is distinct from 'status' or (select rls_is_coach()))
  with check (category is distinct from 'status' or (select rls_is_coach()));

-- Terugdraaien: drop policy status_alleen_coach on public.client_coaching_logs;
