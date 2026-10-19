-- Content-checklist (17 okt 2026). Staat in de DB via migratie content_checklist.
-- content_eigenaar(): team-eigenaar van de ingelogde coach (of zichzelf zonder
-- team), zodat Kersten en Marcel dezelfde lijst invullen.
-- content_checklist (eigenaar, dag, soort, aantal, door) pk eigenaar+dag+soort
-- content_doelen    (eigenaar, soort, doel)          pk eigenaar+soort
-- Soorten: reel, foto, story, magnet (standaarddoel 1/1/3/8 staat in
-- ContentChecklist.jsx; een rij in content_doelen overschrijft dat).
-- RLS: alles waar eigenaar = content_eigenaar().
--
-- content_metricool (eigenaar, dag, reels, fotos, stories, bereik,
-- nieuwe_volgers) pk eigenaar+dag; team leest (RLS select), schrijven alleen
-- via service/SQL. Bron: Metricool brand 6149311 (Instagram kerstenscheffer),
-- velden IGEV22 reels, IGEV04 posts, IGEV16 stories, IGEV06 bereik,
-- IGEV43 volgers erbij. Eenmalig gevuld 1 sep t/m 16 okt 2026 via de
-- Metricool-koppeling van Claude; een automatische sync vraagt een
-- Metricool API-token (nog niet in Vault).
--
-- content_metricool_posts (eigenaar, tijd, dag, soort 'reel'|'magnet', woord,
-- views, tekst) pk eigenaar+tijd, team leest. Eén rij per reel uit Metricool
-- (IGRE02 tijd, IGRE23 views, IGRE03 caption). Magnet = caption met een
-- comment- of DM-trigger (Reageer "LIDL", DM 80/20); woord = dat trefwoord.
-- tekst = begin van de caption, alleen bij gewone reels. Gevuld 1 sep t/m
-- 16 okt 2026 (289 reels, 222 magnets). content_metricool.magnets is het
-- dagtotaal daarvan; de UI telt per dag uit de posts zelf.

-- 19 okt 2026: outreach (doel 100) + follow-ups per dag uit het leadbord.
-- Doel mag tot 500. Team = alle coach_ids in het team van auth.uid().
alter table content_doelen drop constraint if exists content_doelen_doel_check;
alter table content_doelen add constraint content_doelen_doel_check check (doel between 0 and 500);

create or replace function public.content_lead_stats(van date, tot date)
returns table(dag date, outreach int, followups int)
language sql stable security definer set search_path to 'public' as $$
  with team as (
    select coalesce(
      (select array_agg(o.coach_id) from coach_team_members m
         join coach_team_members o on o.team_id = m.team_id
        where m.coach_id = auth.uid()),
      array[auth.uid()]) ids
  ), dagen as (select generate_series(van, tot, interval '1 day')::date dag)
  select d.dag,
    (select count(*)::int from call_leads l, team t where l.coach_id = any(t.ids) and l.deleted_at is null
       and (l.created_at at time zone 'Europe/Amsterdam')::date = d.dag),
    (select count(*)::int from call_leads l, team t where l.coach_id = any(t.ids) and l.deleted_at is null
       and (l.last_followup_sent_at at time zone 'Europe/Amsterdam')::date = d.dag)
  from dagen d
  where auth.uid() is not null and tot - van <= 62;
$$;
revoke all on function public.content_lead_stats(date, date) from public, anon;
grant execute on function public.content_lead_stats(date, date) to authenticated;
