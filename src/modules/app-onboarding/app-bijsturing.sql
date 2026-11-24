-- src/modules/app-onboarding/app-bijsturing.sql (24 nov 2026)
--
-- Wekelijkse bijsturing van de calorieën voor app-gebruikers (clients.app_abonnee).
-- Een coachingklant wordt door Kersten bijgestuurd; een app-gebruiker heeft geen
-- coach, dus doet de app het. Regel (Kersten akkoord, 24 nov 2026):
--
--   - Alleen app-accounts met doel vet kwijt (fat_loss / cut) en een lopend
--     abonnement of proefmaand.
--   - Elke maandag: gemiddeld gewicht van de laatste 7 dagen vergeleken met het
--     gemiddelde van 14-20 dagen geleden (minstens 2 wegingen in elk venster).
--   - Gaat er minder dan 0,25 % per week af: 100 kcal minder per dag
--     (uit de koolhydraten, 25 g). Eiwit en vet blijven.
--   - Nooit onder 1800 kcal (man) / 1500 kcal (vrouw), dezelfde vloer als de intake.
--   - Hooguit eens per 13 dagen, zodat een aanpassing tijd krijgt.
--   - De gebruiker krijgt een melding in de app (pagina Mijn plan).
--   - Elke beslissing staat in app_bijsturing_log, ook "niets gedaan".
-- Alleen toevoegen; oude app-versies merken hier niets van.

create table if not exists public.app_bijsturing_log (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  datum date not null default current_date,
  besluit text not null,              -- 'omlaag' | 'goed' | 'te_weinig_data' | 'vloer' | 'te_kort_geleden'
  oud_kcal int,
  nieuw_kcal int,
  verlies_pct_per_week numeric,
  gem_nu numeric,
  gem_toen numeric,
  created_at timestamptz not null default now()
);
create index if not exists app_bijsturing_log_klant on public.app_bijsturing_log (client_id, datum desc);
alter table public.app_bijsturing_log enable row level security;
drop policy if exists app_bijsturing_eigen on public.app_bijsturing_log;
create policy app_bijsturing_eigen on public.app_bijsturing_log for select to authenticated
  using (client_id in (select id from clients where auth_user_id = auth.uid()));
drop policy if exists app_bijsturing_coach on public.app_bijsturing_log;
create policy app_bijsturing_coach on public.app_bijsturing_log for select to authenticated using (rls_is_coach());
revoke all on public.app_bijsturing_log from anon;
revoke insert, update, delete, truncate, references, trigger on public.app_bijsturing_log from authenticated;
grant select on public.app_bijsturing_log to authenticated;

create or replace function public.app_week_bijsturing()
returns jsonb
language plpgsql security definer
set search_path to 'public'
as $$
declare
  c record; v_nu numeric; v_toen numeric; n_nu int; n_toen int; v_pct numeric;
  v_vloer int; v_nieuw int; v_omlaag int := 0; v_bekeken int := 0;
begin
  for c in
    select cl.* from clients cl
    join app_abonnementen a on a.client_id = cl.id
    where coalesce(cl.app_abonnee, false) and cl.account_locked_at is null
      and lower(coalesce(cl.primary_goal, '')) in ('fat_loss', 'cut', 'afvallen')
      and a.status in ('proef', 'actief', 'respijt') and (a.verloopt_op is null or a.verloopt_op > now())
      and cl.target_calories is not null
  loop
    v_bekeken := v_bekeken + 1;

    if exists (select 1 from app_bijsturing_log l where l.client_id = c.id and l.besluit = 'omlaag' and l.datum > current_date - 13) then
      insert into app_bijsturing_log (client_id, besluit, oud_kcal) values (c.id, 'te_kort_geleden', c.target_calories);
      continue;
    end if;

    select avg(weight), count(*) into v_nu, n_nu from weight_tracking
      where client_id = c.id and date > current_date - 7 and weight > 0;
    select avg(weight), count(*) into v_toen, n_toen from weight_tracking
      where client_id = c.id and date between current_date - 20 and current_date - 14 and weight > 0;
    if coalesce(n_nu, 0) < 2 or coalesce(n_toen, 0) < 2 then
      insert into app_bijsturing_log (client_id, besluit, oud_kcal, gem_nu, gem_toen) values (c.id, 'te_weinig_data', c.target_calories, v_nu, v_toen);
      continue;
    end if;

    -- Twee weken verschil, terug naar per week, als % van het oude gewicht.
    v_pct := round(((v_toen - v_nu) / v_toen * 100 / 2)::numeric, 3);
    update clients set current_weight = round(v_nu, 1) where id = c.id;

    if v_pct >= 0.25 then
      insert into app_bijsturing_log (client_id, besluit, oud_kcal, verlies_pct_per_week, gem_nu, gem_toen) values (c.id, 'goed', c.target_calories, v_pct, v_nu, v_toen);
      continue;
    end if;

    v_vloer := case when lower(coalesce(c.gender, '')) like 'f%' or lower(coalesce(c.gender, '')) like 'v%' then 1500 else 1800 end;
    v_nieuw := greatest(v_vloer, c.target_calories - 100);
    if v_nieuw >= c.target_calories then
      insert into app_bijsturing_log (client_id, besluit, oud_kcal, verlies_pct_per_week, gem_nu, gem_toen) values (c.id, 'vloer', c.target_calories, v_pct, v_nu, v_toen);
      continue;
    end if;

    update clients set
      target_calories = v_nieuw,
      target_carbs = greatest(0, coalesce(target_carbs, 0) - round((c.target_calories - v_nieuw) / 4.0)::int),
      manual_macro_targets = true,
      updated_at = now()
    where id = c.id;
    insert into app_bijsturing_log (client_id, besluit, oud_kcal, nieuw_kcal, verlies_pct_per_week, gem_nu, gem_toen)
      values (c.id, 'omlaag', c.target_calories, v_nieuw, v_pct, v_nu, v_toen);
    insert into notifications (client_id, coach_id, type, title, message, page_context, priority, source)
      values (c.id, c.trainer_id, 'reminder', 'Je plan is bijgestuurd',
        format('Je gewicht ging de afgelopen 2 weken te langzaam omlaag. Daarom eet je nu %s kcal per dag in plaats van %s. Zo blijf je doorgaan!', v_nieuw, c.target_calories),
        'mijnplan', 'normal', 'auto');
    v_omlaag := v_omlaag + 1;
  end loop;
  return jsonb_build_object('bekeken', v_bekeken, 'omlaag', v_omlaag);
end $$;
revoke all on function public.app_week_bijsturing() from public, anon, authenticated;

-- Elke maandag om 05:00 UTC (6:00/7:00 Nederlandse tijd).
select cron.schedule('app-week-bijsturing', '0 5 * * 1', 'select public.app_week_bijsturing()');

notify pgrst, 'reload schema';
