-- src/modules/meal-plan/components/food-log/zoeken-v2.sql
--
-- Zoeken verbeterd na de eerste zoek_log-data (25-27 okt 2026, 28 zoekacties):
--
-- 1. Eigen product eerst. De eigen-historie-bonus gold per kernwoord, dus
--    "Ei (heel)" en "Ei (Lidl)" kregen hem allebei en Erwin moest elke keer
--    plek 2 tikken ("Ei (Lidl)", "Kwark (Milbona)" op 3). Nu krijgt het exacte
--    product dat je eerder logde (consumed_meals.meal_id = ingredient-id) +30.
-- 2. Verwisselde letters. "baluwe" gaf 0 resultaten (pg_trgm vangt geen
--    omwisseling). Bij 0 resultaten proberen we elke omwisseling van twee
--    naast elkaar staande letters ("blauwe").
-- 3. Gamba's: alleen merkproducten; basisproduct rauw erbij.
--
-- Achterwaarts compatibel: zoek_ingredienten houdt naam, parameters en
-- uitvoer. De oude body heet nu zoek_ingredienten_kern.
-- Terugdraaien: zoek_ingredienten weer vullen met de body van _kern zonder
-- de pop_id-regels (zie slim-zoeken.sql).

create or replace function public.zoek_ingredienten_kern(p_q text, p_client uuid default null, p_limit integer default 30)
 returns table(id uuid, name text, name_en text, calories_per_100g numeric, protein_per_100g numeric, carbs_per_100g numeric, fat_per_100g numeric, default_portion_gram numeric, category text, image_url text, brand text, log_count integer, barcode text, source text, score numeric, bereiding text, eenheid text, gram_per_eenheid numeric, labels jsonb)
 language plpgsql
 set search_path to 'public'
as $function$
declare
  q text := public.zoek_norm(regexp_replace(coalesce(p_q, ''), '[''’`]', '', 'g'));
  s text;
  w1 text;
begin
  -- Spreektaal en tikfouten die pg_trgm niet vangt ("bakkie", "expresso").
  q := coalesce((select public.zoek_norm(z.naar) from public.zoek_synoniemen z where public.zoek_norm(z.van) = q limit 1), q);
  if length(q) < 2 then return; end if;
  s := public.zoek_stam(q);
  w1 := split_part(s, ' ', 1);
  perform set_config('pg_trgm.similarity_threshold', '0.3', true);
  perform set_config('pg_trgm.word_similarity_threshold', '0.4', true);
  return query
  with kand as (
    select i.id from ai_ingredients i
    where i.zoek_naam ~ ('(^| )' || w1)
       or (length(w1) >= 3 and i.zoek_naam ~ (w1 || '(en|s|n)?( |$)'))
    union
    select i.id from ai_ingredients i where length(q) >= 5 and i.zoek_naam % q
    union
    select i.id from ai_ingredients i where length(q) >= 5 and i.zoek_naam % replace(q, ' ', '')
    union
    select i.id from ai_ingredients i where length(q) >= 5 and q <% i.zoek_naam
  ),
  rij as materialized (
    select i.*, case when public.zoek_score(i.zoek_kern, q) = 100 and i.barcode is not null then 88
                     when i.bereiding in ('gekookt', 'gebakken') and public.zoek_score(regexp_replace(i.zoek_kern, ' (gekookt|gebakken)$', ''), q) = 100 then 96
                     else public.zoek_score(i.zoek_kern, q) end as basis
    from ai_ingredients i join kand on kand.id = i.id
    where coalesce(i.calories_per_100g, 0) <= 900
      and coalesce(i.protein_per_100g, 0) + coalesce(i.carbs_per_100g, 0) + coalesce(i.fat_per_100g, 0) <= 105
  ),
  pop as (
    select c.zoek_kern as k, count(*) as n, count(*) filter (where c.client_id = p_client) as eigen
    from consumed_meals c
    where c.consumed_at > now() - interval '180 days'
      and c.zoek_kern in (select distinct rij.zoek_kern from rij where rij.basis >= 35)
    group by 1
  ),
  -- Precies dit product eerder gelogd door deze klant.
  pop_id as (
    select c.meal_id as mid, count(*) as n
    from consumed_meals c
    where p_client is not null and c.client_id = p_client
      and c.consumed_at > now() - interval '180 days'
      and c.meal_id in (select rij.id from rij where rij.basis >= 35)
    group by 1
  ),
  gescoord as (
    select rij.*,
      (rij.basis
      + least(1, rij.basis / 90.0) * (
          case when rij.barcode is null then 15 else 0 end
        + case when rij.source = 'coach' then 5 else 0 end
        + least(12, ln(1 + coalesce(pop.n, 0) + coalesce(rij.log_count, 0))::numeric * 4)
        + case when coalesce(pop.eigen, 0) > 0 then 20 + least(10, pop.eigen * 2) else 0 end
        + case when coalesce(pop_id.n, 0) > 0 then 30 else 0 end
        - least(12, length(rij.zoek_kern) / 4.0)
        - case when rij.barcode is not null or rij.brand is not null or rij.name ~ '\(' then 6 else 0 end))::numeric as sc
    from rij left join pop on pop.k = rij.zoek_kern
             left join pop_id on pop_id.mid = rij.id
    where rij.basis >= 35
  ),
  uniek as (
    select distinct on (g.zoek_kern, coalesce(g.bereiding, ''), case when g.barcode is null or g.name !~ '\(' then -1 else round(coalesce(g.calories_per_100g, 0)) end) g.*
    from gescoord g
    order by g.zoek_kern, coalesce(g.bereiding, ''), case when g.barcode is null or g.name !~ '\(' then -1 else round(coalesce(g.calories_per_100g, 0)) end,
             (g.barcode is null) desc, g.sc desc
  ),
  gespreid as (
    select u.*, u.sc - 35 * (row_number() over (partition by u.zoek_kern, coalesce(u.bereiding, '') order by u.sc desc) - 1) as eind
    from uniek u
  )
  select u.id, u.name, u.name_en, u.calories_per_100g, u.protein_per_100g,
         u.carbs_per_100g, u.fat_per_100g, u.default_portion_gram::numeric, u.category,
         u.image_url, u.brand, u.log_count, u.barcode, u.source, round(u.eind, 1), u.bereiding, u.eenheid, u.gram_per_eenheid, u.labels
  from gespreid u
  where u.sc >= 35
  order by u.eind desc
  limit p_limit;
end $function$;

create or replace function public.zoek_ingredienten(p_q text, p_client uuid default null, p_limit integer default 30)
 returns table(id uuid, name text, name_en text, calories_per_100g numeric, protein_per_100g numeric, carbs_per_100g numeric, fat_per_100g numeric, default_portion_gram numeric, category text, image_url text, brand text, log_count integer, barcode text, source text, score numeric, bereiding text, eenheid text, gram_per_eenheid numeric, labels jsonb)
 language plpgsql
 set search_path to 'public'
as $function$
declare
  q text := lower(trim(coalesce(p_q, '')));
  n int;
  v text;
begin
  return query select * from public.zoek_ingredienten_kern(p_q, p_client, p_limit);
  get diagnostics n = row_count;
  -- Niets gevonden: misschien twee letters omgewisseld ("baluwe" -> "blauwe").
  if n > 0 or length(q) < 4 or length(q) > 20 or q ~ ' ' then return; end if;
  for i in 1 .. length(q) - 1 loop
    v := substr(q, 1, i - 1) || substr(q, i + 1, 1) || substr(q, i, 1) || substr(q, i + 2);
    continue when v = q;
    return query select * from public.zoek_ingredienten_kern(v, p_client, p_limit);
    get diagnostics n = row_count;
    if n > 0 then return; end if;
  end loop;
end $function$;

-- Gamba's rauw (USDA FoodData Central, garnaal rauw: 85 kcal, 20,1 g eiwit,
-- 0 g koolhydraten, 0,5 g vet per 100 g).
insert into public.ai_ingredients (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, bereiding, category, source)
select 'Gamba''s (rauw)', 85, 20.1, 0, 0.5, 'rauw', 'vis', 'myarc'
where not exists (select 1 from public.ai_ingredients where name = 'Gamba''s (rauw)');
