-- src/modules/business-os/keten-challenge.sql (5 nov 2026)
--
-- Challenge-cijfers per periode voor de Keten. Alleen toevoegen. Security invoker: de RLS op
-- lead_movements, lead_campaign_tags en client_doorstap blijft gelden.
--
-- Campagne-cijfers tellen alleen wat gebeurde terwijl de lead aan een challenge-campagne hing
-- (zelfde regel als getCampaignBreakdown). Uitgestelde sales tellen nergens mee.
-- Cohort = de challenges die in deze periode verkocht zijn, en waar die nu staan.
-- Doorstap = de laatste stand per klant, geteld in de week dat die gezet is.

create or replace function public.get_keten_challenge(p_van timestamptz, p_tot timestamptz)
returns jsonb
language sql stable security invoker set search_path = public as $$
  with tags as (
    select t.lead_id, t.tagged_at, t.untagged_at
    from lead_campaign_tags t
    join outreach_campaigns c on c.id = t.campaign_id and c.name ilike '%challenge%'
  ),
  mov as (
    select m.*, exists (
      select 1 from tags t where t.lead_id = m.lead_id and t.tagged_at <= m.moved_at
        and (t.untagged_at is null or m.moved_at < t.untagged_at)
    ) as in_campagne
    from lead_movements m
    where m.reverted_at is null and m.moved_at >= p_van and m.moved_at < p_tot
  ),
  verkocht as (
    select m.* from lead_movements m
    where m.reverted_at is null and m.sale_kind = 'challenge' and coalesce(m.order_value, 0) > 0
      and m.moved_at >= p_van and m.moved_at < p_tot
  ),
  doorstap as (
    select distinct on (client_id) client_id, status, gezet_at
    from client_doorstap order by client_id, gezet_at desc
  )
  select jsonb_build_object(
    'reacties', (select count(distinct e.lead_id) from lead_reaction_events e
       where e.created_at >= p_van and e.created_at < p_tot and exists (
         select 1 from tags t where t.lead_id = e.lead_id and t.tagged_at <= e.created_at
           and (t.untagged_at is null or e.created_at < t.untagged_at))),
    'voorgesteld', (select count(distinct lead_id) from mov where in_campagne and to_section_title ilike 'Call voorgesteld%'),
    'ingepland', (select count(distinct lead_id) from mov where in_campagne and lower(to_section_title) like '%sales call%'),
    'gevoerd', (select count(distinct m.lead_id) from lead_movements m
       where m.reverted_at is null and m.call_happened and lower(m.to_section_title) like '%sales call%'
         and m.call_date >= (p_van at time zone 'Europe/Amsterdam')::date and m.call_date < (p_tot at time zone 'Europe/Amsterdam')::date
         and exists (select 1 from tags t where t.lead_id = m.lead_id and t.tagged_at::date <= m.call_date
           and (t.untagged_at is null or m.call_date < t.untagged_at::date))),
    'noshow', (select count(distinct lead_id) from mov where in_campagne and to_section_title = 'No Show'),
    'afgewezen', (select count(distinct lead_id) from mov where in_campagne and to_section_title = 'Call afgewezen'),
    'verloren', (select count(distinct lead_id) from mov where in_campagne and to_section_title = 'Sale verloren'),
    'sales_campagne', (select count(*) from mov where in_campagne and sale_kind = 'challenge' and coalesce(order_value, 0) > 0 and coalesce(challenge_status, '') <> 'uitgesteld'),
    'verkocht', (select count(*) from verkocht where coalesce(challenge_status, '') <> 'uitgesteld'),
    'order', (select coalesce(sum(order_value), 0) from verkocht where coalesce(challenge_status, '') <> 'uitgesteld'),
    'uitgesteld', (select count(*) from verkocht where challenge_status = 'uitgesteld'),
    'verlengingen', (select count(*) from mov where to_section_title ilike 'Verlenging%'),
    'verleng_order', (select coalesce(sum(order_value), 0) from mov where to_section_title ilike 'Verlenging%'),
    'cohort_refund', (select count(*) from verkocht where challenge_status = 'terugbetaald'),
    'cohort_behouden', (select count(*) from verkocht where challenge_status = 'behouden'),
    'cohort_open', (select count(*) from verkocht where coalesce(challenge_status, 'open') = 'open'),
    'cohort_doorgezet', (select count(*) from verkocht v where exists (
       select 1 from lead_movements x where x.borg_movement_id = v.id and x.reverted_at is null)),
    'doorstap_ja', (select count(*) from doorstap where gezet_at >= p_van and gezet_at < p_tot and status in ('ja_mondeling', 'betaald')),
    'doorstap_denkt', (select count(*) from doorstap where gezet_at >= p_van and gezet_at < p_tot and status = 'denkt_na'),
    'doorstap_nee', (select count(*) from doorstap where gezet_at >= p_van and gezet_at < p_tot and status = 'nee')
  )
$$;

revoke all on function public.get_keten_challenge(timestamptz, timestamptz) from public, anon;
grant execute on function public.get_keten_challenge(timestamptz, timestamptz) to authenticated, service_role;
