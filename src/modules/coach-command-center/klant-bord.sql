-- Klantenbord op Command (24 nov 2026, Kersten): klanten in eigen secties
-- slepen (kanban), naast de gewone lijst. Per coach eigen secties.
-- Puur toevoegen: oude app-versies merken hier niets van.

create table if not exists public.command_bord_secties (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  naam text not null,
  kleur text not null default 'wit',
  volgorde integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists command_bord_secties_coach on public.command_bord_secties (coach_id, volgorde);

create table if not exists public.command_bord_plek (
  coach_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  sectie_id uuid not null references public.command_bord_secties(id) on delete cascade,
  updated_at timestamptz not null default now(),
  primary key (coach_id, client_id)
);

alter table public.command_bord_secties enable row level security;
alter table public.command_bord_plek enable row level security;

drop policy if exists eigen_secties on public.command_bord_secties;
create policy eigen_secties on public.command_bord_secties for all to authenticated
  using (coach_id = auth.uid()) with check (coach_id = auth.uid());

drop policy if exists eigen_plek on public.command_bord_plek;
create policy eigen_plek on public.command_bord_plek for all to authenticated
  using (coach_id = auth.uid()) with check (coach_id = auth.uid());

revoke all on public.command_bord_secties, public.command_bord_plek from anon;
revoke truncate, references, trigger on public.command_bord_secties, public.command_bord_plek from authenticated;

-- ── Weekritme (24 nov 2026, Kersten) ─────────────────────────────────────
-- Maandag: iedereen in de startkolom (rol 'maandag'), langs en verplaatsen.
-- Donderdag: alleen de kolom met rol 'donderdag' nog eens langs.
-- Zondagnacht zet command_bord_week_reset() iedereen terug in de startkolom
-- en onthoudt waar hij vorige week eindigde (label op de kaart).
alter table public.command_bord_secties add column if not exists rol text;
do $$ begin
  alter table public.command_bord_secties add constraint command_bord_secties_rol_check check (rol in ('maandag', 'donderdag'));
exception when duplicate_object then null; end $$;
alter table public.command_bord_plek add column if not exists vorige_naam text;
alter table public.command_bord_plek add column if not exists vorige_kleur text;
alter table public.command_bord_plek add column if not exists vorige_rol text;

create or replace function public.command_bord_week_reset()
returns integer language plpgsql security definer set search_path = public as $$
declare n integer := 0; r record;
begin
  for r in
    select distinct on (coach_id) coach_id, id as start_id
      from command_bord_secties
     order by coach_id, (rol = 'maandag') desc nulls last, volgorde
  loop
    update command_bord_plek p
       set vorige_naam = s.naam, vorige_kleur = s.kleur, vorige_rol = s.rol,
           sectie_id = r.start_id, updated_at = now()
      from command_bord_secties s
     where s.id = p.sectie_id and p.coach_id = r.coach_id;
    -- Nieuwe maandag-klanten erbij (alleen voor de eigenaar van de klanten).
    insert into command_bord_plek (coach_id, client_id, sectie_id)
    select r.coach_id, c.id, r.start_id
      from clients c
     where c.coach_id = r.coach_id and c.status = 'active'
       and (c.coaching_status = 'paused'  -- pauze-accounts houdt Kersten ook in het oog
            or (coalesce(c.coaching_status, 'active') = 'active'
                and c.pakket <> 'app' and c.maandag_checkin and not coalesce(c.niet_betalend, false)))
    on conflict (coach_id, client_id) do nothing;
    n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function public.command_bord_week_reset() from public, anon, authenticated;

-- Zondag 23:00 UTC = maandag 00:00 (winter) / 01:00 (zomer) in Nederland.
select cron.unschedule('command-bord-week-reset') where exists (select 1 from cron.job where jobname = 'command-bord-week-reset');
select cron.schedule('command-bord-week-reset', '0 23 * * 0', 'select public.command_bord_week_reset()');

-- Kerstens kolommen: Checken en monitoren = start, Motivatie en coherence = donderdag.
update public.command_bord_secties set rol = 'maandag' where id = 'ab0911ec-c7f2-4fd2-aa8d-c6b299c18a77';
update public.command_bord_secties set rol = 'donderdag' where id = '9d0ab932-c1b5-4808-9c90-956faeade7c9';
