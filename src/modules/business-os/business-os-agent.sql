-- src/modules/business-os/business-os-agent.sql
--
-- Database-toegang voor de Business OS-chat (30 okt 2026).
--
-- business_os_lees(p_sql): de AI stelt zelf een SELECT-vraag. Veiligheid:
--   → security INVOKER: draait met de rechten (RLS) van de ingelogde coach;
--   → alleen coaches (get_my_portal_role);
--   → transaction_read_only = on vóór de query: ook functies die iets willen
--     schrijven falen, de hele aanroep is één read-only transactie;
--   → ingepakt als subquery: geen meerdere statements, geen schrijvende CTE's;
--   → statement_timeout 8 s, maximaal 200 rijen terug.
--
-- business_os_schema(p_tabel): tabellen of kolommen (met omschrijving) van het
-- public-schema, zodat de AI weet wat er bestaat. Alleen metadata.
--
-- Schrijven gaat NIET via SQL: de AI zet een voorstel klaar (tabel + filter +
-- velden) en Kerstens klik voert het uit via supabase-js met zijn eigen RLS.

create or replace function public.business_os_lees(p_sql text)
returns jsonb
language plpgsql volatile security invoker
set search_path = public
as $$
declare
  v_sql text := btrim(p_sql);
  v_res jsonb;
begin
  if public.get_my_portal_role() not in ('coach', 'both') then
    raise exception 'alleen voor coaches';
  end if;
  v_sql := regexp_replace(v_sql, ';\s*$', '');
  if v_sql !~* '^\s*(select|with)\s' then
    raise exception 'alleen SELECT-vragen';
  end if;
  if position(';' in v_sql) > 0 then
    raise exception 'één vraag tegelijk';
  end if;
  perform set_config('transaction_read_only', 'on', true);
  perform set_config('statement_timeout', '8000', true);
  execute format('select coalesce(jsonb_agg(t), ''[]''::jsonb) from (select * from (%s) q limit 200) t', v_sql)
    into v_res;
  return v_res;
end;
$$;

revoke all on function public.business_os_lees(text) from public, anon;
grant execute on function public.business_os_lees(text) to authenticated;

create or replace function public.business_os_schema(p_tabel text default null)
returns jsonb
language sql stable security definer
set search_path = public
as $$
  select case when p_tabel is null then (
    select coalesce(jsonb_agg(jsonb_build_object(
      'tabel', c.relname,
      'rijen', greatest(c.reltuples, 0)::bigint,
      'omschrijving', obj_description(c.oid, 'pg_class')
    ) order by c.relname), '[]'::jsonb)
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'v')
      and c.relname !~ '(backup|_bak|_old|_test)'
  ) else (
    select coalesce(jsonb_agg(jsonb_build_object(
      'kolom', a.attname,
      'type', format_type(a.atttypid, a.atttypmod),
      'omschrijving', col_description(a.attrelid, a.attnum)
    ) order by a.attnum), '[]'::jsonb)
    from pg_attribute a
    where a.attrelid = to_regclass('public.' || quote_ident(p_tabel))
      and a.attnum > 0 and not a.attisdropped
  ) end
  where public.get_my_portal_role() in ('coach', 'both')
$$;

revoke all on function public.business_os_schema(text) from public, anon;
grant execute on function public.business_os_schema(text) to authenticated;

-- Snelle chat (30 okt 2026): de PA hoort nieuwe opdrachten direct via Realtime
-- en schrijft het antwoord al tijdens het typen in `antwoord`; Business OS
-- luistert mee op de eigen rij. RLS blijft gelden voor postgres_changes.
alter publication supabase_realtime add table public.business_os_opdrachten;

-- Groeiloop (30 okt 2026): de PA draait elke nacht (en op verzoek) een ronde
-- waarin Gino zijn skills bijwerkt en verbeteringen voorstelt. Zo'n ronde is
-- een rij met soort 'groei'; Business OS zet het verslag één keer in de chat
-- en vult dan gezien_at. Check alleen verruimd (oude waarden blijven geldig).
alter table public.business_os_opdrachten drop constraint business_os_opdrachten_soort_check;
alter table public.business_os_opdrachten add constraint business_os_opdrachten_soort_check check (soort = any (array['code','chat','groei']));
alter table public.business_os_opdrachten add column if not exists gezien_at timestamptz;

-- Cijfers in één vraag (30 okt 2026): business_os_periode(van, tot) = de keten
-- van get_business_os plus ontvangen omzet (get_payment_schedule, alleen
-- aangevinkte betalingen), calls op calldatum, gehouden, no-show, voorgesteld,
-- afgewezen, close rate, gem. orderwaarde en geplande content. Team-breed.
-- business_os_vergelijk() = deze maand t/m vandaag, vorige maand t/m dezelfde
-- dag, hele vorige maand, 3 maanden totaal, deze en vorige week. Gino gebruikt
-- dit (skill Leadsysteem-cijfers) in plaats van 3-5 losse vragen.
create or replace function public.business_os_periode(p_van date, p_tot date)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_team uuid[]; v_keten jsonb; v_ontv numeric := 0; v_marcel numeric := 0; v_c record;
begin
  if auth.uid() is null then raise exception 'niet ingelogd'; end if;
  if public.get_my_portal_role() not in ('coach', 'both') then raise exception 'alleen voor coaches'; end if;
  v_team := team_coach_ids(auth.uid());
  v_keten := coalesce(get_business_os(p_van, p_tot)->'nu', '{}'::jsonb);
  select coalesce(sum((e->>'bedrag')::numeric), 0), coalesce(sum((e->>'partner_deel')::numeric), 0)
    into v_ontv, v_marcel
    from jsonb_array_elements(coalesce(get_payment_schedule(null, p_van, p_tot), '[]'::jsonb)) e
   where (e->>'datum')::date >= p_van and (e->>'datum')::date < p_tot;
  select
    count(distinct lead_id) filter (where lower(to_section_title) like '%sales call%' and call_date >= p_van and call_date < p_tot) as op_datum,
    count(distinct lead_id) filter (where lower(to_section_title) like '%sales call%' and call_date >= p_van and call_date < p_tot and call_happened) as gehouden,
    count(*) filter (where to_section_title = 'No Show' and moved_at >= p_van and moved_at < p_tot) as no_show,
    count(*) filter (where to_section_title ilike 'Call voorgesteld%' and moved_at >= p_van and moved_at < p_tot) as voorgesteld,
    count(*) filter (where to_section_title = 'Call afgewezen' and moved_at >= p_van and moved_at < p_tot) as afgewezen
    into v_c
    from lead_movements
   where reverted_at is null and coach_id = any(v_team)
     and (call_date >= p_van - 31 or moved_at >= p_van - 31);
  return v_keten || jsonb_build_object(
    'van', p_van, 'tot', p_tot,
    'ontvangen', round(v_ontv), 'marcel_deel', round(v_marcel),
    'calls_op_datum', v_c.op_datum, 'calls_gehouden', v_c.gehouden, 'no_show', v_c.no_show,
    'call_voorgesteld', v_c.voorgesteld, 'call_afgewezen', v_c.afgewezen,
    'close_rate_pct', case when v_c.gehouden > 0 then round(100.0 * (v_keten->>'sales')::numeric / v_c.gehouden) end,
    'gem_orderwaarde', case when (v_keten->>'sales')::numeric > 0 then round((v_keten->>'omzet')::numeric / (v_keten->>'sales')::numeric) end,
    'content_gepland', (select count(*) from content_items where coach_id = any(v_team) and planned_date >= p_van and planned_date < p_tot and coalesce(is_template, false) = false and title not like '\_\_test%')
  );
end $$;
revoke all on function public.business_os_periode(date, date) from public, anon;
grant execute on function public.business_os_periode(date, date) to authenticated;

create or replace function public.business_os_vergelijk()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_vandaag date := (now() at time zone 'Europe/Amsterdam')::date;
  v_m0 date := date_trunc('month', v_vandaag)::date;
  v_m1 date := (date_trunc('month', v_vandaag) - interval '1 month')::date;
  v_m3 date := (date_trunc('month', v_vandaag) - interval '3 months')::date;
  v_w0 date := date_trunc('week', v_vandaag)::date;
  v_dag int := v_vandaag - date_trunc('month', v_vandaag)::date + 1;
begin
  return jsonb_build_object(
    'vandaag', v_vandaag,
    'deze_maand', business_os_periode(v_m0, v_vandaag + 1),
    'vorige_maand_zelfde_dagen', business_os_periode(v_m1, least(v_m1 + v_dag, v_m0)),
    'vorige_maand', business_os_periode(v_m1, v_m0),
    'drie_maanden_totaal', business_os_periode(v_m3, v_m0),
    'deze_week', business_os_periode(v_w0, v_vandaag + 1),
    'vorige_week', business_os_periode(v_w0 - 7, v_w0)
  );
end $$;
revoke all on function public.business_os_vergelijk() from public, anon;
grant execute on function public.business_os_vergelijk() to authenticated;

-- Duimpjes (30 okt 2026): Kerstens oordeel op antwoorden en beelden; de
-- groeironde leest de laatste 24 uur en werkt de skills bij.
create table if not exists public.business_os_feedback (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  soort text not null check (soort in ('antwoord', 'visueel')),
  oordeel text not null check (oordeel in ('goed', 'slecht')),
  vraag text, inhoud text, visueel jsonb,
  created_at timestamptz not null default now()
);
alter table public.business_os_feedback enable row level security;
create policy coach_eigen_feedback on public.business_os_feedback for all to authenticated
  using (coach_id = auth.uid()) with check (coach_id = auth.uid());

-- Klanten-tabje (30 okt 2026): business_os_klanten() = alle lopende klanten
-- (zelfde regel als trajectLoopt: periode ingesteld, gestart, niet paused/
-- ended), per klant check-in deze week (week begint op vrijdag, zoals
-- CheckinService), ongeziene check-ins (coach_gezien_at leeg), gewicht nu en
-- 14 dagen terug, dagen gewogen, stappen, trainingsdagen (gestarte sessies,
-- zoals progressieWeek), volgende call, open afspraken en een aandacht-score.
create or replace function public.business_os_klanten()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_team uuid[];
  v_vandaag date := (now() at time zone 'Europe/Amsterdam')::date;
  v_vrijdag date;
  v_res jsonb;
begin
  if auth.uid() is null then raise exception 'niet ingelogd'; end if;
  if public.get_my_portal_role() not in ('coach', 'both') then raise exception 'alleen voor coaches'; end if;
  v_team := team_coach_ids(auth.uid());
  v_vrijdag := v_vandaag - ((extract(isodow from v_vandaag)::int - 5 + 7) % 7);
  select coalesce(jsonb_agg(k order by (k->>'aandacht')::int desc, k->>'naam'), '[]'::jsonb) into v_res
  from (
    select jsonb_build_object(
      'id', c.id,
      'naam', trim(coalesce(c.first_name, '') || ' ' || coalesce(c.last_name, '')),
      'week', least(c.coaching_total_weeks, (v_vandaag - c.coaching_start_date) / 7 + 1),
      'weken_totaal', c.coaching_total_weeks,
      'periode_eindigt', c.coaching_start_date + c.coaching_total_weeks * 7,
      'dagen_tot_einde', (c.coaching_start_date + c.coaching_total_weeks * 7) - v_vandaag,
      'op_slot', c.account_locked_at is not null,
      'checkin_deze_week', ci.deze_week,
      'laatste_checkin', ci.laatste,
      'checkins_ongezien', ci.ongezien,
      'laatste_checkin_id', ci.laatste_id,
      'gewicht_nu', w.nu, 'gewicht_14d_geleden', w.toen, 'gewogen_7d', w.dagen7,
      'stappen_gem_7d', s.gem, 'stappendoel', c.step_goal,
      'trainingen_7d', t.n,
      'volgende_call', cl.volgende,
      'open_afspraken', ai.n,
      'aandacht', (case when not coalesce(ci.deze_week, false) then 2 else 0 end)
                + (case when coalesce(ci.ongezien, 0) > 0 then 2 else 0 end)
                + (case when coalesce(w.dagen7, 0) = 0 then 1 else 0 end)
                + (case when coalesce(t.n, 0) = 0 then 1 else 0 end)
                + (case when (c.coaching_start_date + c.coaching_total_weeks * 7) - v_vandaag between -30 and 14 then 1 else 0 end)
    ) k
    from clients c
    left join lateral (
      select bool_or(x.checkin_date >= v_vrijdag and x.status in ('submitted', 'reviewed')) deze_week,
             max(x.checkin_date) filter (where x.status in ('submitted', 'reviewed')) laatste,
             count(*) filter (where x.status = 'submitted' and x.coach_gezien_at is null) ongezien,
             (array_agg(x.id order by x.checkin_date desc) filter (where x.status in ('submitted', 'reviewed')))[1] laatste_id
      from client_checkins x where x.client_id = c.id
    ) ci on true
    left join lateral (
      select (array_agg(l.weight order by l.date desc))[1] nu,
             (array_agg(l.weight order by l.date desc) filter (where l.date <= v_vandaag - 14))[1] toen,
             count(distinct l.date) filter (where l.date > v_vandaag - 7) dagen7
      from weight_challenge_logs l where l.client_id = c.id and l.date > v_vandaag - 60
    ) w on true
    left join lateral (
      select round(avg(sl.steps)) gem from client_step_logs sl where sl.client_id = c.id and sl.date > v_vandaag - 7
    ) s on true
    left join lateral (
      select count(distinct ws.workout_date) n from workout_sessions ws where ws.client_id = c.id and ws.workout_date > v_vandaag - 7
    ) t on true
    left join lateral (
      select min(cc.scheduled_date) volgende from client_calls cc
      where cc.client_id = c.id and cc.scheduled_date >= now() and cc.canceled_at is null
    ) cl on true
    left join lateral (
      select count(*) n from client_action_items a where a.client_id = c.id and coalesce(a.status, 'open') not in ('done', 'completed', 'afgerond')
    ) ai on true
    where c.coach_id = any(v_team)
      and coalesce(c.coaching_status, 'active') not in ('paused', 'ended')
      and c.coaching_start_date is not null and c.coaching_total_weeks is not null
      and c.coaching_start_date <= v_vandaag
  ) q;
  return jsonb_build_object('vandaag', v_vandaag, 'checkin_week_vanaf', v_vrijdag, 'klanten', v_res);
end $$;
revoke all on function public.business_os_klanten() from public, anon;
grant execute on function public.business_os_klanten() to authenticated;
