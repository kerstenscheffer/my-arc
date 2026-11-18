-- Zoeken: alle woorden tellen mee, tikfouten vooraan, rommel verbergen
-- (18 nov 2026, vervolg op zoek-maatwoorden.sql; uit het zoek_log gemeten).
--
-- 1. zoek_verborgen: producten die niet in de tekstzoeker horen. Gevuld met
--    verkeerd gelezen verpakkingen uit de OpenFoodFacts-import van 25 mrt 2026
--    ("NUTRI-SCORE BEDE 222 Bellasan..."), alleen als ze nooit gelogd zijn.
--    De rij zelf blijft staan: scannen op barcode vindt hem nog.
--    Terugzetten = de rij uit zoek_verborgen halen.
-- 2. zoek_ingredienten_woorden: producten waar twee of meer zoekwoorden in
--    zitten, in elke volgorde, ook met een tikfout in een woord.
-- 3. zoek_ingredienten: zelfde naam, argumenten en kolommen (oude apps en de
--    plan-bouwer blijven werken).
--    - één woord, niets gevonden: woorden die één of twee letters afwijken
--      ("keark" → kwark, "zppel" → appel).
--    - meer woorden: staat er bovenaan niets waar alle woorden in zitten, dan
--      eerst de producten met de meeste woorden; is dat er niet, dan het
--      laatste woord dat zelf een basisproduct is ("petite france kwark" →
--      kwark). De oude uitkomst blijft erachter staan.

create extension if not exists fuzzystrmatch with schema extensions;

create table if not exists public.zoek_verborgen (
  id uuid primary key,
  reden text,
  created_at timestamptz not null default now()
);
alter table public.zoek_verborgen enable row level security;
drop policy if exists zoek_verborgen_lezen on public.zoek_verborgen;
create policy zoek_verborgen_lezen on public.zoek_verborgen for select using (true);
grant select on public.zoek_verborgen to anon, authenticated;

insert into public.zoek_verborgen (id, reden)
select i.id, 'verkeerd gelezen verpakking (OpenFoodFacts-import)'
from public.ai_ingredients i
where i.source = 'openfoodfacts' and coalesce(i.log_count, 0) = 0 and (
  i.name ~* 'nutri.?score|[ri]-score'
  or i.name ~ '^(per|water|voordeel|bron)\M'
  or (i.name !~ '\(' and i.name ~ '^(met|en|van|voor|het|de|een|is|zonder|bevat|kan|wat)\M')
  or (length(i.name) >= 50 and i.name !~ '\(' and i.name ~ '(\m[A-Z]{4,}\M.*){4,}'))
on conflict (id) do nothing;

-- De kern krijgt alleen het filter erbij; de rest van de functie blijft zoals hij is.
do $do$
declare
  d text;
  oud constant text := 'where coalesce(i.calories_per_100g, 0) <= 900';
begin
  select pg_get_functiondef(p.oid) into d from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'zoek_ingredienten_kern';
  if position('zoek_verborgen' in d) > 0 then return; end if;
  if (length(d) - length(replace(d, oud, ''))) / length(oud) <> 1 then raise exception 'kern: filterplek niet precies één keer gevonden'; end if;
  execute replace(d, oud, 'where not exists (select 1 from public.zoek_verborgen zv where zv.id = i.id) and coalesce(i.calories_per_100g, 0) <= 900');
end $do$;

create or replace function public.zoek_ingredienten_woorden(p_woorden text[], p_limit integer default 15)
returns uuid[]
language plpgsql
set search_path to 'public'
as $function$
declare
  r uuid[];
begin
  perform set_config('pg_trgm.word_similarity_threshold', '0.4', true);
  select array_agg(t.id order by t.rn) into r from (
    select g.id, row_number() over (order by g.n desc, g.tot desc, g.basis desc, g.pop desc, g.len) as rn
    from (
      select c.id, count(distinct w.s) as n, sum(c.m) as tot, bool_or(c.barcode is null) as basis,
             max(coalesce(c.log_count, 0)) as pop, min(length(c.zoek_kern)) as len
      from unnest(p_woorden) as w(s)
      cross join lateral (
        select i.id, i.barcode, i.log_count, i.zoek_kern,
               greatest(case when i.zoek_naam ~ ('(^| )' || w.s) then 1.0
                             when position(w.s in i.zoek_naam) > 0 then 0.85 else 0 end,
                        word_similarity(w.s, i.zoek_naam)) as m
        from ai_ingredients i
        where (i.zoek_naam like '%' || w.s || '%' or w.s <% i.zoek_naam)
          and not exists (select 1 from zoek_verborgen zv where zv.id = i.id)
          and coalesce(i.calories_per_100g, 0) <= 900
          and coalesce(i.protein_per_100g, 0) + coalesce(i.carbs_per_100g, 0) + coalesce(i.fat_per_100g, 0) <= 105
      ) c
      group by c.id
      having count(distinct w.s) >= 2
    ) g
    order by rn
    limit p_limit
  ) t;
  return coalesce(r, '{}'::uuid[]);
end $function$;

create or replace function public.zoek_ingredienten(p_q text, p_client uuid default null, p_limit integer default 30)
returns table(id uuid, name text, name_en text, calories_per_100g numeric, protein_per_100g numeric, carbs_per_100g numeric, fat_per_100g numeric, default_portion_gram numeric, category text, image_url text, brand text, log_count integer, barcode text, source text, score numeric, bereiding text, eenheid text, gram_per_eenheid numeric, labels jsonb)
language plpgsql
set search_path to 'public'
as $function$
#variable_conflict use_column
declare
  q text := lower(trim(coalesce(p_q, '')));
  qn text := public.zoek_norm(regexp_replace(coalesce(p_q, ''), '[''’`]', '', 'g'));
  n int := 0;
  v text;
  kaal text;
  hoofd text;
  w text;
  basis uuid[];
  extra uuid[];
  multi uuid[];
  heel text[];
  stam text[];
  anders boolean := false;
  maat constant text := '\m(zakje|zak|bakje|bak|pakje|pak|stukje|stuk|stuks|portie|handje|handvol|beetje|glaasje|glas|kopje|kop|bordje|bord|schaaltje|schaal|blikje|blik|flesje|fles|plakje|plak|sneetje|snee|eetlepel|theelepel|lepel|schepje|schep|een|paar|wat|kleine|klein|grote|groot|halve|half|hele)\M';
  ruis constant text := '\m(jumbo|ah|albert heijn|lidl|aldi|plus|dirk|vomar|hoogvliet|picnic|spar|coop|poiesz|ekoplaza|deen|tesco|met|en|van|de|het|in|op|zonder|voor)\M';
begin
  -- ── Eén woord ──────────────────────────────────────────────────────────
  if qn !~ ' ' then
    return query select * from public.zoek_ingredienten_kern(p_q, p_client, p_limit);
    get diagnostics n = row_count;
    if n > 0 or length(qn) < 4 or length(qn) > 20 then return; end if;
    -- Twee letters omgedraaid.
    for i in 1 .. length(q) - 1 loop
      v := substr(q, 1, i - 1) || substr(q, i + 1, 1) || substr(q, i, 1) || substr(q, i + 2);
      continue when v = q;
      return query select * from public.zoek_ingredienten_kern(v, p_client, p_limit);
      get diagnostics n = row_count;
      if n > 0 then return; end if;
    end loop;
    -- Eén of twee letters fout, waar dan ook in het woord.
    perform set_config('pg_trgm.word_similarity_threshold', '0.3', true);
    return query
    select t.id, t.name, t.name_en, t.calories_per_100g, t.protein_per_100g, t.carbs_per_100g, t.fat_per_100g,
           t.default_portion_gram::numeric, t.category, t.image_url, t.brand, t.log_count, t.barcode, t.source,
           (60 - t.d * 10)::numeric, t.bereiding, t.eenheid, t.gram_per_eenheid, t.labels
    from (
      select i.*, (select min(extensions.levenshtein(x, qn)) from unnest(string_to_array(i.zoek_kern, ' ')) x
                   where abs(length(x) - length(qn)) <= 2) as d
      from ai_ingredients i
      where qn <% i.zoek_naam
        and not exists (select 1 from zoek_verborgen zv where zv.id = i.id)
        and coalesce(i.calories_per_100g, 0) <= 900
        and coalesce(i.protein_per_100g, 0) + coalesce(i.carbs_per_100g, 0) + coalesce(i.fat_per_100g, 0) <= 105
    ) t
    where t.d <= case when length(qn) <= 5 then 1 else 2 end
    order by t.d, (t.barcode is null) desc, coalesce(t.log_count, 0) desc, length(t.zoek_kern)
    limit p_limit;
    return;
  end if;

  -- ── Meer woorden ───────────────────────────────────────────────────────
  basis := array(select k.id from public.zoek_ingredienten_kern(p_q, p_client, p_limit) k);

  -- Maatwoord ervoor ("zakje snoep"): ook zonder dat woord zoeken.
  kaal := btrim(regexp_replace(regexp_replace(qn, maat, ' ', 'g'), '\s+', ' ', 'g'));
  if kaal <> qn and length(kaal) >= 2 then
    extra := array(select k.id from public.zoek_ingredienten_kern(kaal, p_client, p_limit) k);
    if cardinality(basis) >= 5 then basis := basis || extra; else basis := extra || basis; end if;
    anders := true;
  else
    kaal := qn;
  end if;

  -- De woorden die ertoe doen, in volgorde. Bij "x met y" is x de hoofdzaak.
  hoofd := btrim(regexp_replace(kaal, '\m(met|in|zonder|op)\M.*$', ''));
  if length(hoofd) < 3 then hoofd := kaal; end if;
  select coalesce(array_agg(u.x order by u.o), '{}'), coalesce(array_agg(public.zoek_stam(u.x) order by u.o), '{}')
    into heel, stam
  from unnest(string_to_array(btrim(regexp_replace(kaal, ruis, ' ', 'g')), ' ')) with ordinality as u(x, o)
  where length(u.x) >= 3;

  if cardinality(stam) >= 2 and not exists (
       select 1 from ai_ingredients i
       where i.id = any (basis[1:8])
         and not exists (select 1 from unnest(stam) s where position(s in i.zoek_naam) = 0)) then
    multi := public.zoek_ingredienten_woorden(stam, 15);
    if cardinality(multi) = 0 then
      for idx in reverse cardinality(heel) .. 1 loop
        w := heel[idx];
        continue when position(w in hoofd) = 0;
        if exists (select 1 from ai_ingredients i where i.barcode is null
                   and i.zoek_kern in (w, stam[idx], stam[idx] || 'en', stam[idx] || 's', stam[idx] || 'n')) then
          multi := array(select k.id from public.zoek_ingredienten_kern(w, p_client, p_limit) k);
          exit;
        end if;
      end loop;
    end if;
    if cardinality(multi) > 0 then basis := multi || basis; anders := true; end if;
  end if;

  -- Nog steeds niets: het langste woord alleen.
  if cardinality(basis) = 0 then
    select x into w from unnest(heel) x order by length(x) desc limit 1;
    if w is not null then
      basis := array(select k.id from public.zoek_ingredienten_kern(w, p_client, p_limit) k);
      anders := true;
    end if;
  end if;

  if not anders then
    return query select * from public.zoek_ingredienten_kern(p_q, p_client, p_limit);
    return;
  end if;

  return query
  select i.id, i.name, i.name_en, i.calories_per_100g, i.protein_per_100g, i.carbs_per_100g, i.fat_per_100g,
         i.default_portion_gram::numeric, i.category, i.image_url, i.brand, i.log_count, i.barcode, i.source,
         (100 - v2.o)::numeric, i.bereiding, i.eenheid, i.gram_per_eenheid, i.labels
  from (select b.bid, min(b.o) as o from unnest(basis) with ordinality as b(bid, o) group by b.bid) v2
  join ai_ingredients i on i.id = v2.bid
  order by v2.o
  limit p_limit;
end $function$;

-- Andere namen voor wat er al in staat.
insert into public.zoek_synoniemen (van, naar)
select x.van, x.naar from (values
  ('snert', 'erwtensoep'), ('soep snert', 'erwtensoep'), ('erte soep', 'erwtensoep'), ('erwten soep', 'erwtensoep'),
  ('kaki', 'persimmon'), ('kakifruit', 'persimmon'), ('sharonfruit', 'persimmon'), ('sharon fruit', 'persimmon'), ('sharon', 'persimmon'),
  ('scrambled', 'roerei'), ('scrambled eggs', 'roerei'), ('scrambled egg', 'roerei'),
  ('doyenne', 'peer'), ('doyenne peer', 'peer'), ('doyennepeer', 'peer'),
  ('tafelzuren', 'augurken'), ('mac donald', 'mcdonalds'), ('mac donalds', 'mcdonalds')
) as x(van, naar)
where not exists (select 1 from public.zoek_synoniemen z where public.zoek_norm(z.van) = public.zoek_norm(x.van));
