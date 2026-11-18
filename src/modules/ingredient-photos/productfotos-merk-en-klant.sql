-- src/modules/ingredient-photos/productfotos-merk-en-klant.sql
--
-- Productfoto's, 18 nov 2026 (Kersten: "bij Haribo Haribo, bij Oreo Oreo").
-- Alleen toevoegen; niets weghalen of hernoemen (oude app-versies).
--
-- 1. Merkfoto: een product zonder eigen foto krijgt de foto van een gelijkend
--    product van hetzelfde merk (scripts/merkfotos.mjs rekent, merkfotos_zet
--    schrijft). image_source = 'merk_voorbeeld', image_voorbeeld_van = bron.
--    Oude apps lezen gewoon image_url en zien hem dus ook.
-- 2. Klantfoto: scant een klant een product zonder echte foto, dan kan hij de
--    voorkant fotograferen. De foto komt in product_foto_inzendingen en geldt
--    pas voor iedereen als de coach hem goedkeurt (keur_productfoto).
-- Rangorde: echte foto (OFF of goedgekeurde klantfoto) > merkfoto > soortfoto
-- in de app (foodImageFallback.js). Een merkfoto wordt dus altijd overschreven.

alter table public.ai_ingredients add column if not exists image_voorbeeld_van uuid;

-- ── 1. Merkfoto's schrijven (alleen service_role, vanaf de Mac) ──
create or replace function public.merkfotos_zet(p_rijen jsonb)
returns integer language sql security definer set search_path = public as $$
  with r as (
    select (x->>'id')::uuid id, x->>'url' url, (x->>'van')::uuid van
    from jsonb_array_elements(p_rijen) x
  ), u as (
    update ai_ingredients a
       set image_url = r.url, image_source = 'merk_voorbeeld', image_voorbeeld_van = r.van
      from r
     where a.id = r.id and a.image_url is null and r.url is not null
    returning 1
  )
  select count(*)::int from u;
$$;
revoke all on function public.merkfotos_zet(jsonb) from public, anon, authenticated;
grant execute on function public.merkfotos_zet(jsonb) to service_role;

-- OFF-foto's (scripts/off-export-fotos.mjs) mogen voortaan ook een merkfoto
-- vervangen. Zelfde naam en vorm als voorheen.
create or replace function public.productfotos_zet(p_rijen jsonb)
returns integer language sql security definer set search_path = public as $$
  with r as (
    select (x->>'id')::uuid id, nullif(x->>'url','') url
    from jsonb_array_elements(p_rijen) x
  ), u as (
    update ai_ingredients a
       set image_url = coalesce(r.url, a.image_url),
           image_source = case when r.url is not null and a.image_source = 'merk_voorbeeld' then null else a.image_source end,
           image_voorbeeld_van = case when r.url is not null then null else a.image_voorbeeld_van end,
           image_url_checked_at = now()
      from r
     where a.id = r.id and (a.image_url is null or a.image_source = 'merk_voorbeeld')
    returning 1
  )
  select count(*)::int from u;
$$;

-- ── 2. Klantfoto's ──
create table if not exists public.product_foto_inzendingen (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references public.ai_ingredients(id) on delete cascade,
  barcode text,
  foto_url text not null,
  ingezonden_door uuid default auth.uid(),
  client_id uuid,
  status text not null default 'nieuw' check (status in ('nieuw', 'goed', 'afgekeurd')),
  created_at timestamptz not null default now(),
  beoordeeld_op timestamptz,
  beoordeeld_door uuid
);
create index if not exists product_foto_inzendingen_status_idx on public.product_foto_inzendingen (status, created_at desc);
alter table public.product_foto_inzendingen enable row level security;

-- Wie er instuurt en voor welke klant: altijd door de database bepaald, en een
-- nieuwe inzending is altijd 'nieuw' (een klant kan zichzelf niet goedkeuren).
create or replace function public.product_foto_inzending_vul()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.ingezonden_door := auth.uid();
  new.client_id := (select id from clients where auth_user_id = auth.uid() limit 1);
  new.status := 'nieuw';
  new.beoordeeld_op := null;
  new.beoordeeld_door := null;
  return new;
end $$;
drop trigger if exists product_foto_inzending_vul on public.product_foto_inzendingen;
create trigger product_foto_inzending_vul before insert on public.product_foto_inzendingen
  for each row execute function public.product_foto_inzending_vul();

-- Coach = iemand bij wie minstens één klant hoort (zelfde lezing als elders).
create or replace function public.is_een_coach()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from clients where coach_id = auth.uid() or trainer_id = auth.uid())
$$;

drop policy if exists pfi_insert on public.product_foto_inzendingen;
create policy pfi_insert on public.product_foto_inzendingen for insert to authenticated
  with check (auth.uid() is not null);
drop policy if exists pfi_select on public.product_foto_inzendingen;
create policy pfi_select on public.product_foto_inzendingen for select to authenticated
  using (ingezonden_door = auth.uid() or (client_id is not null and is_coach_van(client_id))
         or (client_id is null and is_een_coach()));

-- Goed- of afkeuren. Goed = de foto wordt de foto van het product, maar alleen
-- als dat nog geen echte foto had (leeg of merkvoorbeeld).
create or replace function public.keur_productfoto(p_id uuid, p_goed boolean)
returns text language plpgsql security definer set search_path = public as $$
declare v record;
begin
  select * into v from product_foto_inzendingen where id = p_id;
  if v is null then return 'onbekend'; end if;
  if not ((v.client_id is not null and is_coach_van(v.client_id)) or (v.client_id is null and is_een_coach())) then
    raise exception 'geen recht';
  end if;
  update product_foto_inzendingen
     set status = case when p_goed then 'goed' else 'afgekeurd' end, beoordeeld_op = now(), beoordeeld_door = auth.uid()
   where id = p_id;
  if p_goed then
    update ai_ingredients
       set image_url = v.foto_url, image_source = 'klant', image_voorbeeld_van = null,
           image_author = null, image_author_url = null, image_photo_id = null
     where id = v.ingredient_id and (image_url is null or image_source = 'merk_voorbeeld');
    -- Andere inzendingen voor hetzelfde product zijn dan niet meer nodig.
    update product_foto_inzendingen set status = 'afgekeurd', beoordeeld_op = now(), beoordeeld_door = auth.uid()
     where ingredient_id = v.ingredient_id and status = 'nieuw' and id <> p_id;
  end if;
  return case when p_goed then 'goed' else 'afgekeurd' end;
end $$;
revoke all on function public.keur_productfoto(uuid, boolean) from public, anon;
grant execute on function public.keur_productfoto(uuid, boolean) to authenticated;
