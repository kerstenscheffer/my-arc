-- Content-autopilot (31 okt 2026). Winnende magnet-reels en 'Welke 2 pak
-- jij?'-reels komen terug als nieuwe variant (scripts/content-autopilot.mjs
-- maakt ze lokaal met ffmpeg) en gaan via de Instagram Content Publishing API
-- online. Standaard pas na Goedkeuren in het Content-paneel; met de schakelaar
-- Automatisch ook zonder. Alleen toevoegen: oude app-versies blijven werken.
-- Uitgevoerd via Supabase MCP execute_sql.

-- 1. Bibliotheek: eigen reels/magnets met lokaal bestand en prestaties.
create table if not exists public.content_bibliotheek (
  ig_id text primary key,
  eigenaar uuid not null,
  soort text,                 -- magnet | reel
  woord text,
  tijd timestamptz,
  lokaal_pad text,            -- ~/Movies/MY ARC bibliotheek/<ig_id>.mp4
  views int,
  comments int,
  comments_per_1000 numeric,
  leads int,
  sales int,
  is_variant boolean not null default false,
  bron_ig_id text,            -- variant: van welke reel
  item_id uuid,               -- variant: content_items-rij
  onder_gemiddelde boolean,   -- na 48 uur: onder eigen gemiddelde = niet opnieuw
  gemeten_at timestamptz,
  gedownload_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.content_bibliotheek enable row level security;
drop policy if exists cb_eigen on public.content_bibliotheek;
create policy cb_eigen on public.content_bibliotheek for all to authenticated
  using (eigenaar = content_eigenaar()) with check (eigenaar = content_eigenaar());

-- 2. Wachtrij: velden op content_items (allemaal nullable).
alter table public.content_items
  add column if not exists autopilot_bron text,       -- ig_id van de bronreel
  add column if not exists autopilot_status text,     -- wacht | hook_aanpassen | goedgekeurd | overgeslagen | bezig | gepubliceerd | fout
  add column if not exists autopilot_woord text,
  add column if not exists autopilot_bestand text,    -- lokaal pad van de variant
  add column if not exists autopilot_video text,      -- pad in bucket content-autopilot
  add column if not exists autopilot_cover text,      -- pad in bucket content-autopilot
  add column if not exists autopilot_caption text,
  add column if not exists autopilot_container text,  -- Instagram-container tijdens publiceren
  add column if not exists autopilot_fout text,
  add column if not exists ig_media_id text;          -- nieuw ig_id na publiceren
create index if not exists content_items_autopilot on public.content_items (autopilot_status) where autopilot_status is not null;

-- 3. Schakelaar.
create table if not exists public.content_autopilot (
  eigenaar uuid primary key,
  automatisch boolean not null default false,
  max_per_dag int not null default 5,
  updated_at timestamptz not null default now()
);
alter table public.content_autopilot enable row level security;
drop policy if exists ca_eigen on public.content_autopilot;
create policy ca_eigen on public.content_autopilot for all to authenticated
  using (eigenaar = content_eigenaar()) with check (eigenaar = content_eigenaar());

-- 4. Opslag: Instagram haalt de video zelf op, dus publieke bucket met
-- uuid-paden. Alleen de team-eigenaar (Kersten) schrijft.
insert into storage.buckets (id, name, public) values ('content-autopilot', 'content-autopilot', true)
  on conflict (id) do nothing;
drop policy if exists cap_schrijf on storage.objects;
create policy cap_schrijf on storage.objects for insert to authenticated
  with check (bucket_id = 'content-autopilot' and auth.uid() = content_eigenaar());
drop policy if exists cap_lees on storage.objects;
create policy cap_lees on storage.objects for select to authenticated
  using (bucket_id = 'content-autopilot' and auth.uid() = content_eigenaar()); -- nodig voor upsert
drop policy if exists cap_wijzig on storage.objects;
create policy cap_wijzig on storage.objects for update to authenticated
  using (bucket_id = 'content-autopilot' and auth.uid() = content_eigenaar());

-- 5. Download-links van eigen media (token blijft in de database).
create or replace function public.content_ig_media_urls(p_ids text[])
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions' as $$
declare
  v_eigenaar uuid := '5a0135ac-3188-499d-8682-ed6a179e5541';
  v_tok text; v_res record; v_id text; v_uit jsonb := '[]';
begin
  if auth.uid() is distinct from v_eigenaar then raise exception 'alleen de eigenaar'; end if;
  select regexp_replace(decrypted_secret, '\s', '', 'g') into v_tok
    from vault.decrypted_secrets where name = 'meta_ig_token' order by created_at desc limit 1;
  if coalesce(v_tok, '') = '' then return v_uit; end if;
  for v_id in select m.id from content_ig_media m
      where m.id = any(p_ids[1:30]) and m.eigenaar = v_eigenaar and m.soort in ('reel', 'magnet') loop
    begin
      select * into v_res from http_get('https://graph.instagram.com/v21.0/' || v_id
        || '?fields=id,media_url,thumbnail_url,permalink&access_token=' || v_tok);
      if v_res.status = 200 then v_uit := v_uit || jsonb_build_array(v_res.content::jsonb); end if;
    exception when others then null;
    end;
  end loop;
  return v_uit;
end $$;
revoke all on function public.content_ig_media_urls(text[]) from public, anon;
grant execute on function public.content_ig_media_urls(text[]) to authenticated;

-- 6. Winnaars op eigen gemiddelde (laatste p_dagen). Soort magnet: comments
-- per 1.000 views boven eigen gemiddelde, gewogen met sales per 1.000 leads
-- van het woord. Alleen woorden met een lead_magnets-rij (dus SWAP pas als
-- die er is). pak2: 'Welke 2 pak jij?'. bereik: views >= 2x gemiddelde.
-- Niet: bron die de laatste 30 dagen al een variant kreeg, varianten zelf, en
-- bronnen waarvan een variant onder het gemiddelde bleef.
create or replace function public.content_autopilot_winnaars(p_dagen int default 90, p_aantal int default 10)
returns table (ig_id text, soort text, woord text, tijd timestamptz, views int, comments int,
  cpm numeric, leads int, sales int, score numeric, tekst text, lokaal_pad text)
language sql stable set search_path to 'public' as $$
  with eig as (select content_eigenaar() e),
  basis as (
    select m.*, round(m.comments * 1000.0 / nullif(m.views, 0), 2) cpm,
      m.tekst ~* '^\s*welke 2 pak jij' pak2
    from content_ig_media m, eig
    where m.eigenaar = eig.e and m.soort in ('magnet', 'reel')
      and m.tijd > now() - make_interval(days => p_dagen) and coalesce(m.views, 0) >= 500
      and not exists (select 1 from content_bibliotheek b where b.ig_id = m.id and b.is_variant)
  ),
  gem as (select avg(cpm) g_cpm, avg(views) g_views from basis where soort = 'magnet'),
  tr as (select get_magnet_trechter(now() - make_interval(days => p_dagen), now()) j),
  lw as (
    select upper(l->>'woord') woord, count(*)::int leads,
      count(*) filter (where coalesce((l->>'omzet')::numeric, 0) > 0)::int sales
    from tr, jsonb_array_elements(tr.j->'leads') l group by 1
  ),
  lw2 as (select lw.*, sales * 1000.0 / nullif(leads, 0) spl from lw),
  gem_spl as (select avg(spl) g from lw2 where leads >= 5),
  -- Kleine aantallen naar het gemiddelde trekken (1 sale op 75 leads is ruis).
  lw3 as (select lw2.*, (sales + gem_spl.g * 0.2) / (leads + 200) * 1000 / nullif(gem_spl.g, 0) spl_ratio from lw2, gem_spl),
  geldig as (select distinct upper(woord) woord from lead_magnets where woord is not null),
  uit as (
    select distinct autopilot_bron b from content_items
      where autopilot_bron is not null and created_at > now() - interval '30 days'
    union select bron_ig_id from content_bibliotheek where is_variant and onder_gemiddelde
  ),
  kand as (
    select b.*, lw3.leads, lw3.sales,
      case when b.soort = 'magnet' and b.woord in (select woord from geldig) and b.cpm >= gem.g_cpm then 'magnet'
           when b.pak2 then 'pak2'
           when b.views >= 2 * gem.g_views and (b.woord is null or (b.woord in (select woord from geldig) and b.cpm >= gem.g_cpm / 2)) then 'bereik' end soort_v,
      -- magnet: comments/1.000 t.o.v. gemiddelde x sales/1.000 leads van het woord;
      -- pak2/bereik: views t.o.v. gemiddelde, gedempt zodat magnets voorgaan.
      round(
        case when b.soort = 'magnet' and b.woord in (select woord from geldig) and b.cpm >= gem.g_cpm
             then b.cpm / nullif(gem.g_cpm, 0) * (0.5 + least(coalesce(lw3.spl_ratio, 0.5), 2))
             else least(b.views / nullif(gem.g_views, 0), 10) / 2 end, 2) sc
    from basis b cross join gem left join lw3 on lw3.woord = b.woord
    where b.id not in (select b from uit where b is not null)
  ),
  gerangschikt as (
    select k.*, row_number() over (partition by coalesce(k.woord, k.soort_v) order by k.sc desc) per_woord
    from kand k where k.soort_v is not null
  )
  select g.id, g.soort_v, g.woord, g.tijd, g.views, g.comments, g.cpm, g.leads, g.sales, g.sc,
    left(g.tekst, 200), (select lokaal_pad from content_bibliotheek cb where cb.ig_id = g.id)
  from gerangschikt g where g.per_woord <= 3
  order by g.sc desc, g.views desc limit p_aantal
$$;
grant execute on function public.content_autopilot_winnaars(int, int) to authenticated;

-- 7. Publiceren (cron elke 10 min). Alleen goedgekeurde items, of ook 'wacht'
-- als Automatisch aan staat. Pas vanaf het geplande moment, tussen 14 en 21 uur,
-- en nooit meer dan max_per_dag magnets op een dag (eigen posts meegeteld).
create or replace function public.content_autopilot_publiceer()
returns text language plpgsql security definer set search_path to 'public', 'extensions' as $$
declare
  v_eigenaar uuid := '5a0135ac-3188-499d-8682-ed6a179e5541';
  v_basis text := 'https://graph.instagram.com/v21.0/';
  v_opslag text := 'https://xlaycpwpnhjmulfsnynh.supabase.co/storage/v1/object/public/content-autopilot/';
  v_tok text; v_auto boolean; v_max int; v_nu timestamp := now() at time zone 'Europe/Amsterdam';
  it record; v_res record; v_j jsonb; v_vandaag int; n int := 0;
begin
  select regexp_replace(decrypted_secret, '\s', '', 'g') into v_tok
    from vault.decrypted_secrets where name = 'meta_ig_token' order by created_at desc limit 1;
  if coalesce(v_tok, '') = '' then return 'geen token'; end if;
  select coalesce(automatisch, false), coalesce(max_per_dag, 5) into v_auto, v_max from content_autopilot where eigenaar = v_eigenaar;
  v_auto := coalesce(v_auto, false); v_max := coalesce(v_max, 5);

  -- Containers die klaarstaan: status bekijken en publiceren.
  for it in select * from content_items where autopilot_status = 'bezig' and autopilot_container is not null limit 5 loop
    select * into v_res from http_get(v_basis || it.autopilot_container || '?fields=status_code&access_token=' || v_tok);
    v_j := case when v_res.status = 200 then v_res.content::jsonb end;
    if v_j->>'status_code' = 'FINISHED' then
      select * into v_res from http_post(v_basis || 'me/media_publish', urlencode(jsonb_build_object('creation_id', it.autopilot_container, 'access_token', v_tok)), 'application/x-www-form-urlencoded');
      v_j := v_res.content::jsonb;
      if v_res.status = 200 and v_j->>'id' is not null then
        update content_items set autopilot_status = 'gepubliceerd', ig_media_id = v_j->>'id', posted_at = now(), status = 'created', autopilot_fout = null, updated_at = now() where id = it.id;
        insert into content_bibliotheek (ig_id, eigenaar, soort, woord, tijd, lokaal_pad, is_variant, bron_ig_id, item_id)
        values (v_j->>'id', v_eigenaar, 'magnet', it.autopilot_woord, now(), it.autopilot_bestand, true, it.autopilot_bron, it.id)
        on conflict (ig_id) do nothing;
        n := n + 1;
      else
        update content_items set autopilot_status = 'fout', autopilot_fout = left(coalesce(v_j->'error'->>'message', v_res.status::text), 300) where id = it.id;
      end if;
    elsif v_j->>'status_code' in ('ERROR', 'EXPIRED') or it.updated_at < now() - interval '2 hours' then
      update content_items set autopilot_status = 'fout', autopilot_fout = 'Instagram verwerkte de video niet (' || coalesce(v_j->>'status_code', 'geen status') || ')' where id = it.id;
    end if;
  end loop;

  if extract(hour from v_nu) < 14 or extract(hour from v_nu) >= 21 then return n || ' gepubliceerd (buiten posttijd)'; end if;
  select count(*) into v_vandaag from content_ig_media where eigenaar = v_eigenaar and soort = 'magnet' and dag = v_nu::date;

  -- Nieuwe containers voor items waarvan het moment daar is.
  for it in select * from content_items
      where coach_id = v_eigenaar and autopilot_video is not null and ig_media_id is null
        and (autopilot_status = 'goedgekeurd' or (v_auto and autopilot_status = 'wacht'))
        and planned_date is not null
        and (planned_date + coalesce(nullif(planned_time, '')::time, '14:00')) <= v_nu
      order by planned_date, planned_time limit 2 loop
    exit when v_vandaag >= v_max;
    select * into v_res from http_post(v_basis || 'me/media', urlencode(jsonb_strip_nulls(jsonb_build_object(
      'media_type', 'REELS', 'video_url', v_opslag || it.autopilot_video,
      'cover_url', case when it.autopilot_cover is not null then v_opslag || it.autopilot_cover end,
      'caption', it.autopilot_caption, 'share_to_feed', 'true', 'access_token', v_tok))), 'application/x-www-form-urlencoded');
    v_j := v_res.content::jsonb;
    if v_res.status = 200 and v_j->>'id' is not null then
      update content_items set autopilot_status = 'bezig', autopilot_container = v_j->>'id', updated_at = now() where id = it.id;
      v_vandaag := v_vandaag + 1;
    else
      update content_items set autopilot_status = 'fout', autopilot_fout = left(coalesce(v_j->'error'->>'message', v_res.status::text), 300) where id = it.id;
    end if;
  end loop;
  return n || ' gepubliceerd';
end $$;
revoke all on function public.content_autopilot_publiceer() from public, anon, authenticated;

-- 8. Meten na 48 uur: views/comments uit de Instagram-sync, leads van het
-- woord in die 48 uur naar rato van het aantal magnets met dat woord.
create or replace function public.content_autopilot_meet()
returns text language plpgsql security definer set search_path to 'public' as $$
declare
  v_eigenaar uuid := '5a0135ac-3188-499d-8682-ed6a179e5541';
  r record; v_m record; v_tr jsonb; v_leads numeric; v_reels int; v_gem numeric; n int := 0;
begin
  select avg(comments * 1000.0 / nullif(views, 0)) into v_gem from content_ig_media
    where eigenaar = v_eigenaar and soort = 'magnet' and views >= 500 and tijd > now() - interval '90 days';
  for r in select * from content_bibliotheek where is_variant and gemeten_at is null and tijd < now() - interval '48 hours' loop
    select * into v_m from content_ig_media where id = r.ig_id;
    if v_m.id is null then continue; end if;
    v_tr := get_magnet_trechter(r.tijd, r.tijd + interval '48 hours');
    select count(*) into v_leads from jsonb_array_elements(v_tr->'leads') l where upper(l->>'woord') = upper(r.woord);
    select greatest(count(*), 1) into v_reels from content_ig_media
      where eigenaar = v_eigenaar and soort = 'magnet' and upper(woord) = upper(r.woord) and tijd between r.tijd and r.tijd + interval '48 hours';
    update content_bibliotheek set views = v_m.views, comments = v_m.comments,
      comments_per_1000 = round(v_m.comments * 1000.0 / nullif(v_m.views, 0), 2),
      leads = round(v_leads / v_reels)::int, gemeten_at = now(), updated_at = now(),
      onder_gemiddelde = coalesce(v_m.comments * 1000.0 / nullif(v_m.views, 0), 0) < coalesce(v_gem, 0)
    where ig_id = r.ig_id;
    n := n + 1;
  end loop;
  return n || ' gemeten';
end $$;
revoke all on function public.content_autopilot_meet() from public, anon, authenticated;

select cron.schedule('content-autopilot', '*/10 * * * *', 'select public.content_autopilot_publiceer(); select public.content_autopilot_meet();');
