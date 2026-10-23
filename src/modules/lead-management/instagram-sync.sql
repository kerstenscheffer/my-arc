-- Instagram-sync voor de content-checklist (20 okt 2026).
-- 23 okt 2026: ook comments_count per post (content_ig_media.comments), voor
-- de comment-magnet-trechter (zie challenge-ads/magnet-trechter.sql).
-- Haalt elk uur via de Instagram API (Instagram-login, geen Facebook-pagina)
-- de laatste posts en de live stories op. Token: Vault 'meta_ig_token'
-- (rechten instagram_business_basic + instagram_business_manage_insights).
-- Zonder token doet de cron niets. Het token wordt wekelijks verlengd.
--
-- Ruwe data in content_ig_media (stories verdwijnen na 24 uur bij Instagram,
-- hier blijven ze). Reels gaan ook naar content_metricool_posts (magnet als de
-- caption een Reageer "WOORD" of DM WOORD-trigger heeft) en de dagtellingen
-- naar content_metricool, met het hoogste van Metricool en Instagram.

create table if not exists public.content_ig_media (
  id text primary key,
  eigenaar uuid not null,
  tijd timestamptz not null,
  dag date not null,
  soort text not null check (soort in ('reel', 'magnet', 'foto', 'story')),
  woord text,
  views int,
  tekst text,
  updated_at timestamptz not null default now()
);
create index if not exists content_ig_media_dag on public.content_ig_media (eigenaar, dag);
alter table public.content_ig_media enable row level security;
drop policy if exists cim_select on public.content_ig_media;
create policy cim_select on public.content_ig_media for select to authenticated
  using (eigenaar = content_eigenaar());

-- Magnet-woord uit een caption: Reageer "PREP", comment 'LIDL', DM 80/20.
create or replace function public.content_ig_woord(caption text) returns text
language sql immutable as $$
  select upper(trim(coalesce(
    (regexp_match(caption, '(?:reageer|comment|typ)\s+(?:met\s+)?["“”''‘’]([^"“”''‘’]{2,25})["“”''‘’]', 'i'))[1],
    (regexp_match(caption, '\mDM\s+(?:me\s+)?["“”]?([A-Z0-9][A-Z0-9/-]{1,20})'))[1]
  )))
$$;

-- Verwerkt de API-antwoorden. Los van de HTTP-calls zodat hij te testen is.
-- p_media: [{id, caption, media_type, media_product_type, timestamp, views}]
-- p_stories: [{id, timestamp}]
create or replace function public.content_ig_verwerk(p_eigenaar uuid, p_media jsonb, p_stories jsonb)
returns text language plpgsql security definer set search_path to 'public' as $$
declare
  m jsonb; v_tijd timestamptz; v_lokaal timestamp; v_dag date; v_soort text; v_woord text;
  v_dagen date[] := '{}'; n int := 0;
begin
  for m in select * from jsonb_array_elements(coalesce(p_media, '[]')) loop
    v_tijd := (m->>'timestamp')::timestamptz;
    v_lokaal := v_tijd at time zone 'Europe/Amsterdam';
    v_dag := v_lokaal::date;
    if m->>'media_product_type' = 'STORY' then continue; end if;
    if m->>'media_product_type' = 'REELS' or m->>'media_type' = 'VIDEO' then
      v_woord := content_ig_woord(m->>'caption');
      v_soort := case when v_woord is not null then 'magnet' else 'reel' end;
    else
      v_woord := null; v_soort := 'foto';
    end if;
    insert into content_ig_media (id, eigenaar, tijd, dag, soort, woord, views, tekst, comments)
    values (m->>'id', p_eigenaar, v_tijd, v_dag, v_soort, v_woord, (m->>'views')::int, left(m->>'caption', 200), (m->>'comments_count')::int)
    on conflict (id) do update set soort = excluded.soort, woord = excluded.woord,
      views = coalesce(excluded.views, content_ig_media.views), tekst = excluded.tekst,
      comments = coalesce(excluded.comments, content_ig_media.comments), updated_at = now();
    if v_soort in ('reel', 'magnet') then
      -- Metricool-rij van dezelfde reel (zelfde moment, paar seconden verschil) vervangen.
      delete from content_metricool_posts where eigenaar = p_eigenaar and tijd <> v_lokaal
        and tijd between v_lokaal - interval '2 minutes' and v_lokaal + interval '2 minutes'
        -- nooit een andere Instagram-post weggooien (twee reels kort na elkaar)
        and not exists (select 1 from content_ig_media i where i.eigenaar = p_eigenaar
          and (i.tijd at time zone 'Europe/Amsterdam') = content_metricool_posts.tijd);
      insert into content_metricool_posts (eigenaar, tijd, dag, soort, woord, views, tekst)
      values (p_eigenaar, v_lokaal, v_dag, v_soort, v_woord, (m->>'views')::int, case when v_soort = 'reel' then left(m->>'caption', 200) end)
      on conflict (eigenaar, tijd) do update set soort = excluded.soort, woord = excluded.woord,
        views = coalesce(excluded.views, content_metricool_posts.views), tekst = excluded.tekst;
    end if;
    v_dagen := array_append(v_dagen, v_dag); n := n + 1;
  end loop;

  for m in select * from jsonb_array_elements(coalesce(p_stories, '[]')) loop
    v_tijd := (m->>'timestamp')::timestamptz;
    v_dag := (v_tijd at time zone 'Europe/Amsterdam')::date;
    insert into content_ig_media (id, eigenaar, tijd, dag, soort)
    values (m->>'id', p_eigenaar, v_tijd, v_dag, 'story') on conflict (id) do nothing;
    v_dagen := array_append(v_dagen, v_dag); n := n + 1;
  end loop;

  -- Dagtellingen: het hoogste van wat Metricool en Instagram zien.
  insert into content_metricool (eigenaar, dag, reels, fotos, stories, updated_at)
  select p_eigenaar, d,
    nullif(count(*) filter (where soort in ('reel', 'magnet')), 0),
    nullif(count(*) filter (where soort = 'foto'), 0),
    nullif(count(*) filter (where soort = 'story'), 0), now()
  from content_ig_media, unnest(array(select distinct x from unnest(v_dagen) x)) d
  where eigenaar = p_eigenaar and dag = d group by d
  on conflict (eigenaar, dag) do update set
    reels = nullif(greatest(coalesce(content_metricool.reels, 0), coalesce(excluded.reels, 0)), 0),
    fotos = nullif(greatest(coalesce(content_metricool.fotos, 0), coalesce(excluded.fotos, 0)), 0),
    stories = nullif(greatest(coalesce(content_metricool.stories, 0), coalesce(excluded.stories, 0)), 0),
    updated_at = now();
  return n || ' items verwerkt';
end $$;
revoke all on function public.content_ig_verwerk(uuid, jsonb, jsonb) from public, anon, authenticated;

create or replace function public.sync_instagram() returns text
language plpgsql security definer set search_path to 'public', 'extensions' as $$
declare
  v_eigenaar uuid := '5a0135ac-3188-499d-8682-ed6a179e5541'; -- Kersten (team-eigenaar)
  v_tok text; v_secret_id uuid; v_secret_tijd timestamptz;
  v_res record; v_media jsonb; v_stories jsonb; v_lijst jsonb := '[]'; m jsonb; v_views int;
  v_basis text := 'https://graph.instagram.com/v21.0/';
begin
  select id, decrypted_secret, updated_at into v_secret_id, v_tok, v_secret_tijd
    from vault.decrypted_secrets where name = 'meta_ig_token' order by created_at desc limit 1;
  v_tok := regexp_replace(v_tok, '\s', '', 'g'); -- geplakt token: spaties/enters weg
  if v_tok is null or v_tok = '' then return 'geen token'; end if;

  -- Token verlengen (60 dagen geldig; kan pas na 24 uur).
  if v_secret_tijd < now() - interval '7 days' then
    select * into v_res from http_get('https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=' || v_tok);
    if v_res.status = 200 and (v_res.content::jsonb ->> 'access_token') is not null then
      v_tok := v_res.content::jsonb ->> 'access_token';
      perform vault.update_secret(v_secret_id, v_tok);
    end if;
  end if;

  select * into v_res from http_get(v_basis || 'me/media?fields=id,caption,media_type,media_product_type,timestamp,comments_count&limit=50&access_token=' || v_tok);
  if v_res.status <> 200 then return 'media fout ' || v_res.status || ': ' || left(coalesce(v_res.content::jsonb -> 'error' ->> 'message', ''), 200); end if;
  v_media := coalesce(v_res.content::jsonb -> 'data', '[]');

  -- Views alleen voor reels van de laatste 7 dagen (één call per reel).
  for m in select * from jsonb_array_elements(v_media) loop
    v_views := null;
    if (m->>'media_product_type' = 'REELS' or m->>'media_type' = 'VIDEO')
       and (m->>'timestamp')::timestamptz > now() - interval '7 days' then
      begin
        select * into v_res from http_get(v_basis || (m->>'id') || '/insights?metric=views&access_token=' || v_tok);
        if v_res.status = 200 then
          v_views := (v_res.content::jsonb -> 'data' -> 0 -> 'values' -> 0 ->> 'value')::int;
        end if;
      exception when others then v_views := null;
      end;
    end if;
    v_lijst := v_lijst || jsonb_build_array(m || jsonb_build_object('views', v_views));
  end loop;

  select * into v_res from http_get(v_basis || 'me/stories?fields=id,media_type,timestamp&access_token=' || v_tok);
  v_stories := case when v_res.status = 200 then coalesce(v_res.content::jsonb -> 'data', '[]') else '[]' end;

  return content_ig_verwerk(v_eigenaar, v_lijst, v_stories)
    || case when v_res.status <> 200 then ' (stories fout ' || v_res.status || ')' else '' end;
end $$;
revoke all on function public.sync_instagram() from public, anon, authenticated;

select cron.schedule('instagram-sync', '23 * * * *', 'select public.sync_instagram()');

-- 20 okt 2026, eenmalig uitgevoerd: de Metricool-rijen in content_metricool_posts
-- stonden in UTC (2 uur te vroeg). Dubbelen met Instagram verwijderd, de rest
-- omgezet naar Europe/Amsterdam (tijd en dag).
