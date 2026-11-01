-- src/modules/business-os/content-status.sql
--
-- Afgeleide status per content_items-rij (1 nov 2026): draft / ingepland /
-- gepost / mislukt. Eén bron voor de contentkalender (GinoKalender/GinoContent),
-- het Content-paneel, het Autopilot-paneel en Gino's context.
-- Alleen toevoegen: niets weggehaald of hernoemd (oude app-versies).
--
-- Regels:
--   gepost    = posted_at of ig_media_id gevuld, of status 'created' (oude knop "Gepost")
--   mislukt   = autopilot_status 'fout' (melding in autopilot_fout)
--   ingepland = autopilot-video staat klaar (autopilot_video) en goedgekeurd/bezig,
--               of 'wacht' terwijl de schakelaar Automatisch aan staat → de cron
--               content_autopilot_publiceer plaatst hem vanzelf
--   draft     = de rest (idee, concept, geen video, talking head die Kersten zelf opneemt)

-- 1. View: per item de stand + views/comments van de gekoppelde Instagram-post.
create or replace view public.content_items_status with (security_invoker = true) as
select ci.id,
  case
    when ci.posted_at is not null or ci.ig_media_id is not null or ci.status = 'created' then 'gepost'
    when ci.autopilot_status = 'fout' then 'mislukt'
    when ci.autopilot_video is not null and (
      ci.autopilot_status in ('goedgekeurd', 'bezig')
      or (ci.autopilot_status = 'wacht' and coalesce(ca.automatisch, false))
    ) then 'ingepland'
    else 'draft'
  end as stand,
  m.views, m.comments,
  (ci.planned_date + case when ci.planned_time ~ '^[0-9]{1,2}:[0-9]{2}$' then ci.planned_time::time else '14:00'::time end) as moment
from public.content_items ci
left join public.content_autopilot ca on ca.eigenaar = ci.coach_id
left join public.content_ig_media m on m.id = ci.ig_media_id;

revoke all on public.content_items_status from anon;
grant select on public.content_items_status to authenticated;

-- 2. Zelf geplaatste posts koppelen: content_ig_media op dezelfde dag met
-- hetzelfde comment-woord of dezelfde eerste regel als hook/caption. Eén post
-- per item. Autopilot-items met video slaan we over: die koppelt de cron zelf,
-- en een vroeg gekoppeld item zou zijn eigen geplande plaatsing blokkeren.
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

-- Elk uur na de Instagram-sync (:23).
select cron.schedule('content-koppel-ig', '33 * * * *', 'select public.content_koppel_ig();');

-- 3. Mislukt → regel in app_fouten (pagina content-autopilot).
create or replace function public.content_items_fout_log()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into app_fouten (user_id, pagina, melding)
  values (new.coach_id, 'content-autopilot',
    left('Publiceren mislukt: ' || coalesce(new.hook, new.title, new.id::text) || ' | ' || coalesce(new.autopilot_fout, 'geen melding'), 500));
  return new;
end $$;

create trigger content_items_fout_log
  after update of autopilot_status on public.content_items
  for each row when (new.autopilot_status = 'fout' and old.autopilot_status is distinct from 'fout')
  execute function public.content_items_fout_log();

-- 4. Telling per dag. Gepost telt ook Instagram-posts zonder item mee
-- (magnets/reels/foto's die Kersten zelf plaatste en niet gepland had).
create or replace function public.content_stand_per_dag(p_van date, p_tot date)
returns table (dag date, draft int, ingepland int, gepost int, mislukt int, los_gepost int, views bigint)
language sql stable security invoker set search_path = public as $$
  with d as (select generate_series(p_van, p_tot, interval '1 day')::date dag),
  i as (
    select ci.planned_date dag, s.stand, s.views from content_items ci join content_items_status s on s.id = ci.id
    where ci.coach_id = auth.uid() and ci.planned_date between p_van and p_tot
      and coalesce(ci.is_template, false) = false and coalesce(ci.autopilot_status, '') not in ('overgeslagen')
  ),
  l as (
    select m.dag, count(*)::int n, sum(m.views) v from content_ig_media m
    where m.eigenaar = content_eigenaar() and m.dag between p_van and p_tot and m.soort <> 'story'
      and not exists (select 1 from content_items x where x.ig_media_id = m.id)
    group by m.dag
  )
  select d.dag,
    (select count(*) from i where i.dag = d.dag and stand = 'draft')::int,
    (select count(*) from i where i.dag = d.dag and stand = 'ingepland')::int,
    (select count(*) from i where i.dag = d.dag and stand = 'gepost')::int + coalesce(l.n, 0),
    (select count(*) from i where i.dag = d.dag and stand = 'mislukt')::int,
    coalesce(l.n, 0),
    coalesce((select sum(views) from i where i.dag = d.dag and stand = 'gepost'), 0) + coalesce(l.v, 0)
  from d left join l on l.dag = d.dag
  order by d.dag;
$$;
revoke all on function public.content_stand_per_dag(date, date) from anon;
grant execute on function public.content_stand_per_dag(date, date) to authenticated;
