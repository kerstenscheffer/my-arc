-- src/modules/business-os/instagram-publiceer.sql
--
-- Content-autopilot plaatst zelf op Instagram, zonder Metricool (1 nov 2026).
-- De bestaande cron 'content-autopilot' (elke 10 min) roept nog steeds
-- content_autopilot_publiceer() aan; die geeft het werk nu door aan de edge
-- function instagram-publiceer (ondertekende links uit de privé bucket
-- content-varianten, container, status volgen, media_publish).
-- Alleen goedgekeurde items worden geplaatst; Automatisch plaatst niets meer
-- zonder goedkeuring. Alleen toevoegen: niets weggehaald of hernoemd.
-- Volgorde: eerst edge function instagram-publiceer deployen (verify_jwt aan),
-- dan dit bestand draaien.

-- 1. Permalink na plaatsen (Bekijk-knop).
alter table public.content_items add column if not exists ig_permalink text;

-- 2. Token voor de edge function. Alleen service_role, nooit de app.
create or replace function public.content_ig_token()
returns text language sql stable security definer set search_path to 'public' as $$
  select regexp_replace(decrypted_secret, '\s', '', 'g')
  from vault.decrypted_secrets where name = 'meta_ig_token' order by created_at desc limit 1
$$;
revoke all on function public.content_ig_token() from public, anon, authenticated;
grant execute on function public.content_ig_token() to service_role;

-- 3. Publiceer-cron → edge function. Zelfde naam en returntype, de cron-regel
-- blijft gelijk. De anon-sleutel komt uit de agenda-sync-cron (staat zo niet in de repo).
create or replace function public.content_autopilot_publiceer()
returns text language plpgsql security definer set search_path to 'public', 'extensions' as $$
declare v_key text; v_req bigint;
begin
  select substring(command from 'Bearer ([A-Za-z0-9._-]+)') into v_key from cron.job where jobname = 'agenda-sync' limit 1;
  if v_key is null then return 'geen sleutel'; end if;
  select net.http_post(
    url := 'https://xlaycpwpnhjmulfsnynh.supabase.co/functions/v1/instagram-publiceer',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key),
    body := '{}'::jsonb, timeout_milliseconds := 150000) into v_req;
  return 'doorgezet ' || v_req;
end $$;
revoke all on function public.content_autopilot_publiceer() from public, anon, authenticated;

-- 4. Stand: ingepland = goedgekeurd met video (ook alleen privé preview).
-- Automatisch telt niet meer: zonder goedkeuring wordt niets geplaatst.
-- Kolommen gelijk + ig_permalink achteraan.
create or replace view public.content_items_status with (security_invoker = true) as
select ci.id,
  case
    when ci.posted_at is not null or ci.ig_media_id is not null or ci.status = 'created' then 'gepost'
    when ci.autopilot_status = 'fout' then 'mislukt'
    when coalesce(ci.autopilot_video, ci.autopilot_preview) is not null
      and ci.autopilot_status in ('goedgekeurd', 'bezig', 'publiceert') then 'ingepland'
    else 'draft'
  end as stand,
  m.views, m.comments,
  (ci.planned_date + case when ci.planned_time ~ '^[0-9]{1,2}:[0-9]{2}$' then ci.planned_time::time else '14:00'::time end) as moment,
  ci.ig_permalink
from public.content_items ci
left join public.content_ig_media m on m.id = ci.ig_media_id;
revoke all on public.content_items_status from anon;
grant select on public.content_items_status to authenticated;

-- 5. Zelf geplaatste posts koppelen: ook goedgekeurde preview-varianten
-- overslaan, die plaatst en koppelt de edge function zelf.
create or replace function public.content_koppel_ig()
returns int language plpgsql security definer set search_path = public as $$
declare
  it record; v_id text; n int := 0;
begin
  for it in
    select ci.id, ci.coach_id, ci.planned_date, ci.planned_time, ci.autopilot_woord,
      regexp_replace(lower(split_part(coalesce(ci.hook, ci.title, ''), E'\n', 1)), '[^a-z0-9]+', '', 'g') as hook_n,
      regexp_replace(lower(split_part(coalesce(ci.autopilot_caption, ''), E'\n', 1)), '[^a-z0-9]+', '', 'g') as cap_n
    from content_items ci
    where ci.posted_at is null and ci.ig_media_id is null and coalesce(ci.status, '') <> 'created'
      and coalesce(ci.is_template, false) = false
      and ci.planned_date between current_date - 30 and current_date
      and coalesce(ci.autopilot_status, '') <> 'overgeslagen'
      and ci.autopilot_video is null
      and not (ci.autopilot_preview is not null and coalesce(ci.autopilot_status, '') in ('goedgekeurd', 'bezig', 'publiceert'))
    order by ci.planned_date, ci.planned_time
  loop
    select m.id into v_id
    from content_ig_media m
    cross join lateral (select regexp_replace(lower(split_part(coalesce(m.tekst, ''), E'\n', 1)), '[^a-z0-9]+', '', 'g') as t) e
    where m.eigenaar = it.coach_id and m.dag = it.planned_date and m.soort <> 'story'
      and not exists (select 1 from content_items x where x.ig_media_id = m.id)
      and (
        (it.autopilot_woord is not null and upper(m.woord) = upper(it.autopilot_woord))
        or (length(it.hook_n) >= 12 and length(e.t) >= 12 and (e.t like it.hook_n || '%' or it.hook_n like e.t || '%'))
        or (length(it.cap_n) >= 12 and length(e.t) >= 12 and (e.t like it.cap_n || '%' or it.cap_n like e.t || '%'))
      )
    order by abs(extract(epoch from (m.tijd at time zone 'Europe/Amsterdam')
      - (it.planned_date + case when it.planned_time ~ '^[0-9]{1,2}:[0-9]{2}$' then it.planned_time::time else '17:00'::time end)))
    limit 1;
    if v_id is not null then
      update content_items c set ig_media_id = v_id, posted_at = m.tijd at time zone 'UTC', status = 'created', updated_at = now()
        from content_ig_media m where c.id = it.id and m.id = v_id;
      n := n + 1;
    end if;
  end loop;
  return n;
end $$;
revoke all on function public.content_koppel_ig() from public, anon, authenticated;

-- 6. Mislukt → app_fouten onder pagina instagram-publiceer.
create or replace function public.content_items_fout_log()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into app_fouten (user_id, pagina, melding)
  values (new.coach_id, 'instagram-publiceer',
    left('Publiceren mislukt: ' || coalesce(new.hook, new.title, new.id::text) || ' | ' || coalesce(new.autopilot_fout, 'geen melding'), 500));
  return new;
end $$;

-- Gedraaid op 3 nov 2026 na akkoord van Kersten.
