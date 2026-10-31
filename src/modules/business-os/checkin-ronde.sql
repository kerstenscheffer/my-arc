-- Check-in ronde (31 okt 2026): Kersten loopt op woensdag en zaterdag al zijn
-- klanten langs en stuurt per klant zelf een WhatsApp-appje. Gino zet per
-- klant een item klaar (groep, suggesties, bericht); Kersten bewerkt,
-- kopieert en vinkt 'Verstuurd' aan (CheckinRonde.jsx in het Klanten-tabje).
-- Er gaat nooit automatisch iets naar de klant.
create table if not exists public.checkin_ronde_items (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid default auth.uid(),
  client_id uuid references public.clients(id),
  ronde_datum date not null,
  groep text check (groep in ('aandacht', 'vervolg', 'goed', 'gepauzeerd')),
  suggesties jsonb,          -- {compliment, verbeterpunt, signalen: [..]}
  bericht text,              -- Gino's voorstel
  bewerkt_bericht text,      -- Kerstens versie (wint van bericht)
  verstuurd_at timestamptz,
  created_at timestamptz default now(),
  unique (client_id, ronde_datum)
);
alter table public.checkin_ronde_items enable row level security;
drop policy if exists ronde_select on public.checkin_ronde_items;
create policy ronde_select on public.checkin_ronde_items for select to authenticated
  using (coach_id = any(team_coach_ids(auth.uid())));
drop policy if exists ronde_insert on public.checkin_ronde_items;
create policy ronde_insert on public.checkin_ronde_items for insert to authenticated
  with check (coach_id = any(team_coach_ids(auth.uid())));
drop policy if exists ronde_update on public.checkin_ronde_items;
create policy ronde_update on public.checkin_ronde_items for update to authenticated
  using (coach_id = any(team_coach_ids(auth.uid()))) with check (coach_id = any(team_coach_ids(auth.uid())));
create index if not exists checkin_ronde_items_datum on public.checkin_ronde_items (ronde_datum desc);

-- Data per klant voor de ronde: alleen clients.status = 'active' (anders dan
-- business_os_klanten), gepauzeerd telt mee met vlag. Testaccount eruit.
create or replace function public.business_os_ronde_data()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_team uuid[];
  v_vandaag date := (now() at time zone 'Europe/Amsterdam')::date;
  v_res jsonb;
begin
  if auth.uid() is null then raise exception 'niet ingelogd'; end if;
  if public.get_my_portal_role() not in ('coach', 'both') then raise exception 'alleen voor coaches'; end if;
  v_team := team_coach_ids(auth.uid());
  select coalesce(jsonb_agg(k order by k->>'naam'), '[]'::jsonb) into v_res
  from (
    select jsonb_build_object(
      'id', c.id,
      'naam', trim(coalesce(c.first_name, '') || ' ' || coalesce(c.last_name, '')),
      'coaching_status', coalesce(c.coaching_status, 'active'),
      'gepauzeerd', c.coaching_status = 'paused',
      'week', case when c.coaching_start_date is not null then
        greatest(1, least(c.coaching_total_weeks, (v_vandaag - c.coaching_start_date - coalesce(c.coaching_paused_days_total, 0)) / 7 + 1)) end,
      'weken_totaal', c.coaching_total_weeks,
      'trajecteinde', c.coaching_start_date + c.coaching_total_weeks * 7 + coalesce(c.coaching_paused_days_total, 0),
      'dagen_tot_einde', (c.coaching_start_date + c.coaching_total_weeks * 7 + coalesce(c.coaching_paused_days_total, 0)) - v_vandaag,
      'gewicht_gem_7d', w.gem_nu, 'gewicht_gem_vorige_7d', w.gem_vorig,
      'gewicht_start', w0.weight, 'gewicht_start_datum', w0.date,
      'gewogen_7d', w.dagen7,
      'trainingen_7d', t.n,
      'stappen_gem_7d', s.gem, 'stappendoel', c.step_goal,
      'checkins', ci.lijst,
      'oefening_opmerkingen', op.lijst,
      'laatste_contact', rc.laatst
    ) k
    from clients c
    left join lateral (
      select round(avg(l.weight) filter (where l.date > v_vandaag - 7), 1) gem_nu,
             round(avg(l.weight) filter (where l.date <= v_vandaag - 7 and l.date > v_vandaag - 14), 1) gem_vorig,
             count(distinct l.date) filter (where l.date > v_vandaag - 7) dagen7
      from weight_challenge_logs l where l.client_id = c.id and l.date > v_vandaag - 14
    ) w on true
    left join lateral (
      select l.weight, l.date from weight_challenge_logs l
      where l.client_id = c.id and l.date >= coalesce(c.coaching_start_date, '1900-01-01'::date)
      order by l.date, l.created_at limit 1
    ) w0 on true
    left join lateral (
      select count(distinct ws.workout_date) n from workout_sessions ws where ws.client_id = c.id and ws.workout_date > v_vandaag - 7
    ) t on true
    left join lateral (
      select round(avg(sl.steps)) gem from client_step_logs sl where sl.client_id = c.id and sl.date > v_vandaag - 7
    ) s on true
    left join lateral (
      select jsonb_agg(jsonb_build_object(
        'checkin_date', x.checkin_date, 'hoe_gaat_het', x.hoe_gaat_het, 'wins', x.wins, 'struggles', x.struggles,
        'trots_op', x.trots_op, 'kon_beter', x.kon_beter, 'vastgelopen', x.vastgelopen,
        'hulp_van_coach', x.hulp_van_coach, 'komende_week', x.komende_week) order by x.checkin_date desc) lijst
      from (select * from client_checkins y where y.client_id = c.id and y.status in ('submitted', 'reviewed')
            order by y.checkin_date desc limit 2) x
    ) ci on true
    left join lateral (
      select jsonb_agg(jsonb_build_object('datum', o.workout_date, 'oefening', o.exercise_name, 'opmerking', o.notes)
             order by o.workout_date desc) lijst
      from (select ws.workout_date, wp.exercise_name, wp.notes
            from workout_progress wp join workout_sessions ws on ws.id = wp.session_id
            where ws.client_id = c.id and ws.workout_date > v_vandaag - 10 and nullif(trim(wp.notes), '') is not null
            order by ws.workout_date desc limit 20) o
    ) op on true
    left join lateral (
      select max(r.verstuurd_at) laatst from checkin_ronde_items r where r.client_id = c.id
    ) rc on true
    where c.coach_id = any(v_team)
      and c.status = 'active'
      and c.id <> '7e176d2d-a85b-4132-a1e3-59b1ddd9816d'
  ) q;
  return jsonb_build_object('vandaag', v_vandaag, 'klanten', v_res);
end $$;
revoke all on function public.business_os_ronde_data() from public, anon;
grant execute on function public.business_os_ronde_data() to authenticated;
