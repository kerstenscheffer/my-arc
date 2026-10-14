-- Slim zoeken in voeding (live sinds 14 okt 2026). Gebruikt door SearchTab.jsx
-- via rpc('zoek_ingredienten') en rpc('zoek_maaltijden').
--
-- Wat het doet:
--   - Tikfouten: pg_trgm ("sinasappel", "sinus appel" -> Sinaasappel), pas vanaf 5 letters
--   - Meervoud: "aardbei" vindt "Aardbeien" als exacte treffer (zoek_stam)
--   - Samenstellingen: het kernwoord staat in het Nederlands achteraan, dus
--     "sap" -> sinaasappelsap, appelsap (score 70), "aardbei" -> aardbeienjam laag (45)
--   - Volgorde: exact (100) > samenstelling (70) > eerste woord (65) > los woord (55)
--     > begin van woord (45); daarna bonussen: basisproduct (geen barcode) +15,
--     coach-ingrediënt +5, populair (consumed_meals laatste 180 dagen) tot +12,
--     eigen historie van de klant +20..30, korte naam en geen merk licht omhoog
--   - Bonussen tellen naar rato van de basisscore, zodat een losse tikfout-gelijkenis
--     niet via populariteit boven een echte treffer komt
--   - Dubbelingen eruit: zelfde naam zonder merk + zelfde kcal toont één keer
--
-- ai_ingredients.zoek_naam / zoek_kern en consumed_meals.zoek_kern zijn
-- opgeslagen gegenereerde kolommen (snelheid: 20-400 ms i.p.v. 1,5-8 s).

create or replace function public.zoek_norm(t text) returns text
language sql immutable parallel safe as $$
  select btrim(regexp_replace(regexp_replace(
    translate(lower(coalesce(t, '')), 'áàâäãåéèêëíìîïóòôöõúùûüçñ', 'aaaaaaeeeeiiiiooooouuuucn'),
    '[^a-z0-9 ]', ' ', 'g'), '\s+', ' ', 'g'))
$$;

-- Naam zonder merk tussen haakjes aan het eind: "Sinaasappelsap (Jumbo)" -> "sinaasappelsap".
create or replace function public.zoek_kern(t text) returns text
language sql immutable parallel safe as $$
  select public.zoek_norm(regexp_replace(coalesce(t, ''), '\s*\([^)]*\)\s*$', ''))
$$;

create or replace function public.zoek_stam(q text) returns text
language sql immutable parallel safe as $$
  select case
    when length(q) >= 5 and q ~ 'en$' then left(q, -2)
    when length(q) >= 4 and q ~ '[^s]s$' then left(q, -1)
    else q end
$$;

alter table public.ai_ingredients add column if not exists zoek_naam text generated always as (public.zoek_norm(name)) stored;
alter table public.ai_ingredients add column if not exists zoek_kern text generated always as (public.zoek_kern(name)) stored;
alter table public.consumed_meals add column if not exists zoek_kern text generated always as (public.zoek_kern(meal_name)) stored;
create index if not exists ai_ingredients_zoek_naam_trgm on public.ai_ingredients using gin (zoek_naam gin_trgm_ops);
create index if not exists consumed_meals_zoek_kern_idx on public.consumed_meals (zoek_kern, consumed_at);
create index if not exists ai_meals_zoek_norm_trgm on public.ai_meals using gin (public.zoek_norm(name) gin_trgm_ops);

-- Hoe goed past naam-kern k bij zoekterm q? Hoger is beter.
create or replace function public.zoek_score(k text, q text) returns numeric
language plpgsql immutable parallel safe as $$
declare
  s text := public.zoek_stam(q);
  qns text := replace(q, ' ', '');
  struct numeric := 0;
  fuzzy numeric;
  tok numeric;
begin
  if q like '% %' then
    struct := case
      when k = q or k = qns then 100
      when k like q || '%' then 80
      when position(q in k) > 0 then 70
      when not exists (select 1 from unnest(string_to_array(q, ' ')) w where position(w in k) = 0) then 60
      else 0 end;
  else
    struct := case
      when k = any (array[q, s, s || 'en', s || 's', s || 'n', q || 'en', q || 's']) then 100
      -- Schijn-samenstellingen: pindakaas is geen kaas, leverkaas ook niet.
      when k ~ '(^| )(pindakaas|leverkaas|hagelslag|boterkoek|kokosmelk)' and k !~ ('(^| )' || s || '(en|s|n)?( |$)') and k !~ ('^' || s) then 30
      when length(s) >= 3 and k ~ ('[a-z]{2,}' || s || '(en|s|n)?( |$)') then 70
      when k ~ ('^' || s || '(en|s|n)? ') then 65
      when k ~ ('(^| )' || s || '(en|s|n)?( |$)') then 55
      when k ~ ('(^| )' || s) then 45
      when position(s in k) > 0 then 25
      else 0 end;
  end if;
  if struct >= 45 then return struct; end if;
  -- Tikfout: vergelijk met de hele naam en met elk woord apart, nooit met
  -- een kort stukje (anders scoort "appel" hoog op "sinasappel").
  select coalesce(max(similarity(w, qns)), 0) into tok
  from unnest(string_to_array(k, ' ')) w where length(w) >= 3;
  -- Meer woorden ("sinus appel"): als één woord vergelijken, anders wint
  -- elke naam die maar één van de woorden bevat.
  fuzzy := 10 + 70 * greatest(
    case when q like '% %' then 0 else similarity(k, q) end,
    similarity(replace(k, ' ', ''), qns), tok * 0.95);
  return greatest(struct, fuzzy);
end $$;

create or replace function public.zoek_ingredienten(p_q text, p_client uuid default null, p_limit int default 30)
returns table (
  id uuid, name text, name_en text, calories_per_100g numeric, protein_per_100g numeric,
  carbs_per_100g numeric, fat_per_100g numeric, default_portion_gram numeric, category text,
  image_url text, brand text, log_count int, barcode text, source text, score numeric
)
language plpgsql volatile security invoker set search_path = public as $$
declare
  q text := public.zoek_norm(p_q);
  s text;
  w1 text;
begin
  if length(q) < 2 then return; end if;
  s := public.zoek_stam(q);
  w1 := split_part(s, ' ', 1);
  perform set_config('pg_trgm.similarity_threshold', '0.3', true);
  perform set_config('pg_trgm.word_similarity_threshold', '0.4', true);
  return query
  with kand as (
    -- Alleen woordbegin of kernwoord achteraan; een los stukje midden in een
    -- woord ("sap" in "sinaasappel") scoort toch te laag om mee te tellen.
    select i.id from ai_ingredients i
    where i.zoek_naam ~ ('(^| )' || w1)
       or (length(w1) >= 3 and i.zoek_naam ~ (w1 || '(en|s|n)?( |$)'))
    union
    -- Tikfouten pas vanaf 5 letters: bij korte woorden lijkt alles op alles.
    select i.id from ai_ingredients i where length(q) >= 5 and i.zoek_naam % q
    union
    select i.id from ai_ingredients i where length(q) >= 5 and i.zoek_naam % replace(q, ' ', '')
    union
    select i.id from ai_ingredients i where length(q) >= 5 and q <% i.zoek_naam
  ),
  rij as materialized (
    -- Een merkproduct dat precies zo heet ("Kip (Cup A Soup)") is minder
    -- zeker het ding zelf dan een basisproduct: 88 in plaats van 100.
    select i.*, case when public.zoek_score(i.zoek_kern, q) = 100 and i.name ~ '\(' and i.barcode is not null then 88
                     else public.zoek_score(i.zoek_kern, q) end as basis
    from ai_ingredients i join kand on kand.id = i.id
  ),
  pop as (
    select c.zoek_kern as k, count(*) as n, count(*) filter (where c.client_id = p_client) as eigen
    from consumed_meals c
    where c.consumed_at > now() - interval '180 days'
      and c.zoek_kern in (select distinct rij.zoek_kern from rij where rij.basis >= 35)
    group by 1
  ),
  gescoord as (
    select rij.*,
      (rij.basis
      -- Bonussen (basisproduct, populair, eigen historie) tellen alleen vol mee
      -- bij een echte treffer; een losse tikfout-gelijkenis krijgt naar rato.
      + least(1, rij.basis / 90.0) * (
          case when rij.barcode is null then 15 else 0 end
        + case when rij.source = 'coach' then 5 else 0 end
        + least(12, ln(1 + coalesce(pop.n, 0) + coalesce(rij.log_count, 0))::numeric * 4)
        + case when coalesce(pop.eigen, 0) > 0 then 20 + least(10, pop.eigen * 2) else 0 end
        - least(12, length(rij.zoek_kern) / 4.0)
        - case when rij.brand is not null or rij.name ~ '\(' then 6 else 0 end))::numeric as sc
    from rij left join pop on pop.k = rij.zoek_kern
    where rij.basis >= 35
  ),
  uniek as (
    -- Eén basisproduct per naam (drie keer "Kaas" met net andere kcal is
    -- ruis); merkproducten blijven per kcal-waarde apart.
    -- Een merkproduct zonder merk in de naam ("Kaas") telt ook als die naam:
    -- anders staat er twee keer exact hetzelfde woord bovenaan.
    select distinct on (g.zoek_kern, case when g.barcode is null or g.name !~ '\(' then -1 else round(coalesce(g.calories_per_100g, 0)) end) g.*
    from gescoord g
    order by g.zoek_kern, case when g.barcode is null or g.name !~ '\(' then -1 else round(coalesce(g.calories_per_100g, 0)) end,
             (g.barcode is null) desc, g.sc desc
  ),
  gespreid as (
    -- Variatie: elke volgende variant met dezelfde naam zakt 35 punten, zodat
    -- "Kaas (merk)" na "Kaas (merk)" plaatsmaakt voor geraspte kaas, roomkaas,
    -- 30+, enzovoort.
    select u.*, u.sc - 35 * (row_number() over (partition by u.zoek_kern order by u.sc desc) - 1) as eind
    from uniek u
  )
  select u.id, u.name, u.name_en, u.calories_per_100g, u.protein_per_100g,
         u.carbs_per_100g, u.fat_per_100g, u.default_portion_gram::numeric, u.category,
         u.image_url, u.brand, u.log_count, u.barcode, u.source, round(u.eind, 1)
  from gespreid u
  where u.sc >= 35
  order by u.eind desc
  limit p_limit;
end $$;

create or replace function public.zoek_maaltijden(p_q text, p_client uuid default null, p_limit int default 20)
returns table (meal jsonb, score numeric)
language plpgsql volatile security invoker set search_path = public as $$
declare
  q text := public.zoek_norm(p_q);
begin
  if length(q) < 2 then return; end if;
  perform set_config('pg_trgm.similarity_threshold', '0.3', true);
  perform set_config('pg_trgm.word_similarity_threshold', '0.4', true);
  return query
  with rij as materialized (
    select m.id, m.name, m.name_en, m.calories, m.protein, m.carbs, m.fat, m.image_url, m.timing, m.ingredients_list,
           m.partner, m.partner_url, m.partner_prijs, m.labels,
           public.zoek_score(public.zoek_kern(m.name), q) as basis,
           public.zoek_kern(m.name) as k,
           (m.name_en is not null and lower(m.name_en) like '%' || q || '%') as en_treffer
    from ai_meals m
    -- Partnergerechten alleen als ze leverbaar en gecontroleerd zijn.
    where (m.partner is null or (m.partner_actief and not coalesce(m.needs_review, false)))
      and (public.zoek_norm(m.name) like '%' || split_part(public.zoek_stam(q), ' ', 1) || '%'
       or (length(q) >= 5 and public.zoek_norm(m.name) % q)
       or (length(q) >= 4 and q <% public.zoek_norm(m.name))
       or (m.name_en is not null and lower(m.name_en) like '%' || q || '%'))
  ),
  pop as (
    select c.meal_id, count(*) as n, count(*) filter (where c.client_id = p_client) as eigen
    from consumed_meals c
    where c.consumed_at > now() - interval '180 days' and c.meal_id in (select rij.id from rij)
    group by 1
  ),
  gescoord as (
    select rij.*,
      (greatest(rij.basis, case when rij.en_treffer then 50 else 0 end)
       + least(1, rij.basis / 90.0) * (
           least(12, ln(1 + coalesce(pop.n, 0))::numeric * 4)
         + case when coalesce(pop.eigen, 0) > 0 then 20 + least(10, pop.eigen * 2) else 0 end
         - least(12, length(rij.k) / 5.0)))::numeric as sc
    from rij left join pop on pop.meal_id = rij.id
  ),
  uniek as (
    -- Dezelfde maaltijd meermaals in de tabel (kopieën) toont maar één keer.
    select distinct on (g.k) g.* from gescoord g order by g.k, g.sc desc
  )
  select jsonb_build_object('id', u.id, 'name', u.name, 'name_en', u.name_en, 'calories', u.calories,
           'protein', u.protein, 'carbs', u.carbs, 'fat', u.fat, 'image_url', u.image_url,
           'timing', u.timing, 'ingredients_list', u.ingredients_list,
           'partner', u.partner, 'partner_url', u.partner_url, 'partner_prijs', u.partner_prijs, 'labels', u.labels),
         round(u.sc, 1)
  from uniek u
  where u.sc >= 35
  order by u.sc desc
  limit p_limit;
end $$;

grant execute on function public.zoek_ingredienten(text, uuid, int) to authenticated;
grant execute on function public.zoek_maaltijden(text, uuid, int) to authenticated;
