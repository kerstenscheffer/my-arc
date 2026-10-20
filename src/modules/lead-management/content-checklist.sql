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

-- 19 okt 2026 (2): follow-ups telden te laag. call_leads houdt alleen de
-- laatste opvolging bij (last_followup_sent_at wordt overschreven en door een
-- reactie gewist). Nu logt een trigger elke verhoging van followup_count.
create table if not exists public.lead_followup_events (
  id bigint generated always as identity primary key,
  lead_id uuid not null,
  coach_id uuid,
  aantal int not null default 1,
  created_at timestamptz not null default now()
);
create index if not exists lead_followup_events_coach_tijd on public.lead_followup_events (coach_id, created_at);
alter table public.lead_followup_events enable row level security;
create policy lfe_select on public.lead_followup_events for select to authenticated
  using (coach_id = auth.uid() or coach_id in (
    select o.coach_id from coach_team_members m join coach_team_members o on o.team_id = m.team_id where m.coach_id = auth.uid()));

create or replace function public.log_lead_followup() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  if coalesce(new.followup_count, 0) > coalesce(old.followup_count, 0) then
    insert into lead_followup_events (lead_id, coach_id, aantal)
    values (new.id, new.coach_id, new.followup_count - coalesce(old.followup_count, 0));
  end if;
  return new;
end $$;
create trigger trg_log_lead_followup after update of followup_count on public.call_leads
  for each row execute function public.log_lead_followup();

-- content_lead_stats: followups = greatest(som uit het log, oude telling op
-- last_followup_sent_at). Vóór 19 okt is alleen de oude telling er.

-- ── 20 okt 2026: outreach en follow-ups gesplitst ─────────────────────────
-- Marcel: "99 follow-ups" op 19 okt waren zijn ochtendronde campagne-DM's
-- (die knop doet ook followup_count +1), en "nieuwe leads" waren een bulk-
-- import. Het event-log krijgt nu een soort: zet dezelfde update ook
-- campaign_message_sent_at of last_contacted_at, dan is het outreach.
alter table lead_followup_events add column if not exists soort text not null default 'followup'
  check (soort in ('outreach','followup'));

create or replace function public.log_lead_followup()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
begin
  if coalesce(new.followup_count, 0) > coalesce(old.followup_count, 0) then
    insert into lead_followup_events (lead_id, coach_id, aantal, soort)
    values (new.id, new.coach_id, new.followup_count - coalesce(old.followup_count, 0),
      case when new.campaign_message_sent_at is distinct from old.campaign_message_sent_at
             or new.last_contacted_at is distinct from old.last_contacted_at
           then 'outreach' else 'followup' end);
  end if;
  return new;
end $function$;

-- content_lead_stats geeft nu (dag, outreach, followups, nieuwe_leads).
-- Vanaf 21 okt uit het log per soort; daarvoor uit de stempels op de lead
-- (campaign_message_sent_at = outreach; last_followup_sent_at zonder
-- campagne-bericht in dezelfde minuut = follow-up). Live definitie:
--   select pg_get_functiondef('public.content_lead_stats'::regproc);

-- ── 20 okt 2026: openstaande betalingen team-breed ───────────────────────
-- get_awaiting_payment en get_open_reservations filteren nu op
-- team_coach_ids(p_coach_id) in plaats van alleen de eigen coach_id, zodat
-- Kersten en Marcel dezelfde lijst zien. Rijen hebben nu ook coach_id.
create or replace function public.team_coach_ids(p_coach_id uuid)
returns uuid[] language sql stable as $$
  select coalesce(
    (select array_agg(distinct o.coach_id) from coach_team_members m
       join coach_team_members o on o.team_id = m.team_id
      where m.coach_id = p_coach_id),
    array[p_coach_id])
$$;
