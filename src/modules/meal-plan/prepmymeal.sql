-- PrepMyMeal-samenwerking (14 okt 2026). Kant-en-klare gerechten staan als
-- gewone ai_meals, met partnervelden. Bestellink bevat Kerstens ref-code.
--
-- Bron: https://prepmymeal.nl/products.json (Shopify). 177 producten: elk gerecht
-- 3x (prijs 8,99/9,49/9,99 per boxgrootte) + 17 pakketten/abonnementen.
-- Geïmporteerd: 41 unieke gerechten, laagste prijs, foto = eerste <img> in de
-- beschrijving (5 gerechten hadden alleen een infographic: image_url null,
-- de koppeling in foodImageFallback geeft dan een passende foto).
-- XL-gerechten ("XL, 2 porties"): voedingswaarden op de site zijn per bak van
-- 2 porties; opgeslagen per portie, label 'bak_2_porties', prijs per bak.
-- 'Kip, rijst, broccoli in yoghurt-curry saus' staat op needs_review (site
-- geeft 0 g koolhydraten en een foto van een ander gerecht).
--
-- Automatische plan-generators slaan partner-maaltijden over
-- (AIMealPlanningService.loadAIMeals, AIMealPlanGeneratorService).

alter table public.ai_meals add column if not exists partner text;
alter table public.ai_meals add column if not exists partner_url text;
alter table public.ai_meals add column if not exists partner_prijs numeric;
alter table public.ai_meals add column if not exists partner_extern_id text;
alter table public.ai_meals add column if not exists partner_actief boolean not null default true;
create unique index if not exists ai_meals_partner_extern_uniek on public.ai_meals (partner, partner_extern_id) where partner is not null;

-- Import: insert ... on conflict (partner, partner_extern_id) where partner is not null
-- do update set naam/macro's/prijs/url, partner_actief = true.
-- Velden: partner='prepmymeal', partner_url='https://prepmymeal.nl/products/<handle>?ref=KERSTENSCHEFFER',
-- timing={lunch,dinner}, meal_type='solid', difficulty='etm', cost_tier='premium',
-- scalable=false, ingredients_list='[]', internal_name='prepmymeal_<handle>'.
