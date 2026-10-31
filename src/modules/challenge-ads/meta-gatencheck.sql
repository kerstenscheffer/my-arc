-- Meta-adspend gatencheck (31 okt 2026). Draait dagelijks via cron 'meta-ad-gatencheck' (07:40 UTC).
-- sync_meta_ad_insights(7) haalt elk uur al de laatste 7 dagen opnieuw op (Meta corrigeert achteraf).
-- Deze functie meldt in app_fouten (pagina meta-sync) elke afgelopen dag zonder rijen in meta_ad_insights
-- terwijl er een campagne liep. Alleen lezen bij Meta; token wordt nergens gelogd.

create or replace function public.meta_ad_insights_gatencheck(p_dagen integer default 7)
 returns text
 language plpgsql
 security definer
 set search_path to 'public', 'extensions'
as $function$
declare
  v_token text; v_account text; v_res record; v_campagnes jsonb := '[]'::jsonb;
  v_meta jsonb := '{}'::jsonb; v_meta_ok boolean := false; r jsonb; d date; v_reden text; n int := 0;
  v_tot date := (now() at time zone 'Europe/Amsterdam')::date - 1;
  v_van date := v_tot - greatest(p_dagen, 1) + 1;
begin
  select decrypted_secret into v_token from vault.decrypted_secrets where name = 'meta_ads_token' order by created_at desc limit 1;
  select decrypted_secret into v_account from vault.decrypted_secrets where name = 'meta_ad_account_id' order by created_at desc limit 1;
  if v_token is null or v_account is null then return 'geen token of account'; end if;
  v_account := regexp_replace(v_account, '^act_', '');

  select * into v_res from http_get('https://graph.facebook.com/v21.0/act_' || v_account
    || '/insights?level=account&time_increment=1&limit=500&fields=spend'
    || '&time_range=%7B%22since%22%3A%22' || v_van || '%22%2C%22until%22%3A%22' || v_tot || '%22%7D'
    || '&access_token=' || v_token);
  if v_res.status = 200 then
    v_meta_ok := true;
    for r in select * from jsonb_array_elements(coalesce((v_res.content::jsonb) -> 'data', '[]'::jsonb)) loop
      v_meta := v_meta || jsonb_build_object(r->>'date_start', coalesce((r->>'spend')::numeric, 0));
    end loop;
  end if;
  select * into v_res from http_get('https://graph.facebook.com/v21.0/act_' || v_account
    || '/campaigns?fields=name,effective_status,start_time,stop_time&limit=200&access_token=' || v_token);
  if v_res.status = 200 then
    v_campagnes := coalesce((v_res.content::jsonb) -> 'data', '[]'::jsonb);
  end if;

  for d in select generate_series(v_van, v_tot, interval '1 day')::date loop
    continue when exists (select 1 from meta_ad_insights where dag = d);
    v_reden := null;
    if coalesce((v_meta ->> d::text)::numeric, 0) > 0 then
      v_reden := 'Meta heeft ' || (v_meta ->> d::text) || ' spend, sync mist de dag';
    -- Antwoordde Meta wél, dan is geen spend echt geen spend (22 okt: campagnewissel).
    -- Alleen als Meta niet antwoordde, gokken we op actieve campagnes of een gat tussen spenddagen.
    elsif v_meta_ok then
      v_reden := null;
    elsif exists (select 1 from jsonb_array_elements(v_campagnes) c
                  where c->>'effective_status' = 'ACTIVE'
                    and (c->>'start_time')::timestamptz < (d + 1)::timestamp at time zone 'Europe/Amsterdam'
                    and (c->>'stop_time' is null or (c->>'stop_time')::timestamptz > d::timestamp at time zone 'Europe/Amsterdam')) then
      v_reden := 'actieve campagne liep, maar geen data';
    elsif exists (select 1 from meta_ad_insights where dag < d and spend > 0)
      and exists (select 1 from meta_ad_insights where dag > d and spend > 0) then
      v_reden := 'geen data tussen twee dagen met spend in';
    end if;
    continue when v_reden is null;
    continue when exists (select 1 from app_fouten where pagina = 'meta-sync' and melding like 'Meta-adspend: geen data op ' || d || '%');
    insert into app_fouten (user_id, pagina, melding, versie)
    values (null, 'meta-sync', 'Meta-adspend: geen data op ' || d || ' (' || v_reden || ')', 'meta_ad_insights_gatencheck');
    n := n + 1;
  end loop;
  return n || ' gat(en) gemeld, gecontroleerd ' || v_van || ' t/m ' || v_tot;
end $function$;
revoke all on function public.meta_ad_insights_gatencheck(integer) from public, anon, authenticated;

-- select cron.schedule('meta-ad-gatencheck', '40 7 * * *', 'select public.meta_ad_insights_gatencheck(7)');
