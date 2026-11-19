-- dm-lijst-tweede-ronde.sql  (19 nov 2026)
--
-- Tweede ronde voor de kolom "📨 DM vandaag": mannen die al eens reageerden.
--
-- Waarom v2: dm_list_fill + get_dm_list sluiten iedereen uit met een tag van de
-- meegegeven campagne ('challenge Man'). De bekende mannen waren daardoor op;
-- de lijst vulde zich met leads van onbekend geslacht die nooit reageerden.
-- De oude functies blijven ongewijzigd staan (oude aanroepen blijven werken).
--
-- Wie roept dit aan: GEEN pg_cron en geen app-code. Een cloud-routine
-- (claude.ai, "DM-lijst van de dag → CRM-kolom 📨 DM vandaag",
-- trig_01KCz2oaCDTkD4LC1DapFAij, werkdagen 05:30 NL) draait:
--   select * from dm_list_fill_v2('<coach>', '<campagne van deze ronde>', 100, 50);
-- De campagne staat in de opdracht van die routine. Nieuwe ronde = nieuwe rij in
-- outreach_campaigns + het id in de routine vervangen.
-- Let op bij het aanpassen van die routine via de API: job_config gaat er in
-- zijn geheel in (losse velden worden geweigerd), en een aanroep van ~75 kB
-- komt niet door de toestemmingskaart. Sinds 19 nov 2026 draait hij daarom
-- zonder de lange standaard-systeemtekst van Cowork.
-- Draai dm_list_fill_v2 nooit twee keer op een ochtend: bij een kleine lijst
-- (<50) zet de tweede run de net geplaatste leads terug als 'niet gestuurd'.
--
-- "Gestuurd" = de lead heeft een tag van de campagne van deze ronde. Die tag
-- zet het bord zelf: megafoon → campagne kiezen → paarse DM-knop op de kaart
-- (KanbanCard.handleCampaignDM → updateLead → tag_lead_campaign).

-- ---------------------------------------------------------------------------
-- 1. Leads die tijdelijk niet op de DM-lijst mogen (bv. net een call-voorstel).
-- ---------------------------------------------------------------------------
-- Bewust zonder foreign key: een rij van een lead die niet meer bestaat doet niets.
create table if not exists public.dm_lijst_overslaan (
  lead_id    uuid primary key,              -- call_leads.id
  tot        date not null,                 -- t/m deze dag overslaan
  reden      text,
  created_at timestamptz not null default now()
);

alter table public.dm_lijst_overslaan enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'dm_lijst_overslaan' and policyname = 'rls_coach') then
    create policy rls_coach on public.dm_lijst_overslaan
      for all to authenticated
      using ((select rls_is_coach()))
      with check ((select rls_is_coach()));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. De selectie: mannen die reageerden, meest recente eerste reactie eerst.
-- ---------------------------------------------------------------------------
create or replace function public.get_dm_list_v2(
  p_coach_id           uuid,
  p_campaign_id        uuid,
  p_limit              integer default 100,
  p_tag_cooldown_days  integer default 14,
  p_move_cooldown_days integer default 3,
  p_reply_since        date    default '2026-09-01'
)
returns table(pos integer, lead_id uuid, handle text, sectie text,
              first_reply_at timestamptz, last_tag timestamptz,
              reply_count integer, instagram_url text)
language sql
stable
set search_path to 'public'
as $function$
with team as (
  select unnest(team_coach_ids(p_coach_id)) as coach_id
), client_names as (
  -- bestaande of oud-klanten: nooit benaderen (zelfde match als get_dm_list)
  select lower(trim(c.first_name || ' ' || coalesce(c.last_name,''))) as fullname,
         lower(split_part(coalesce(c.email,''), '@', 1)) as mailhandle
  from clients c where c.coach_id in (select t.coach_id from team t)
), cand as (
  select cl.id as lead_id,
         cl.first_name as handle,
         cl.first_reply_at,
         coalesce(cl.reply_count, 0) as reply_count,
         (select trim(ls.title)
            from lead_section_items lsi join lead_sections ls on ls.id = lsi.section_id
           where lsi.lead_id = cl.id
           order by lsi.moved_at desc nulls last limit 1) as sectie,
         (select max(t.tagged_at) from lead_campaign_tags t where t.lead_id = cl.id) as last_tag,
         (select max(lm.moved_at) from lead_movements lm where lm.lead_id = cl.id) as last_move
  from call_leads cl
  where cl.deleted_at is null
    and cl.coach_id in (select t.coach_id from team t)
    and cl.gender = 'male'
    and cl.first_reply_at >= p_reply_since
    and coalesce(cl.is_snoozed, false) = false
    -- alleen leads met een insta-handle
    and cl.lead_source ilike 'instagram%'
    and cl.first_name ~ '^[A-Za-z0-9._]+$'
    and exists (select 1 from lead_section_items lsi where lsi.lead_id = cl.id)
    and not exists (
      select 1 from lead_section_items lsi join lead_sections ls on ls.id = lsi.section_id
      where lsi.lead_id = cl.id
        and trim(ls.title) in ('Sale 🏆','Sales Call','Call voorgesteld','Niet geschikt',
                               '💤 Snooze','Gesprek Whatsapp','Gesprek insta')
    )
    -- al gestuurd in deze ronde
    and not exists (select 1 from lead_campaign_tags t
                    where t.lead_id = cl.id and t.campaign_id = p_campaign_id)
    -- ooit een sale
    and not exists (select 1 from lead_movements m
                    where m.lead_id = cl.id and m.order_value > 0 and m.reverted_at is null)
    -- tijdelijk overslaan
    and not exists (select 1 from dm_lijst_overslaan o
                    where o.lead_id = cl.id
                      and o.tot >= (now() at time zone 'Europe/Amsterdam')::date)
    -- geen (oud-)klanten
    and not exists (
      select 1 from client_names cn
      where cn.fullname = lower(trim(cl.first_name))
         or (cn.mailhandle <> '' and cn.mailhandle = lower(trim(cl.first_name)))
         or (cl.email is not null and lower(cl.email) = lower(cn.mailhandle || '@' || split_part(cl.email,'@',2)) and cn.mailhandle <> '')
    )
    and not exists (
      select 1 from clients c
      where c.coach_id in (select t.coach_id from team t)
        and cl.email is not null and lower(c.email) = lower(cl.email)
    )
    and coalesce(cl.last_dm_interaction, '2000-01-01'::timestamptz) < now() - make_interval(days => p_move_cooldown_days)
    and coalesce(cl.last_touched, '2000-01-01'::timestamptz) < now() - make_interval(days => p_move_cooldown_days)
)
select (row_number() over (order by c.first_reply_at desc, c.lead_id))::integer as pos,
       c.lead_id, c.handle, c.sectie, c.first_reply_at, c.last_tag, c.reply_count,
       'https://instagram.com/' || c.handle as instagram_url
from cand c
where coalesce(c.last_tag, '2000-01-01'::timestamptz) < now() - make_interval(days => p_tag_cooldown_days)
  and coalesce(c.last_move, '2000-01-01'::timestamptz) < now() - make_interval(days => p_move_cooldown_days)
order by c.first_reply_at desc, c.lead_id
limit p_limit;
$function$;

-- ---------------------------------------------------------------------------
-- 3. De kolom vullen. Stap 1 t/m 4 gelijk aan dm_list_fill; stap 5 leest de
--    selectie hierboven in plaats van get_dm_list.
-- ---------------------------------------------------------------------------
create or replace function public.dm_list_fill_v2(
  p_coach_id       uuid,
  p_campaign_id    uuid,
  p_limit          integer default 100,
  p_skip_threshold integer default 50
)
returns table(actie text, gestuurd integer, hersteld integer, teruggezet integer, geplaatst integer, staat_nu integer)
language plpgsql
security definer
set search_path to 'public'
set work_mem to '16MB'
as $function$
declare
  v_sec_id uuid;
  v_sent int := 0;
  v_fix int := 0;
  v_back int := 0;
  v_put int := 0;
  v_cnt int := 0;
begin
  select id into v_sec_id from lead_sections
   where coach_id = p_coach_id and trim(title) = '📨 DM vandaag' limit 1;
  if v_sec_id is null then raise exception 'sectie DM vandaag ontbreekt'; end if;
  if not exists (select 1 from outreach_campaigns where id = p_campaign_id) then
    raise exception 'campagne % bestaat niet', p_campaign_id;
  end if;

  -- STAP 1: leads met een tag van de campagne van deze ronde = DM is gestuurd -> uit de kolom
  with done as (
    select i.id as item_id, i.lead_id, i.previous_section_id, i.previous_section_title,
           l.first_name, l.last_name
    from lead_section_items i
    join call_leads l on l.id = i.lead_id
    where i.section_id = v_sec_id and i.previous_section_id is not null
      and exists (select 1 from lead_campaign_tags t
                  where t.lead_id = i.lead_id and t.campaign_id = p_campaign_id)
  ), mv as (
    insert into lead_movements (lead_id, from_section_id, from_section_title, to_section_id, to_section_title, moved_at, coach_id, lead_first_name, lead_last_name, lead_name, outcome_type)
    select lead_id, v_sec_id, '📨 DM vandaag', previous_section_id, previous_section_title, now(), p_coach_id,
           first_name, last_name, trim(coalesce(first_name,'')||' '||coalesce(last_name,'')), 'dm_gestuurd'
    from done returning lead_id
  ), upd as (
    update lead_section_items i
       set section_id = d.previous_section_id, moved_at = now(),
           previous_section_id = null, previous_section_title = null, previous_section_color = null
      from done d where i.id = d.item_id
    returning 1
  )
  select count(*) into v_sent from upd;

  -- STAP 2: herstel leads die automatisch naar een stil-kolom zijn geschoven
  with placed as (
    select lm.lead_id, max(lm.moved_at) as placed_at
    from lead_movements lm
    where lm.coach_id = p_coach_id and lm.outcome_type = 'dm_lijst'
      and lm.moved_at > now() - interval '3 days'
    group by lm.lead_id
  ), lost as (
    select p.lead_id, i.id as item_id, i.section_id as from_id,
           s.title as from_title, s.color as from_color, l.first_name, l.last_name
    from placed p
    join lead_section_items i on i.lead_id = p.lead_id
    join lead_sections s on s.id = i.section_id
    join call_leads l on l.id = p.lead_id and l.deleted_at is null
    where i.section_id <> v_sec_id
      and trim(s.title) in ('1 Dag Stil','2 Dagen Stil','3+ Dagen Stil','📵 Follow up stil')
      and not exists (select 1 from lead_campaign_tags t where t.lead_id = p.lead_id and t.campaign_id = p_campaign_id)
      and not exists (
        select 1 from lead_movements m
        where m.lead_id = p.lead_id and trim(m.from_section_title) = '📨 DM vandaag'
          and m.moved_at >= p.placed_at
      )
  ), mv as (
    insert into lead_movements (lead_id, from_section_id, from_section_title, to_section_id, to_section_title, moved_at, coach_id, lead_first_name, lead_last_name, lead_name, outcome_type)
    select lead_id, from_id, from_title, v_sec_id, '📨 DM vandaag', now(), p_coach_id,
           first_name, last_name, trim(coalesce(first_name,'')||' '||coalesce(last_name,'')), 'dm_hersteld'
    from lost returning lead_id
  ), upd as (
    update lead_section_items i
       set section_id = v_sec_id, moved_at = now(),
           previous_section_id = o.from_id, previous_section_title = o.from_title, previous_section_color = o.from_color
      from lost o where i.id = o.item_id
    returning 1
  )
  select count(*) into v_fix from upd;

  -- STAP 3: staat de lijst nog te vol? Dan geen nieuwe lijst.
  select count(*) into v_cnt from lead_section_items where section_id = v_sec_id;
  if v_cnt >= p_skip_threshold then
    return query select 'overgeslagen'::text, v_sent, v_fix, 0, 0, v_cnt;
    return;
  end if;

  -- STAP 4: rest = niet gestuurd -> terug naar de oude kolom
  with old as (
    select i.id as item_id, i.lead_id, i.previous_section_id, i.previous_section_title,
           l.first_name, l.last_name
    from lead_section_items i join call_leads l on l.id = i.lead_id
    where i.section_id = v_sec_id and i.previous_section_id is not null
  ), mv as (
    insert into lead_movements (lead_id, from_section_id, from_section_title, to_section_id, to_section_title, moved_at, coach_id, lead_first_name, lead_last_name, lead_name, outcome_type)
    select lead_id, v_sec_id, '📨 DM vandaag', previous_section_id, previous_section_title, now(), p_coach_id,
           first_name, last_name, trim(coalesce(first_name,'')||' '||coalesce(last_name,'')), 'dm_niet_gestuurd'
    from old returning lead_id
  ), upd as (
    update lead_section_items i
       set section_id = o.previous_section_id, moved_at = now(),
           previous_section_id = null, previous_section_title = null, previous_section_color = null
      from old o where i.id = o.item_id
    returning 1
  )
  select count(*) into v_back from upd;

  -- STAP 5: nieuwe lijst erin (selectie van de tweede ronde)
  with pick as (
    select d.lead_id, d.pos
    from get_dm_list_v2(p_coach_id, p_campaign_id, p_limit) d
  ), cur as (
    select distinct on (p.lead_id)
           p.lead_id, p.pos, i.id as item_id, i.section_id as from_id, s.title as from_title, s.color as from_color,
           l.first_name, l.last_name
    from pick p
    join lead_section_items i on i.lead_id = p.lead_id
    join lead_sections s on s.id = i.section_id
    join call_leads l on l.id = p.lead_id
    where i.section_id <> v_sec_id
    order by p.lead_id, i.moved_at desc nulls last
  ), mv as (
    insert into lead_movements (lead_id, from_section_id, from_section_title, to_section_id, to_section_title, moved_at, coach_id, lead_first_name, lead_last_name, lead_name, outcome_type)
    select lead_id, from_id, from_title, v_sec_id, '📨 DM vandaag', now(), p_coach_id,
           first_name, last_name, trim(coalesce(first_name,'')||' '||coalesce(last_name,'')), 'dm_lijst'
    from cur returning lead_id
  ), upd as (
    update lead_section_items i
       set section_id = v_sec_id, position = c.pos, moved_at = now(),
           previous_section_id = c.from_id, previous_section_title = c.from_title, previous_section_color = c.from_color
      from cur c where i.id = c.item_id
    returning 1
  )
  select count(*) into v_put from upd;

  select count(*) into v_cnt from lead_section_items where section_id = v_sec_id;
  return query select 'gevuld'::text, v_sent, v_fix, v_back, v_put, v_cnt;
end $function$;

-- De vuller verplaatst leads voor de hele coach: niet aanroepbaar vanuit de app.
revoke all on function public.dm_list_fill_v2(uuid, uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.dm_list_fill_v2(uuid, uuid, integer, integer) to service_role;

revoke all on function public.get_dm_list_v2(uuid, uuid, integer, integer, integer, date) from public, anon;
grant execute on function public.get_dm_list_v2(uuid, uuid, integer, integer, integer, date) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. Gebruik (19 nov 2026)
-- ---------------------------------------------------------------------------
-- Campagne van deze ronde: 'Tweede ronde | mannen die reageerden'
--   outreach_campaigns.id = fee25b17-793a-4b18-8278-64c767304a99
--
-- Vooraf kijken wie er komt (verandert niets):
--   select * from get_dm_list_v2('5a0135ac-3188-499d-8682-ed6a179e5541',
--                                'fee25b17-793a-4b18-8278-64c767304a99', 100);
--
-- Dagelijkse run (routine):
--   select * from dm_list_fill_v2('5a0135ac-3188-499d-8682-ed6a179e5541',
--                                 'fee25b17-793a-4b18-8278-64c767304a99', 100, 50);
--
-- Lead tijdelijk overslaan:
--   insert into dm_lijst_overslaan (lead_id, tot, reden) values ('<lead>', '2026-12-03', 'call-voorstel')
--   on conflict (lead_id) do update set tot = excluded.tot, reden = excluded.reden;
