-- src/modules/app-onboarding/app-overzicht.sql (24 nov 2026)
--
-- Overzicht "App-gebruikers" voor de coach (CoachHub → Clients → App-gebruikers).
-- Alleen lezen; alleen de coach (rls_is_coach). Alleen toevoegen.

create or replace function public.get_app_overzicht()
returns jsonb
language plpgsql stable security definer
set search_path to 'public'
as $$
declare r jsonb;
begin
  if not coalesce(rls_is_coach(), false) then raise exception 'alleen voor de coach'; end if;
  with g as (
    select cl.id, cl.first_name, cl.email, cl.created_at, cl.primary_goal, cl.target_calories, cl.current_weight, cl.goal_weight,
           a.status, a.verloopt_op, a.product_id,
           case when a.status in ('proef', 'actief', 'respijt') and (a.verloopt_op is null or a.verloopt_op > now()) then a.status else 'geen' end as stand,
           (select count(*) from kersten_ai_berichten k where k.client_id = cl.id and k.rol = 'vraag') as ai_vragen,
           (select max(w.date) from weight_challenge_logs w where w.client_id = cl.id) as laatst_gewogen,
           exists (select 1 from call_leads l where l.lead_source = 'app' and lower(l.email) = lower(cl.email)) as wil_coaching
    from clients cl
    left join app_abonnementen a on a.client_id = cl.id
    where coalesce(cl.app_abonnee, false)
  )
  select jsonb_build_object(
    'totaal', (select count(*) from g),
    'nieuw_7d', (select count(*) from g where created_at > now() - interval '7 days'),
    'proef', (select count(*) from g where stand = 'proef'),
    'betalend', (select count(*) from g where stand in ('actief', 'respijt')),
    'geen', (select count(*) from g where stand = 'geen'),
    'wil_coaching', (select count(*) from g where wil_coaching),
    'gebruikers', coalesce((select jsonb_agg(to_jsonb(g) order by g.created_at desc) from g), '[]'::jsonb),
    'vragen', coalesce((select jsonb_agg(v order by v.created_at desc) from (
        select k.tekst, k.created_at, cl.first_name from kersten_ai_berichten k join clients cl on cl.id = k.client_id
        where k.rol = 'vraag' order by k.created_at desc limit 40) v), '[]'::jsonb)
  ) into r;
  return r;
end $$;
revoke all on function public.get_app_overzicht() from public, anon;
grant execute on function public.get_app_overzicht() to authenticated;
notify pgrst, 'reload schema';
