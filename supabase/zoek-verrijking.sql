-- Wekelijkse aanvuller van de zoeker (18 nov 2026, Kersten: "een systeem dat
-- uit zichzelf werkt"). Edge function: supabase/functions/zoek-verrijking.
--
-- Elke maandag 04:00 kijkt hij wat klanten zochten en niet vonden:
--   gat 'product' : gezocht bij het loggen, de productzoeker vindt nu nog niets
--   gat 'gerecht' : gezocht in het wisselvenster, er is geen gerecht met die woorden
-- Alleen termen die op twee verschillende dagen of door twee klanten gezocht
-- zijn, en nooit een half getypt woord als het hele woord er ook staat.
-- Elke term wordt één keer behandeld; de uitkomst staat in zoek_verrijking.

create table if not exists public.zoek_verrijking (
  term text not null,
  gat text not null,
  keer int,
  klanten int,
  uitkomst text not null,        -- synoniem | maaltijd | overgeslagen | onzin | product_ontbreekt
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (term, gat)
);
alter table public.zoek_verrijking enable row level security;
-- Geen policies: alleen de edge function (service role) leest en schrijft.

create or replace function public.zoek_verrijking_kandidaten(p_max integer default 12)
returns table(term text, gat text, keer integer, klanten integer)
language sql
security definer
set search_path to 'public'
as $function$
  with ruw as (
    select public.zoek_norm(l.zoekterm) as term,
           case when l.context = 'wissel' then 'gerecht' else 'product' end as gat,
           l.client_id, l.created_at::date as dag
    from zoek_log l
    where l.created_at > now() - interval '45 days'
      and l.uitkomst = 'geen_klik'
  ),
  t as (
    select r.term, r.gat, count(*)::int as keer, count(distinct r.client_id)::int as klanten
    from ruw r
    where length(r.term) >= 4 and r.term !~ '^[0-9 ]+$'
    group by r.term, r.gat
    having count(distinct r.dag) >= 2 or count(distinct r.client_id) >= 2
  )
  select t.term, t.gat, t.keer, t.klanten
  from t
  where not exists (select 1 from zoek_verrijking v where v.term = t.term and v.gat = t.gat)
    -- half getypt: het langere woord staat er ook
    and not exists (select 1 from t t2 where t2.gat = t.gat and t2.term <> t.term and t2.term like t.term || '%')
    -- dezelfde term leverde elders wel een keuze op
    and not exists (select 1 from zoek_log g where g.uitkomst = 'gekozen' and public.zoek_norm(g.zoekterm) = t.term
                      and (g.context = 'wissel') = (t.gat = 'gerecht'))
    and case
      when t.gat = 'product' then (select count(*) from public.zoek_ingredienten(t.term, null, 3)) = 0
      else not exists (
        select 1 from ai_meals m
        where m.calories > 0 and not coalesce(m.needs_review, false)
          and not exists (select 1 from unnest(string_to_array(t.term, ' ')) w
                          where length(w) >= 3 and position(public.zoek_stam(w) in public.zoek_norm(m.name)) = 0))
    end
  order by t.klanten desc, t.keer desc, t.term
  limit p_max
$function$;
revoke all on function public.zoek_verrijking_kandidaten(integer) from public, anon, authenticated;
grant execute on function public.zoek_verrijking_kandidaten(integer) to service_role;

-- Elke maandag 04:00 (UTC). De sleutel komt uit de Vault, dezelfde als bij plan-bouwer.
select cron.unschedule('zoek-verrijking') where exists (select 1 from cron.job where jobname = 'zoek-verrijking');
select cron.schedule('zoek-verrijking', '0 4 * * 1', $cron$
  select net.http_post(
    url := 'https://xlaycpwpnhjmulfsnynh.supabase.co/functions/v1/zoek-verrijking',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-testsleutel', (select decrypted_secret from vault.decrypted_secrets where name = 'plan_bouwer_testsleutel')),
    body := '{}'::jsonb,
    timeout_milliseconds := 5000
  )
$cron$);
