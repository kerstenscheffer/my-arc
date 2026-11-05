-- src/modules/business-os/metricool-sync.sql
--
-- 5 nov 2026: alles wat in Metricool staat komt in de contentkalender
-- (scripts/metricool-kalender.mjs, elke 15 min vanuit de PA). Alleen toevoegen:
-- niets weggehaald of hernoemd, de view houdt dezelfde kolommen (oude app-versies).
--
-- metricool_stand = wat Metricool zegt: draft / ingepland / gepost / mislukt / weg.
-- weg = post verdwenen uit Metricool: planned_date leeg, rij blijft bestaan.

-- 1. Kolom en bescherming tegen dubbele rijen.
alter table public.content_items add column if not exists metricool_stand text;
create unique index if not exists content_items_metricool_post
  on public.content_items (coach_id, metricool_post_id) where metricool_post_id is not null;

-- 2. Stand: de eerste drie regels zijn ongewijzigd, Metricool komt erachter.
create or replace view public.content_items_status with (security_invoker = true) as
select ci.id,
  case
    when ci.posted_at is not null or ci.ig_media_id is not null or ci.status = 'created' then 'gepost'
    when ci.autopilot_status = 'fout' then 'mislukt'
    when coalesce(ci.autopilot_video, ci.autopilot_preview) is not null
      and ci.autopilot_status in ('goedgekeurd', 'bezig', 'publiceert') then 'ingepland'
    when ci.metricool_stand = 'gepost' then 'gepost'
    when ci.metricool_stand = 'mislukt' then 'mislukt'
    when ci.metricool_stand = 'ingepland' then 'ingepland'
    else 'draft'
  end as stand,
  m.views, m.comments,
  (ci.planned_date + case when ci.planned_time ~ '^[0-9]{1,2}:[0-9]{2}$' then ci.planned_time::time else '14:00'::time end) as moment,
  ci.ig_permalink
from public.content_items ci
left join public.content_ig_media m on m.id = ci.ig_media_id;
revoke all on public.content_items_status from anon;
grant select on public.content_items_status to authenticated;

-- 3. Koppelen aan Instagram: dezelfde functie, met één filter erbij. Een draft of
-- een nog komende post in Metricool is niet geplaatst, ook niet als er die dag een
-- andere post met hetzelfde comment-woord live staat.
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
      and coalesce(ci.metricool_stand, '') not in ('draft', 'weg')
      and not (ci.metricool_stand = 'ingepland'
        and ci.planned_date + case when ci.planned_time ~ '^[0-9]{1,2}:[0-9]{2}$' then ci.planned_time::time else '14:00'::time end
          > (now() at time zone 'Europe/Amsterdam'))
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
