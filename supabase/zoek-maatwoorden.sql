-- Zoeken met een maatwoord ervoor (18 nov 2026, app_issue cbc27f80).
--
-- "zakje snoep" gaf alleen "Zakje met blauwe bessen": de zoeker bouwt zijn
-- kandidaten op het EERSTE woord, dus snoep kwam nooit in beeld. Zelfde bij
-- "bakje kwark", "glas melk", "handje noten" (niets) en "stuk taart" (garnalen
-- met staart).
--
-- Nu: staat er een maatwoord in (zakje, bakje, glas, stuk, ...), dan zoeken we
-- ook zonder dat woord. Vond de hele zoekterm al genoeg (5 of meer, bv. "plak
-- kaas"), dan blijven die bovenaan en komt de rest erachter; anders staat de
-- zoekterm zonder maatwoord bovenaan. Vinden meer woorden samen niets, dan
-- zoeken we op het langste woord.
--
-- Zelfde naam, zelfde argumenten, zelfde kolommen: oude app-versies krijgen
-- dit ook. Kan iets meer rijen teruggeven dan p_limit.
create or replace function public.zoek_ingredienten(p_q text, p_client uuid default null, p_limit integer default 30)
returns table(id uuid, name text, name_en text, calories_per_100g numeric, protein_per_100g numeric, carbs_per_100g numeric, fat_per_100g numeric, default_portion_gram numeric, category text, image_url text, brand text, log_count integer, barcode text, source text, score numeric, bereiding text, eenheid text, gram_per_eenheid numeric, labels jsonb)
language plpgsql
set search_path to 'public'
as $function$
declare
  q text := lower(trim(coalesce(p_q, '')));
  n int := 0;
  v text;
  kaal text;
  lang text;
  heel uuid[];
  zonder uuid[];
  maat constant text := '\m(zakje|zak|bakje|bak|pakje|pak|stukje|stuk|stuks|portie|handje|handvol|beetje|glaasje|glas|kopje|kop|bordje|bord|schaaltje|schaal|blikje|blik|flesje|fles|plakje|plak|sneetje|snee|eetlepel|theelepel|lepel|schepje|schep|een|paar|wat|kleine|klein|grote|groot|halve|half|hele)\M';
begin
  if q ~ ' ' then
    kaal := btrim(regexp_replace(regexp_replace(q, maat, ' ', 'g'), '\s+', ' ', 'g'));
    if kaal <> q and length(kaal) >= 2 then
      heel := array(select k.id from public.zoek_ingredienten_kern(p_q, p_client, p_limit) k);
      if cardinality(heel) >= 5 then
        return query select * from public.zoek_ingredienten_kern(p_q, p_client, p_limit);
        return query select k.* from public.zoek_ingredienten_kern(kaal, p_client, p_limit) k where k.id <> all (heel);
        return;
      end if;
      zonder := array(select k.id from public.zoek_ingredienten_kern(kaal, p_client, p_limit) k);
      if cardinality(zonder) > 0 then
        return query select * from public.zoek_ingredienten_kern(kaal, p_client, p_limit);
        if cardinality(heel) > 0 then
          return query select k.* from public.zoek_ingredienten_kern(p_q, p_client, p_limit) k where k.id <> all (zonder);
        end if;
        return;
      end if;
    end if;
  end if;

  if heel is null or cardinality(heel) > 0 then
    return query select * from public.zoek_ingredienten_kern(p_q, p_client, p_limit);
    get diagnostics n = row_count;
  end if;
  if n > 0 then return; end if;

  -- Meer woorden en niets gevonden: het langste woord alleen.
  if q ~ ' ' then
    select w into lang from unnest(string_to_array(coalesce(nullif(kaal, ''), q), ' ')) w
      where length(w) >= 3 order by length(w) desc limit 1;
    if lang is not null then
      return query select * from public.zoek_ingredienten_kern(lang, p_client, p_limit);
    end if;
    return;
  end if;

  -- Eén woord en niets gevonden: twee letters omgedraaid proberen.
  if length(q) < 4 or length(q) > 20 then return; end if;
  for i in 1 .. length(q) - 1 loop
    v := substr(q, 1, i - 1) || substr(q, i + 1, 1) || substr(q, i, 1) || substr(q, i + 2);
    continue when v = q;
    return query select * from public.zoek_ingredienten_kern(v, p_client, p_limit);
    get diagnostics n = row_count;
    if n > 0 then return; end if;
  end loop;
end $function$;
