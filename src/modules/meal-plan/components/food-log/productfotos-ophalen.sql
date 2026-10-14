-- Echte verpakkingsfoto's voor merkproducten (live sinds 14 okt 2026).
-- pg_cron 'productfotos-ophalen' draait elke minuut: select public.productfotos_ophalen(8)
-- Open Food Facts weigert snelle reeksen vanaf het Supabase-IP (429 na ~7 verzoeken),
-- daarom 8 per minuut met 3 s ertussen: ~11.000 per dag, 37.000 producten in 3-4 dagen.
-- Geen foto bij OFF: image_url_checked_at gezet, na 90 dagen opnieuw.
-- In de app vult vulZoekFotos (enrichImageFromOFF.js) daarnaast de eerste 6
-- zoekresultaten zonder foto direct aan.

create or replace function public.productfotos_ophalen(p_aantal int default 8)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  r record;
  v_resp extensions.http_response;
  v_url text;
  v_gevonden int := 0;
  v_leeg int := 0;
  v_fout int := 0;
begin
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '4000');
  for r in
    select id, barcode from ai_ingredients
    where barcode is not null and image_url is null
      and barcode ~ '^[0-9]{6,14}$'
      and (image_url_checked_at is null or image_url_checked_at < now() - interval '90 days')
    order by log_count desc nulls last, id
    limit p_aantal
  loop
    -- Netjes doseren: OFF geeft al na een korte reeks snelle verzoeken een 429.
    perform pg_sleep(3);
    begin
      v_resp := extensions.http((
        'GET',
        'https://world.openfoodfacts.org/api/v2/product/' || r.barcode || '.json?fields=image_front_url,image_url',
        array[extensions.http_header('User-Agent', 'MyArc - Nutrition App - 1.0')],
        null, null
      )::extensions.http_request);
    exception when others then
      v_fout := v_fout + 1;
      continue;
    end;
    if v_resp.status = 429 then
      return jsonb_build_object('ok', false, 'reden', 'OFF limiet (429)', 'gevonden', v_gevonden, 'leeg', v_leeg);
    end if;
    v_url := null;
    if v_resp.status = 200 then
      begin
        v_url := coalesce(v_resp.content::jsonb #>> '{product,image_front_url}', v_resp.content::jsonb #>> '{product,image_url}');
      exception when others then v_url := null;
      end;
    elsif v_resp.status <> 404 then
      v_fout := v_fout + 1;
      continue;
    end if;
    if v_url like 'https://%' then
      update ai_ingredients set image_url = v_url, image_url_checked_at = now() where id = r.id;
      v_gevonden := v_gevonden + 1;
    else
      update ai_ingredients set image_url_checked_at = now() where id = r.id;
      v_leeg := v_leeg + 1;
    end if;
  end loop;
  return jsonb_build_object('ok', true, 'gevonden', v_gevonden, 'leeg', v_leeg, 'fout', v_fout);
end $$;

revoke all on function public.productfotos_ophalen(int) from public, anon, authenticated;
select cron.schedule('productfotos-ophalen', '* * * * *', $$select public.productfotos_ophalen(8)$$);
