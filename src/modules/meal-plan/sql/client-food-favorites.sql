-- Toegepast op 12 sep 2026. Favoriete producten/ingrediënten van een klant,
-- om ze terug te vinden via het filter "Favorieten" in het zoek-tabblad van
-- het log-venster.
--
-- Niet ai_meal_favorites hergebruikt: die tabel gaat over hele maaltijden uit
-- ai_meals (meal_id uuid), terwijl een zoekresultaat ook uit FatSecret kan
-- komen en dan een externe id-string heeft. Vandaar bron + bron_id als tekst.
--
-- De hele zoekregel gaat als payload mee, zodat het portie-scherm daarna
-- precies dezelfde velden krijgt (per100g, defaultPortion, sourceLabel) als
-- bij het zoeken zelf.
create table if not exists public.client_food_favorites (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  bron text not null,
  bron_id text not null,
  naam text not null,
  merk text,
  calories numeric,
  protein numeric,
  carbs numeric,
  fat numeric,
  image_url text,
  payload jsonb,
  created_at timestamptz default now(),
  unique (client_id, bron, bron_id)
);

create index if not exists client_food_favorites_client_idx
  on public.client_food_favorites (client_id, created_at desc);

alter table public.client_food_favorites enable row level security;

drop policy if exists authenticated_all_access on public.client_food_favorites;
create policy authenticated_all_access on public.client_food_favorites
  for all to authenticated using (true) with check (true);
