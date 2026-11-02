-- ManyChat meelezen (2 nov 2026). Alleen toevoegen; oude app-versies merken niets.
--
-- ManyChat post via de actie External Request naar de edge function
-- manychat-webhook: gids_verstuurd, knop_geklikt of antwoord, per woord en
-- eventueel per variant (A/B). Nooit iets terug naar ManyChat: alleen meelezen.
--
-- Koppelen aan call_leads op first_name (daar staat de Instagram-handle;
-- call_leads heeft geen aparte handle-kolom). Commenters komen vaak pas de
-- volgende ochtend op het bord, dus cron manychat-koppel probeert open
-- gebeurtenissen elke 10 minuten opnieuw (30 dagen terug).
--
-- De sleutel staat in Vault als manychat_webhook_key, nooit in code of logs.

create table if not exists public.manychat_events (
  id uuid primary key default gen_random_uuid(),
  ontvangen_at timestamptz not null default now(),
  tijdstip timestamptz not null default now(),
  gebeurtenis text not null check (gebeurtenis in ('gids_verstuurd', 'knop_geklikt', 'antwoord')),
  woord text not null,
  variant text,
  instagram text,
  subscriber_id text,
  antwoord text,
  lead_id uuid references public.call_leads(id) on delete set null,
  coach_id uuid,
  verwerkt_at timestamptz
);
create index if not exists manychat_events_tijdstip_idx on public.manychat_events (tijdstip);
create index if not exists manychat_events_open_idx on public.manychat_events (tijdstip) where lead_id is null;
create index if not exists call_leads_handle_idx on public.call_leads (lower(trim(first_name))) where deleted_at is null;

alter table public.manychat_events enable row level security;
revoke all on public.manychat_events from public, anon, authenticated;
grant select on public.manychat_events to authenticated;
drop policy if exists manychat_events_team_select on public.manychat_events;
create policy manychat_events_team_select on public.manychat_events for select to authenticated
  using (coach_id = auth.uid() or coach_id in (
    select o.coach_id from coach_team_members m
    join coach_team_members o on o.team_id = m.team_id
    where m.coach_id = auth.uid()));

-- Op de leadkaart: het laatste antwoord uit de ManyChat-flow.
alter table public.call_leads add column if not exists manychat_antwoord text;
alter table public.call_leads add column if not exists manychat_antwoord_at timestamptz;

-- Handle → lead. Op het bord staat de handle in first_name, last_name is leeg
-- of dezelfde handle. Bij dubbelen de nieuwste.
create or replace function public._manychat_zoek_lead(p_handle text) returns uuid
language sql stable security definer set search_path to 'public' as $$
  select id from call_leads
  where deleted_at is null
    and lower(trim(first_name)) in (p_handle, '@' || p_handle)
    and (coalesce(trim(last_name), '') = '' or lower(trim(last_name)) in (p_handle, '@' || p_handle))
  order by created_at desc limit 1
$$;

-- Een antwoord op een gekoppelde lead: first_reply_at als die leeg is, tekst op
-- de kaart, en bovenaan DM vandaag. Alleen leads uit koude kolommen verhuizen:
-- wie al in gesprek is of een call heeft blijft staan en houdt de tekst op de
-- kaart. previous_section_* zoals dm_list_fill, die zet ze later ook weer terug.
create or replace function public._manychat_pas_antwoord_toe(p_event uuid) returns void
language plpgsql security definer set search_path to 'public' as $$
declare
  e manychat_events;
  v_lead call_leads;
  v_item lead_section_items;
  v_titel text;
  v_kleur text;
  v_dm lead_sections;
begin
  select * into e from manychat_events where id = p_event;
  if e.id is null or e.lead_id is null or e.gebeurtenis <> 'antwoord' or e.verwerkt_at is not null then
    return;
  end if;

  update call_leads set
    first_reply_at = coalesce(first_reply_at, e.tijdstip),
    manychat_antwoord = case when manychat_antwoord_at is null or e.tijdstip >= manychat_antwoord_at then e.antwoord else manychat_antwoord end,
    manychat_antwoord_at = greatest(manychat_antwoord_at, e.tijdstip)
  where id = e.lead_id
  returning * into v_lead;

  select * into v_dm from lead_sections where trim(title) = '📨 DM vandaag' limit 1;
  select i.*  into v_item from lead_section_items i where i.lead_id = e.lead_id limit 1;
  if v_dm.id is not null and v_item.id is not null then
    select trim(s.title), s.color into v_titel, v_kleur from lead_sections s where s.id = v_item.section_id;
    if v_item.section_id = v_dm.id then
      update lead_section_items set
        position = (select coalesce(min(position), 1) - 1 from lead_section_items where section_id = v_dm.id)
      where id = v_item.id;
    elsif v_titel in ('Nieuwe volgers', '1 Dag Stil', '2 Dagen Stil', '3+ Dagen Stil', '📵 Follow up stil', 'Latr-flw-up') then
      insert into lead_movements (lead_id, from_section_id, from_section_title, to_section_id, to_section_title, moved_at, coach_id, lead_first_name, lead_last_name, lead_name, outcome_type)
      values (e.lead_id, v_item.section_id, v_titel, v_dm.id, '📨 DM vandaag', now(), v_dm.coach_id,
        v_lead.first_name, v_lead.last_name, trim(coalesce(v_lead.first_name, '') || ' ' || coalesce(v_lead.last_name, '')), 'manychat_antwoord');
      update lead_section_items set
        position = (select coalesce(min(position), 1) - 1 from lead_section_items where section_id = v_dm.id),
        section_id = v_dm.id, moved_at = now(), previous_section_id = v_item.section_id,
        previous_section_title = v_titel, previous_section_color = v_kleur
      where id = v_item.id;
    end if;
  end if;

  update manychat_events set verwerkt_at = now() where id = p_event;
end $$;

-- Eén gebeurtenis van de webhook. Alleen service_role (de edge function).
-- Geen exceptions met invoer erin: persoonlijke antwoorden horen niet in logs.
create or replace function public.manychat_verwerk(p_sleutel text, p jsonb) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare
  v_sleutel text;
  v_gebeurtenis text := lower(trim(coalesce(p->>'gebeurtenis', '')));
  v_instagram text;
  v_subscriber text;
  v_woord text;
  v_variant text;
  v_antwoord text;
  v_tijd timestamptz := now();
  v_lead uuid;
  v_coach uuid;
  v_id uuid;
begin
  select decrypted_secret into v_sleutel from vault.decrypted_secrets where name = 'manychat_webhook_key' limit 1;
  if v_sleutel is null or p_sleutel is null or p_sleutel <> v_sleutel then
    return jsonb_build_object('ok', false, 'fout', 'sleutel');
  end if;
  if p_sleutel is not null and p is null then
    return jsonb_build_object('ok', true);
  end if;
  if v_gebeurtenis not in ('gids_verstuurd', 'knop_geklikt', 'antwoord') then
    return jsonb_build_object('ok', false, 'fout', 'gebeurtenis');
  end if;

  -- Een niet ingevuld ManyChat-veld kan letterlijk als {{veld}} binnenkomen.
  v_instagram := nullif(ltrim(lower(regexp_replace(coalesce(p->>'instagram', ''), '\{\{.*\}\}|\s', '', 'g')), '@'), '');
  v_subscriber := nullif(trim(regexp_replace(coalesce(p->>'subscriber_id', ''), '\{\{.*\}\}', '', 'g')), '');
  v_woord := coalesce(nullif(upper(trim(regexp_replace(coalesce(p->>'woord', ''), '\{\{.*\}\}', '', 'g'))), ''), 'ONBEKEND');
  v_variant := nullif(upper(trim(regexp_replace(coalesce(p->>'variant', ''), '\{\{.*\}\}', '', 'g'))), '');
  v_antwoord := left(nullif(trim(regexp_replace(coalesce(p->>'antwoord', ''), '^\{\{.*\}\}$', '')), ''), 2000);
  if v_instagram is null and v_subscriber is null then
    return jsonb_build_object('ok', false, 'fout', 'persoon');
  end if;

  begin
    v_tijd := least(coalesce(nullif(p->>'tijdstip', '')::timestamptz, now()), now());
  exception when others then
    v_tijd := now();
  end;

  if v_instagram is not null then v_lead := _manychat_zoek_lead(v_instagram); end if;
  select coalesce((select coach_id from call_leads where id = v_lead),
    (select coach_id from lead_sections where trim(title) = '📨 DM vandaag' limit 1)) into v_coach;

  insert into manychat_events (tijdstip, gebeurtenis, woord, variant, instagram, subscriber_id, antwoord, lead_id, coach_id)
  values (v_tijd, v_gebeurtenis, v_woord, v_variant, v_instagram, v_subscriber, case when v_gebeurtenis = 'antwoord' then v_antwoord end, v_lead, v_coach)
  returning id into v_id;

  perform _manychat_pas_antwoord_toe(v_id);
  return jsonb_build_object('ok', true, 'gekoppeld', v_lead is not null);
end $$;

-- Open gebeurtenissen alsnog koppelen zodra de lead op het bord staat.
create or replace function public.manychat_koppel_open() returns integer
language plpgsql security definer set search_path to 'public' as $$
declare
  r record;
  v_lead uuid;
  v_aantal integer := 0;
begin
  for r in
    select id, instagram from manychat_events
    where lead_id is null and instagram is not null and tijdstip > now() - interval '30 days'
    order by tijdstip
  loop
    v_lead := _manychat_zoek_lead(r.instagram);
    if v_lead is not null then
      update manychat_events set lead_id = v_lead,
        coach_id = coalesce((select coach_id from call_leads where id = v_lead), coach_id)
      where id = r.id;
      perform _manychat_pas_antwoord_toe(r.id);
      v_aantal := v_aantal + 1;
    end if;
  end loop;
  return v_aantal;
end $$;

-- Per woord: gids verstuurd, geklikt, geantwoord, antwoord-% (uniek per persoon),
-- plus dezelfde cijfers per variant. Security invoker: RLS bepaalt wat je ziet.
-- Ook voor Gino: select get_manychat_woorden(van, tot).
create or replace function public.get_manychat_woorden(p_van timestamptz, p_tot timestamptz) returns jsonb
language sql stable set search_path to 'public' as $$
  with e as (
    select woord, coalesce(variant, '') variant, gebeurtenis, coalesce(subscriber_id, instagram) persoon
    from manychat_events where tijdstip >= p_van and tijdstip < p_tot
  ),
  per_variant as (
    select woord, variant,
      count(distinct persoon) filter (where gebeurtenis = 'gids_verstuurd') gids,
      count(distinct persoon) filter (where gebeurtenis = 'knop_geklikt') geklikt,
      count(distinct persoon) filter (where gebeurtenis = 'antwoord') geantwoord
    from e group by 1, 2
  ),
  per_woord as (
    select woord,
      count(distinct persoon) filter (where gebeurtenis = 'gids_verstuurd') gids,
      count(distinct persoon) filter (where gebeurtenis = 'knop_geklikt') geklikt,
      count(distinct persoon) filter (where gebeurtenis = 'antwoord') geantwoord
    from e group by 1
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'woord', w.woord, 'gids', w.gids, 'geklikt', w.geklikt, 'geantwoord', w.geantwoord,
      'antwoord_pct', round(100.0 * w.geantwoord / nullif(w.gids, 0), 1),
      'varianten', (select coalesce(jsonb_agg(jsonb_build_object(
          'variant', v.variant, 'gids', v.gids, 'geklikt', v.geklikt, 'geantwoord', v.geantwoord,
          'antwoord_pct', round(100.0 * v.geantwoord / nullif(v.gids, 0), 1)) order by v.variant), '[]'::jsonb)
        from per_variant v where v.woord = w.woord and v.variant <> '')
    ) order by w.gids desc, w.woord), '[]'::jsonb)
  from per_woord w
$$;

revoke all on function public._manychat_zoek_lead(text) from public, anon, authenticated;
revoke all on function public._manychat_pas_antwoord_toe(uuid) from public, anon, authenticated;
revoke all on function public.manychat_verwerk(text, jsonb) from public, anon, authenticated;
revoke all on function public.manychat_koppel_open() from public, anon, authenticated;
grant execute on function public.manychat_verwerk(text, jsonb) to service_role;
revoke all on function public.get_manychat_woorden(timestamptz, timestamptz) from public, anon;
grant execute on function public.get_manychat_woorden(timestamptz, timestamptz) to authenticated;

-- get_magnet_trechter: alleen de sleutel manychat erbij, op de live definitie
-- (bestaande velden en eerdere patches blijven staan).
do $$
declare
  v_def text := pg_get_functiondef('public.get_magnet_trechter(timestamptz, timestamptz)'::regprocedure);
  v_anker text := $a$'comments_bijgewerkt', (select max(updated_at) from content_ig_media where comments is not null)$a$;
begin
  if position('''manychat''' in v_def) > 0 then return; end if;
  if position(v_anker in v_def) = 0 then raise exception 'anker niet gevonden'; end if;
  execute replace(v_def, v_anker, v_anker || $a$,
    'manychat', public.get_manychat_woorden(p_van, p_tot)$a$);
end $$;

-- Sleutel eenmalig aanmaken; de waarde komt nergens in beeld.
select vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'manychat_webhook_key')
where not exists (select 1 from vault.secrets where name = 'manychat_webhook_key');

select cron.schedule('manychat-koppel', '*/10 * * * *', 'select public.manychat_koppel_open()');

-- Gino: dezelfde cijfers via lees_database.
update public.business_os_skills
set instructies = instructies || E'\n\nManyChat per woord: select get_manychat_woorden(van, tot) geeft gids verstuurd, geklikt, geantwoord en antwoord-% per woord en per variant (A/B). Geklikt = de knop in de flow, niet de link in de gids.'
where naam = 'Leadsysteem-cijfers' and position('get_manychat_woorden' in instructies) = 0;

-- Na het draaien van dit bestand: manychat_antwoord en manychat_antwoord_at
-- toevoegen aan BORD_KOLOMMEN in LeadManagementService.js. Niet eerder: een
-- onbekende kolom laat die query falen. Het bord (get_kanban_board_lui) geeft
-- ze via to_jsonb(l) al vanzelf mee.
