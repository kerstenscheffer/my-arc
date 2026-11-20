-- src/modules/abonnement/abonnement.sql (20 nov 2026)
--
-- App-abonnement (App Store / Google Play via RevenueCat). Alleen toevoegen:
-- oude app-versies lezen niets hiervan en merken er dus niets van.
--
-- Regel (Kersten, 20 nov 2026):
--   - Klant die de coach heeft aangemaakt en niet op slot staat  -> toegang (coaching).
--   - Actief abonnement of lopende proefmaand                    -> toegang.
--   - Oud-klant op slot (account_locked_at)                      -> betaalmuur i.p.v. slotscherm.
--   - Zelf aangemaakt app-account (clients.app_abonnee)           -> betaalmuur zonder abonnement.
--   - Geen klant (coach, teamlid)                                 -> toegang.
-- De app laat bij een fout in deze check een klant altijd binnen (fail-open).

-- 1. Kenmerk voor accounts die iemand zelf in de app heeft aangemaakt.
alter table public.clients add column if not exists app_abonnee boolean not null default false;
comment on column public.clients.app_abonnee is
  '20 nov 2026: zelf aangemaakt in de app (geen coachingklant). Telt niet mee in coaching-lijsten; toegang via app_abonnementen.';

-- 2. De abonnementsstand per inlogaccount. Alleen de webhook (service role) schrijft.
create table if not exists public.app_abonnementen (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  status text not null default 'verlopen' check (status in ('proef', 'actief', 'respijt', 'verlopen', 'gestopt')),
  product_id text,
  store text,
  verloopt_op timestamptz,
  proef_gebruikt boolean not null default false,
  laatste_event text,
  ruw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.app_abonnementen enable row level security;

drop policy if exists app_abonnementen_eigen on public.app_abonnementen;
create policy app_abonnementen_eigen on public.app_abonnementen
  for select to authenticated using (auth_user_id = auth.uid());

drop policy if exists app_abonnementen_coach on public.app_abonnementen;
create policy app_abonnementen_coach on public.app_abonnementen
  for select to authenticated using (rls_is_coach());

revoke all on public.app_abonnementen from anon;
revoke insert, update, delete on public.app_abonnementen from authenticated;
grant select on public.app_abonnementen to authenticated;

-- 3. Mag dit account de app gebruiken?
create or replace function public.mijn_app_toegang()
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $$
  with k as (
    select count(*) as n,
           bool_or(not coalesce(app_abonnee, false) and account_locked_at is null) as coaching,
           bool_or(coalesce(app_abonnee, false)) as app_account
    from clients where auth_user_id = auth.uid()
  ), a as (
    select status, product_id, verloopt_op, proef_gebruikt,
           status in ('proef', 'actief', 'respijt') and (verloopt_op is null or verloopt_op > now()) as geldig
    from app_abonnementen where auth_user_id = auth.uid()
  )
  select case
    when auth.uid() is null then jsonb_build_object('toegang', false, 'reden', 'niet_ingelogd')
    when (select n from k) = 0 then jsonb_build_object('toegang', true, 'reden', 'geen_klant')
    when (select coaching from k) then jsonb_build_object('toegang', true, 'reden', 'coaching')
    when coalesce((select geldig from a), false) then jsonb_build_object(
      'toegang', true, 'reden', 'abonnement',
      'status', (select status from a), 'product_id', (select product_id from a), 'verloopt_op', (select verloopt_op from a))
    else jsonb_build_object(
      'toegang', false,
      'reden', case when (select app_account from k) then 'geen_abonnement' else 'coaching_gestopt' end,
      'proef_gebruikt', coalesce((select proef_gebruikt from a), false))
  end
$$;
revoke all on function public.mijn_app_toegang() from public, anon;
grant execute on function public.mijn_app_toegang() to authenticated;

notify pgrst, 'reload schema';
