-- Verlengingen uit TrajectModal hebben geen lead_id (klant, geen lead) en
-- vielen daardoor buiten my_team_lead_ids(): Marcel zag ze niet in omzet en
-- uitbetaling (oktober €285 in plaats van €485). Rijen zonder lead mag het
-- team van de maker zien. (14 okt 2026)
drop policy if exists lead_movements_team_select on public.lead_movements;
create policy lead_movements_team_select on public.lead_movements for select using (
  (coach_id = (select auth.uid()))
  or (coach_id is null)
  or (lead_id in (select my_team_lead_ids()))
  or (lead_id is null and shares_team_with(coach_id))
);
