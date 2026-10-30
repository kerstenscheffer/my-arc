-- src/modules/meal-plan/components/food-log/zoeken-winkel.sql
--
-- Feedback Rosh (30 okt 2026): "ham-kaascroissant Jumbo niet te vinden",
-- "kaasbroodje toont broodje kaas", en geen gewicht per supermarktproduct.
--
-- 1. Winkel in de zoekterm ("croissant jumbo", "ah kwark") is een filter op
--    merk/winkel, geen zoekwoord: eruit halen, en producten van die winkel
--    +45. Zonder treffer valt het terug op de gewone volgorde.
-- 2. Stuk-/portiegewicht voor merkproducten uit het etiket (serving_description
--    "1 portion (57 g)", quantity "4 x 70 g"): stuk_gewicht + stuk_eenheid,
--    backfill van 16.709 rijen (backup_stukgewicht_20261030), trigger voor
--    nieuwe scans. eenheid-check kreeg 'portie' erbij (alleen verbreed).
-- 3. Basisproduct "Kaasbroodje (bladerdeeg)": de bakkers-/restaurantvariant.

create or replace function public.stuk_gewicht(p_serving text, p_quantity text)
returns numeric language sql immutable as $$
  select case
    when g between 5 and 400 and g <> 100 then g
    when q between 5 and 400 then q
  end
  from (select
    nullif(replace(substring(coalesce(p_serving,'') from '(\d+(?:[.,]\d+)?)\s*(?:g|gr|gram|ml)\M'), ',', '.'), '')::numeric as g,
    nullif(replace(substring(coalesce(p_quantity,'') from '\d+\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*(?:g|gr|ml)\M'), ',', '.'), '')::numeric as q
  ) t
$$;

create or replace function public.stuk_eenheid(p_naam text)
returns text language sql immutable as $$
  select case when lower(coalesce(p_naam,'')) ~ '(reepjes|ontbijtkoek|kruidkoek|koeken\M)' then 'portie'
    when lower(coalesce(p_naam,'')) ~ '(broodj|croissant|koek|reep|repen|bolletj|krentenbol|wrap|pita|muffin|donut|bagel|wafel|saucijs|worstenbr|pistolet|kaiser|beschuit|rijstwafel|bonbon|bar\M|ijsje|tompouce|gevulde)' then 'stuk'
    else 'portie' end
$$;

-- (backfill + trigger + constraint: zie kop; uitgevoerd 30 okt 2026)

create or replace function public.zoek_ingredienten_kern(p_q text, p_client uuid default null, p_limit integer default 30)
 returns table(id uuid, name text, name_en text, calories_per_100g numeric, protein_per_100g numeric, carbs_per_100g numeric, fat_per_100g numeric, default_portion_gram numeric, category text, image_url text, brand text, log_count integer, barcode text, source text, score numeric, bereiding text, eenheid text, gram_per_eenheid numeric, labels jsonb)
 language plpgsql
 set search_path to 'public'
as $function$
declare
  q text := public.zoek_norm(regexp_replace(coalesce(p_q, ''), '[''’`]', '', 'g'));
  s text;
  w1 text;
  winkel text;
  winkel_re text;
begin
  q := coalesce((select public.zoek_norm(z.naar) from public.zoek_synoniemen z where public.zoek_norm(z.van) = q limit 1), q);
  winkel := substring(q from '\m(jumbo|ah|albert heijn|lidl|aldi|plus|dirk|vomar|hoogvliet|picnic|spar|coop|poiesz|ekoplaza|deen|tesco)\M');
  if winkel is not null and length(trim(regexp_replace(q, '\m' || winkel || '\M', ''))) >= 2 then
    q := trim(regexp_replace(regexp_replace(q, '\m' || winkel || '\M', ''), '\s+', ' ', 'g'));
    winkel_re := case when winkel in ('ah', 'albert heijn') then '\m(ah|albert heijn)\M' else '\m' || winkel || '\M' end;
  else
    winkel := null;
  end if;
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
                     else public.zoek_score(i.zoek_kern, q) end as basis,
      (winkel_re is not null and lower(coalesce(i.brand, '') || ' ' || coalesce(i.store_name, '') || ' ' || i.name) ~ winkel_re) as van_winkel
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
  pop_id as (
    select c.meal_id as mid, count(*) as n, max(c.consumed_at) as laatst
    from consumed_meals c
    where p_client is not null and c.client_id = p_client
      and c.consumed_at > now() - interval '180 days'
      and c.meal_id in (select rij.id from rij where rij.basis >= 35)
    group by 1
  ),
  gescoord as (
    select rij.*,
      (rij.basis
      + case when rij.van_winkel then 45 else 0 end
      + least(1, rij.basis / 90.0) * (
          case when rij.barcode is null then 15 else 0 end
        + case when rij.source = 'coach' then 5 else 0 end
        + least(12, ln(1 + coalesce(pop.n, 0) + coalesce(rij.log_count, 0))::numeric * 4)
        + case when coalesce(pop.eigen, 0) > 0 then 20 + least(10, pop.eigen * 2) else 0 end
        - least(12, length(rij.zoek_kern) / 4.0)
        - case when rij.barcode is not null or rij.brand is not null or rij.name ~ '\(' then 6 else 0 end))::numeric as sc,
      pop_id.n as eigen_n, pop_id.laatst as eigen_laatst
    from rij left join pop on pop.k = rij.zoek_kern
             left join pop_id on pop_id.mid = rij.id
    where rij.basis >= 35
  ),
  uniek as (
    select distinct on (g.zoek_kern, coalesce(g.bereiding, ''), case when g.barcode is null or g.name !~ '\(' then -1 else round(coalesce(g.calories_per_100g, 0)) end) g.*
    from gescoord g
    order by g.zoek_kern, coalesce(g.bereiding, ''), case when g.barcode is null or g.name !~ '\(' then -1 else round(coalesce(g.calories_per_100g, 0)) end,
             g.van_winkel desc, (g.barcode is null) desc, g.sc desc
  ),
  gespreid as (
    select u.*, u.sc - 35 * (row_number() over (partition by u.zoek_kern, coalesce(u.bereiding, ''), u.van_winkel order by u.sc desc) - 1) as eind,
      row_number() over (partition by u.zoek_kern order by u.eigen_n desc nulls last, u.eigen_laatst desc nulls last) as eigen_rang
    from uniek u
  ),
  eigen_eerst as (
    select g.*, case when g.eigen_n > 0 and g.eigen_rang = 1
                     then greatest(g.eind, max(g.eind) over (partition by g.zoek_kern) + 1)
                     else g.eind end as eind2
    from gespreid g
  )
  select u.id, u.name, u.name_en, u.calories_per_100g, u.protein_per_100g,
         u.carbs_per_100g, u.fat_per_100g, u.default_portion_gram::numeric, u.category,
         u.image_url, u.brand, u.log_count, u.barcode, u.source, round(u.eind2, 1), u.bereiding, u.eenheid, u.gram_per_eenheid, u.labels
  from eigen_eerst u
  where u.sc >= 35
  order by u.eind2 desc
  limit p_limit;
end $function$;

-- Kaasbroodje van de bakker/lunchroom: bladerdeeg met kaas (NEVO-orde:
-- ~330 kcal, 9 g eiwit, 27 g kh, 21 g vet per 100 g; één stuk ~90 g).
insert into public.ai_ingredients (name, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, eenheid, gram_per_eenheid, default_portion_gram, min_portion_gram, max_portion_gram, unit_type, source)
select 'Kaasbroodje (bladerdeeg)', 'carbs', 330, 9, 27, 21, 'stuk', 90, 90, 30, 300, 'gram', 'coach'
where not exists (select 1 from public.ai_ingredients where name = 'Kaasbroodje (bladerdeeg)');
