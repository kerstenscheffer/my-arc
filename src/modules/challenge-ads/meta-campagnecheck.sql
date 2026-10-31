-- Meta-adspend campagnecheck (31 okt 2026). NOG NIET UITGEVOERD: schemawijziging, draaien via execute_sql.
-- Aanleiding: meta_ad_insights miste 4 campagnes (EUR 173,41, 26 feb t/m 13 mrt 2026) omdat de sync pas in
-- oktober startte en alleen 7 dagen terugkijkt. Historie is op 31 okt bijgehaald met sync_meta_ad_insights(260)
-- en ad_spend periode 2026-03-01 is gevuld (173,41).
--
-- Deze functie vergelijkt met Meta (alleen lezen, token wordt nergens gelogd):
--   1. per campagne de totale spend (date_preset=maximum) met de som in meta_ad_insights;
--   2. per dag (laatste p_dagen) de account-spend met de som in meta_ad_insights.
-- Afwijking van EUR 1 of meer → melding in app_fouten (pagina meta-sync), één keer per campagne/dag.
-- Ontbreekt er iets, dan haal je het bij met: select public.sync_meta_ad_insights(<dagen terug>);
-- Aanvulling: gatencheck blijft bestaan en ongewijzigd.

create or replace function public.meta_ad_campagnecheck(p_dagen integer default 30)
 returns text
 language plpgsql
 security definer
 set search_path to 'public', 'extensions'
as $function$
declare
  v_token text; v_account text; v_res record; r record; n int := 0; v_melding text;
  v_meta_camp jsonb := '[]'::jsonb; v_meta_dag jsonb := '[]'::jsonb;
  v_tot date := (now() at time zone 'Europe/Amsterdam')::date - 1;
  v_van date := v_tot - greatest(p_dagen, 1) + 1;
begin
  select decrypted_secret into v_token from vault.decrypted_secrets where name = 'meta_ads_token' order by created_at desc limit 1;
  select decrypted_secret into v_account from vault.decrypted_secrets where name = 'meta_ad_account_id' order by created_at desc limit 1;
  if v_token is null or v_account is null then return 'geen token of account'; end if;
  v_account := regexp_replace(v_account, '^act_', '');

  select * into v_res from http_get('https://graph.facebook.com/v21.0/act_' || v_account
    || '/insights?level=campaign&date_preset=maximum&limit=500&fields=campaign_id,campaign_name,spend'
    || '&access_token=' || v_token);
  if v_res.status <> 200 then return 'Meta antwoordde ' || v_res.status || ' (campagnes)'; end if;
  v_meta_camp := coalesce((v_res.content::jsonb) -> 'data', '[]'::jsonb);

  select * into v_res from http_get('https://graph.facebook.com/v21.0/act_' || v_account
    || '/insights?level=account&time_increment=1&limit=500&fields=spend'
    || '&time_range=%7B%22since%22%3A%22' || v_van || '%22%2C%22until%22%3A%22' || v_tot || '%22%7D'
    || '&access_token=' || v_token);
  if v_res.status <> 200 then return 'Meta antwoordde ' || v_res.status || ' (dagen)'; end if;
  v_meta_dag := coalesce((v_res.content::jsonb) -> 'data', '[]'::jsonb);

  -- 1. Per campagne
  for r in
    select m->>'campaign_id' as cid, m->>'campaign_name' as naam, (m->>'spend')::numeric as meta,
           coalesce((select sum(spend) from meta_ad_insights i where i.campaign_id = m->>'campaign_id'), 0) as db
    from jsonb_array_elements(v_meta_camp) m
  loop
    continue when abs(r.meta - r.db) < 1;
    v_melding := 'Meta-adspend: campagne ' || r.naam || ' (' || r.cid || ') mist in de app';
    continue when exists (select 1 from app_fouten where pagina = 'meta-sync' and melding like v_melding || '%');
    insert into app_fouten (user_id, pagina, melding, versie)
    values (null, 'meta-sync', v_melding || ': Meta ' || r.meta || ', app ' || r.db, 'meta_ad_campagnecheck');
    n := n + 1;
  end loop;

  -- 2. Per dag
  for r in
    select (m->>'date_start')::date as dag, coalesce((m->>'spend')::numeric, 0) as meta,
           coalesce((select sum(spend) from meta_ad_insights i where i.dag = (m->>'date_start')::date), 0) as db
    from jsonb_array_elements(v_meta_dag) m
  loop
    continue when abs(r.meta - r.db) < 1;
    v_melding := 'Meta-adspend: dag ' || r.dag || ' wijkt af';
    continue when exists (select 1 from app_fouten where pagina = 'meta-sync' and melding like v_melding || '%');
    insert into app_fouten (user_id, pagina, melding, versie)
    values (null, 'meta-sync', v_melding || ': Meta ' || r.meta || ', app ' || r.db, 'meta_ad_campagnecheck');
    n := n + 1;
  end loop;

  return n || ' afwijking(en) gemeld; ' || jsonb_array_length(v_meta_camp) || ' campagnes en dagen ' || v_van || ' t/m ' || v_tot || ' gecontroleerd';
end $function$;
revoke all on function public.meta_ad_campagnecheck(integer) from public, anon, authenticated;

-- Dagelijks na de gatencheck:
-- select cron.schedule('meta-ad-campagnecheck', '45 7 * * *', 'select public.meta_ad_campagnecheck(30)');
