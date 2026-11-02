-- src/modules/business-os/business-os-wijzigingen.sql
--
-- Gino voert gewone wijzigingen zelf uit (2 nov 2026). Alleen gevoelige acties
-- vragen nog toestemming. De poort zit HIER, niet in de frontend of de prompt:
--
--   business_os_wijziging_uitvoeren(voorstel, opdracht_id, bevestigd)
--     → PA en edge function roepen hem aan zonder bevestigd: alles op of buiten
--       de bewaakte lijst komt terug als 'toestemming_nodig', er gebeurt niets.
--     → Alleen de Toestaan-knop geeft bevestigd = true.
--     → Security invoker: schrijft met Kerstens eigen RLS, nooit ruimer.
--   business_os_wijziging_ongedaan(id)      → oude waarden terug / rij markeren
--   business_os_code_starten(tekst, toestemming) → code-opdracht start, of niet
--
-- Standaard = toestemming vragen: automatisch mag alleen wat op de lijst
-- 'veilig' staat, zonder meldingstrigger. Nieuwe tabel = dus vragen.
-- Alleen toevoegen: oude app-versies raken niets.

create table if not exists public.business_os_wijzigingen (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null default auth.uid(),
  opdracht_id uuid,
  tabel text not null,
  actie text not null check (actie in ('update', 'insert')),
  uitleg text,
  filters jsonb,
  pk_kolom text not null,
  oude_waarden jsonb not null default '[]'::jsonb,   -- [{ pk, waarden: { kolom: oud } }]
  nieuwe_waarden jsonb not null default '[]'::jsonb, -- update: [{ pk, waarden }], insert: hele rijen
  ingevoegde_ids jsonb not null default '[]'::jsonb,
  aantal integer not null,
  bevestigd boolean not null default false,          -- true = via de Toestaan-knop
  ongedaan_kan text,                                 -- null = kan; anders de reden waarom niet
  hersteld integer,
  overgeslagen integer,
  created_at timestamptz not null default now(),
  ongedaan_at timestamptz
);

create index if not exists business_os_wijzigingen_coach on public.business_os_wijzigingen (coach_id, created_at desc);

alter table public.business_os_wijzigingen enable row level security;

drop policy if exists coach_team_wijzigingen on public.business_os_wijzigingen;
create policy coach_team_wijzigingen on public.business_os_wijzigingen
  for all to authenticated
  using (public.get_my_portal_role() in ('coach', 'both') and (coach_id = auth.uid() or coach_id = any (public.team_coach_ids(auth.uid()))))
  with check (public.get_my_portal_role() in ('coach', 'both') and (coach_id = auth.uid() or coach_id = any (public.team_coach_ids(auth.uid()))));

-- Geen delete: het log blijft staan.
grant select, insert, update on public.business_os_wijzigingen to authenticated;

-- Bewaakte lijst. Geeft de reden terug als er toestemming nodig is, anders null.
create or replace function public.business_os_wijziging_bewaakt(
  p_tabel text, p_actie text default 'update', p_velden text[] default '{}', p_rijen jsonb default null
)
returns text language plpgsql stable set search_path = public as $$
declare
  -- Alles wat een klant of lead iets kan sturen of laten zien als bericht.
  v_melding text[] := array[
    'notifications', 'coach_notifications', 'notification_schedules', 'notification_schedule_runs',
    'notification_rules', 'notification_rule_history', 'notification_settings', 'call_notifications',
    'photo_comment_notifications', 'device_push_tokens', 'coach_messages', 'dm_messages', 'dm_user_messages',
    'dm_conversations', 'journey_messages', 'journey_client_calls', 'meal_plan_communications', 'lead_pdf_mails',
    'challenge_prequal_emails', 'outreach_sends', 'support_messages', 'photo_comments', 'photo_reactions',
    'video_assignments', 'client_checkins', 'checkin_ronde_items', 'client_questions', 'client_feedback',
    'call_requests', 'client_calls', 'funnel_analytics', 'daily_welcomes', 'app_review_prompts'
  ];
  -- Plannen van klanten (en clients zelf: macro's, schema, slot, meldingstrigger).
  v_plan text[] := array[
    'clients', 'workout_schemas', 'workout_plans', 'client_workouts', 'custom_workouts', 'workout_day_templates',
    'workout_week_recepten', 'week_templates', 'client_week_schedules', 'workout_schedule_log',
    'client_meal_plans', 'nutrition_plans', 'client_day_overrides', 'client_day_templates', 'client_plan_proposals',
    'client_plan_changes', 'client_plan_versies', 'client_saved_days', 'client_exercise_overrides',
    'client_swap_options', 'client_cardio_plan', 'client_phases', 'client_call_plans', 'client_goals',
    'client_agenda_blocks', 'client_agenda_overrides', 'supplement_plans', 'plan_library', 'meal_plan_templates',
    'coach_meal_templates', 'ai_day_templates', 'ai_meals', 'ai_ingredients', 'exercise_goals'
  ];
  -- Dingen die buiten de app gebeuren of geld raken.
  v_live text[] := array[
    'content_autopilot', 'meta_capi_events', 'payments', 'subscriptions', 'payment_plans', 'partner_payouts',
    'ad_spend', 'business_os_opdrachten', 'business_os_wijzigingen'
  ];
  -- Automatisch: alleen eigen werk van de coach, geen klant of lead ziet het.
  v_veilig text[] := array[
    'productivity_tasks', 'productivity_sections', 'productivity_week_goals', 'productivity_weekly_wins',
    'productivity_reflections', 'productivity_time_logs', 'productivity_week_reports', 'task_logs',
    'content_items', 'content_doelen', 'content_checklist', 'content_formats', 'content_sections', 'content_pieces',
    'content_batches', 'batch_items', 'output_content', 'output_day_items', 'output_problems', 'output_week_plans',
    'output_pdfs', 'call_leads', 'lead_movements', 'lead_notes', 'lead_campaign_tags', 'lead_kpi_targets',
    'lead_templates', 'lead_sections', 'agenda_blocks', 'business_os_skills', 'business_os_geheugen',
    'business_os_herinneringen', 'business_os_schermen', 'business_os_experimenten', 'business_os_projecten',
    'business_os_geldplan', 'business_os_tijd_regels', 'app_issues', 'ideas', 'quick_notes', 'coach_daily_checks',
    'coach_action_snoozes', 'coach_actions_dismissed', 'sales_scripts', 'sales_pieces'
  ];
  -- Gecontroleerd: deze triggers melden alleen aan de coach of hebben hieronder een eigen regel.
  v_trigger_ok text[] := array['call_leads.trg_notify_new_ad_lead', 'lead_movements.meta_purchase'];
  v_trigger text;
  v_rij jsonb;
begin
  if p_tabel = any (v_melding) then return 'kan een klant of lead een melding of bericht sturen'; end if;
  if p_tabel = any (v_plan) then return 'raakt het plan of account van een klant'; end if;
  if p_tabel = any (v_live) then return 'gebeurt buiten de app of raakt geld'; end if;
  if not (p_tabel = any (v_veilig)) then return 'onbekende tabel, dus eerst vragen'; end if;

  -- Vangnet: ook een later toegevoegde trigger die meldt of plannen raakt telt.
  select string_agg(g.tgname, ', ') into v_trigger
    from pg_trigger g
    join pg_class c on c.oid = g.tgrelid
    join pg_proc f on f.oid = g.tgfoid
   where c.relnamespace = 'public'::regnamespace and c.relname = p_tabel
     and not g.tgisinternal and g.tgenabled <> 'D'
     and not (p_tabel || '.' || g.tgname = any (v_trigger_ok))
     and f.prosrc ~* 'notifications?|send-push|net\.http|http_post|send-email|resend|whatsapp|twilio|meta_capi_queue|workout_schemas|client_meal_plans|client_day_overrides|client_plan_proposals|business_os_opdrachten';
  if v_trigger is not null then return 'tabel heeft een meldingstrigger (' || v_trigger || ')'; end if;

  if p_tabel = 'content_items' and exists (select 1 from unnest(p_velden) k where k ~ '^(autopilot|ig_|posted)') then
    return 'kan live op Instagram plaatsen';
  end if;

  if p_actie = 'update' then
    -- Zacht verwijderen telt als verwijderen, en dat mag niet vanzelf.
    if exists (select 1 from unnest(p_velden) k where k in ('deleted_at', 'reverted_at')) then
      return 'verwijdert of draait terug';
    end if;
    -- Sale of orderwaarde gaat door naar Meta (trigger meta_purchase).
    if p_tabel = 'lead_movements' and exists (select 1 from unnest(p_velden) k where k in ('to_section_title', 'order_value')) then
      return 'raakt een sale of orderwaarde';
    end if;
  elsif p_tabel = 'lead_movements' then
    for v_rij in select * from jsonb_array_elements(coalesce(p_rijen, '[]'::jsonb)) loop
      if coalesce(v_rij->>'to_section_title', '') ilike '%sale%' or public._meta_is_sale_titel(v_rij->>'to_section_title') then
        return 'boekt een sale';
      end if;
    end loop;
  end if;

  return null;
end $$;

revoke all on function public.business_os_wijziging_bewaakt(text, text, text[], jsonb) from public, anon;
grant execute on function public.business_os_wijziging_bewaakt(text, text, text[], jsonb) to authenticated;

-- Ingevoegde rijen terugdraaien kan alleen waar een bestaande conventie is
-- (geen deletes via de chat). Geeft het SET-stuk, of null.
create or replace function public.business_os_ongedaan_markering(p_tabel text)
returns text language sql immutable as $$
  select case p_tabel
    when 'lead_movements' then 'reverted_at = now()'
    when 'call_leads' then 'deleted_at = now()'
    when 'lead_notes' then 'deleted_at = now()'
    when 'app_issues' then 'deleted_at = now()'
    when 'business_os_skills' then 'actief = false'
    when 'business_os_geheugen' then 'actief = false'
    when 'business_os_herinneringen' then 'klaar_at = now()'
  end
$$;

revoke all on function public.business_os_ongedaan_markering(text) from public, anon;
grant execute on function public.business_os_ongedaan_markering(text) to authenticated;

create or replace function public.business_os_wijziging_uitvoeren(
  p_voorstel jsonb, p_opdracht_id uuid default null, p_bevestigd boolean default false
)
returns jsonb language plpgsql volatile security invoker set search_path = public as $$
declare
  v_tabel text := p_voorstel->>'tabel';
  v_actie text := p_voorstel->>'actie';
  v_velden jsonb := p_voorstel->'velden';
  v_rijen jsonb := p_voorstel->'rijen';
  v_filters jsonb := coalesce(p_voorstel->'filters', '[]'::jsonb);
  v_kolommen text[];
  v_rel regclass;
  v_pk text[];
  v_reden text;
  v_where text[] := '{}';
  v_clausule text;
  v_f jsonb;
  v_w jsonb;
  v_kol text;
  v_op text;
  v_aantal integer;
  v_oud jsonb := '[]'::jsonb;
  v_nieuw jsonb := '[]'::jsonb;
  v_ids jsonb := '[]'::jsonb;
  v_pks text[];
  v_rij jsonb;
  v_cols text;
  v_uit jsonb;
  v_ongedaan text;
  v_log uuid;
begin
  if coalesce(public.get_my_portal_role(), '') not in ('coach', 'both') then
    return jsonb_build_object('status', 'fout', 'fout', 'alleen voor coaches');
  end if;
  if v_actie is null or v_actie not in ('update', 'insert') then
    return jsonb_build_object('status', 'fout', 'fout', 'alleen update en insert');
  end if;
  if v_tabel is null or v_tabel !~ '^[a-z_][a-z0-9_]*$' then
    return jsonb_build_object('status', 'fout', 'fout', 'ongeldige tabelnaam');
  end if;

  if v_actie = 'update' then
    if v_velden is null or jsonb_typeof(v_velden) <> 'object' or v_velden = '{}'::jsonb then
      return jsonb_build_object('status', 'fout', 'fout', 'geen velden om te wijzigen');
    end if;
    select array_agg(k) into v_kolommen from jsonb_object_keys(v_velden) k;
  else
    if v_rijen is null or jsonb_typeof(v_rijen) <> 'array' or jsonb_array_length(v_rijen) = 0 then
      return jsonb_build_object('status', 'fout', 'fout', 'geen rijen om toe te voegen');
    end if;
    if jsonb_array_length(v_rijen) > 500 then
      return jsonb_build_object('status', 'fout', 'fout', 'te veel rijen, maximaal 500');
    end if;
    if exists (select 1 from jsonb_array_elements(v_rijen) r where jsonb_typeof(r) <> 'object' or r = '{}'::jsonb) then
      return jsonb_build_object('status', 'fout', 'fout', 'lege of ongeldige rij');
    end if;
    select array_agg(distinct k) into v_kolommen from jsonb_array_elements(v_rijen) r, jsonb_object_keys(r) k;
  end if;

  -- De poort. Zonder klik komt niets op of buiten de lijst hier voorbij.
  v_reden := public.business_os_wijziging_bewaakt(v_tabel, v_actie, v_kolommen, v_rijen);
  if not p_bevestigd then
    if v_reden is null and p_voorstel->>'toestemming' = 'true' then v_reden := 'Gino vraagt het zelf'; end if;
    if v_reden is not null then
      return jsonb_build_object('status', 'toestemming_nodig', 'reden', v_reden);
    end if;
  end if;

  v_rel := to_regclass('public.' || quote_ident(v_tabel));
  if v_rel is null or (select relkind from pg_class where oid = v_rel) <> 'r' then
    return jsonb_build_object('status', 'fout', 'fout', 'tabel bestaat niet');
  end if;
  select k into v_kol from unnest(v_kolommen) k
   where not exists (select 1 from pg_attribute a where a.attrelid = v_rel and a.attname = k and a.attnum > 0 and not a.attisdropped)
   limit 1;
  if v_kol is not null then
    return jsonb_build_object('status', 'fout', 'fout', 'kolom bestaat niet: ' || v_kol);
  end if;
  select array_agg(a.attname::text) into v_pk
    from pg_index i join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any (i.indkey)
   where i.indrelid = v_rel and i.indisprimary;
  if coalesce(array_length(v_pk, 1), 0) <> 1 then
    if not p_bevestigd then
      return jsonb_build_object('status', 'toestemming_nodig', 'reden', 'tabel heeft geen enkelvoudige primary key, dus niet terug te draaien');
    end if;
    return jsonb_build_object('status', 'fout', 'fout', 'tabel heeft geen enkelvoudige primary key');
  end if;

  if v_actie = 'update' then
    if jsonb_typeof(v_filters) <> 'array' or jsonb_array_length(v_filters) = 0 then
      return jsonb_build_object('status', 'fout', 'fout', 'een update zonder filter mag niet');
    end if;
    for v_f in select * from jsonb_array_elements(v_filters) loop
      v_kol := v_f->>'kolom';
      v_op := v_f->>'op';
      v_w := coalesce(v_f->'waarde', 'null'::jsonb);
      if not exists (select 1 from pg_attribute a where a.attrelid = v_rel and a.attname = v_kol and a.attnum > 0 and not a.attisdropped) then
        return jsonb_build_object('status', 'fout', 'fout', 'filterkolom bestaat niet: ' || coalesce(v_kol, '?'));
      end if;
      if v_op = 'in' then
        v_clausule := format('%I::text = any (%L::text[])', v_kol,
          (select array_agg(x) from jsonb_array_elements_text(case when jsonb_typeof(v_w) = 'array' then v_w else jsonb_build_array(v_w) end) x));
      elsif v_op = 'is' then
        if jsonb_typeof(v_w) not in ('null', 'boolean') then
          return jsonb_build_object('status', 'fout', 'fout', 'is mag alleen met null, true of false');
        end if;
        v_clausule := format('%I is %s', v_kol, case jsonb_typeof(v_w) when 'null' then 'null' else v_w #>> '{}' end);
      elsif v_op = 'ilike' then
        v_clausule := format('%I::text ilike %L', v_kol, v_w #>> '{}');
      elsif v_op in ('eq', 'neq', 'lt', 'lte', 'gt', 'gte') then
        v_clausule := format('%I %s %L', v_kol,
          case v_op when 'eq' then '=' when 'neq' then '<>' when 'lt' then '<' when 'lte' then '<=' when 'gt' then '>' else '>=' end,
          v_w #>> '{}');
      else
        return jsonb_build_object('status', 'fout', 'fout', 'onbekende filter: ' || coalesce(v_op, '?'));
      end if;
      v_where := v_where || v_clausule;
    end loop;
  end if;

  -- Alles of niets: een fout hieronder draait het hele blok terug (ook het log).
  begin
    if v_actie = 'update' then
      execute format('select count(*) from public.%I where %s', v_tabel, array_to_string(v_where, ' and ')) into v_aantal;
      if v_aantal = 0 then
        return jsonb_build_object('status', 'fout', 'fout', 'geen rijen onder dit filter');
      end if;
      if v_aantal > 500 then
        return jsonb_build_object('status', 'fout', 'fout', format('te veel rijen (%s), maximaal 500', v_aantal));
      end if;

      execute format($q$
        select coalesce(jsonb_agg(jsonb_build_object('pk', r.j->>%1$L, 'waarden',
                 (select jsonb_object_agg(k, r.j->k) from unnest(%2$L::text[]) k))), '[]'::jsonb),
               coalesce(array_agg(r.j->>%1$L), '{}')
        from (select to_jsonb(t) j from (select * from public.%3$I where %4$s for update) t) r
      $q$, v_pk[1], v_kolommen, v_tabel, array_to_string(v_where, ' and ')) into v_oud, v_pks;

      select string_agg(quote_ident(k), ', ') into v_cols from unnest(v_kolommen) k;
      execute format($q$
        with u as (
          update public.%1$I t set (%2$s) = (select %2$s from jsonb_populate_record(null::public.%1$I, $1))
           where t.%3$I::text = any ($2) returning t.*
        )
        select coalesce(jsonb_agg(jsonb_build_object('pk', to_jsonb(u)->>%3$L, 'waarden',
                 (select jsonb_object_agg(k, to_jsonb(u)->k) from unnest($3) k))), '[]'::jsonb), count(*)::int
        from u
      $q$, v_tabel, v_cols, v_pk[1]) into v_nieuw, v_aantal using v_velden, v_pks, v_kolommen;
      if v_aantal = 0 then
        return jsonb_build_object('status', 'fout', 'fout', 'geen rijen die je mag aanpassen');
      end if;
    else
      for v_rij in select * from jsonb_array_elements(v_rijen) loop
        select string_agg(quote_ident(k), ', ') into v_cols from jsonb_object_keys(v_rij) k;
        execute format($q$
          insert into public.%1$I as t (%2$s)
          select %2$s from jsonb_populate_record(null::public.%1$I, $1) returning to_jsonb(t)
        $q$, v_tabel, v_cols) into v_uit using v_rij;
        v_nieuw := v_nieuw || jsonb_build_array(v_uit);
        v_ids := v_ids || jsonb_build_array(v_uit->>v_pk[1]);
      end loop;
      v_aantal := jsonb_array_length(v_rijen);
    end if;

    -- Terugdraaien mag zelf nooit een melding kunnen veroorzaken.
    v_ongedaan := case
      when v_reden is not null then 'Dit was een bewaakte wijziging: terugdraaien kan weer een melding sturen. Doe het in de app.'
      when v_actie = 'insert' and public.business_os_ongedaan_markering(v_tabel) is null
        then 'Nieuwe rijen in ' || v_tabel || ' kunnen niet netjes terug: verwijderen kan niet via de chat.'
    end;

    insert into public.business_os_wijzigingen
      (opdracht_id, tabel, actie, uitleg, filters, pk_kolom, oude_waarden, nieuwe_waarden, ingevoegde_ids, aantal, bevestigd, ongedaan_kan)
    values
      (p_opdracht_id, v_tabel, v_actie, left(p_voorstel->>'uitleg', 300), v_filters, v_pk[1], v_oud, v_nieuw, v_ids, v_aantal, p_bevestigd, v_ongedaan)
    returning id into v_log;
  exception when others then
    return jsonb_build_object('status', 'fout', 'fout', sqlerrm);
  end;

  return jsonb_build_object('status', 'uitgevoerd', 'wijziging_id', v_log, 'aantal', v_aantal, 'ongedaan_kan', v_ongedaan);
end $$;

revoke all on function public.business_os_wijziging_uitvoeren(jsonb, uuid, boolean) from public, anon;
grant execute on function public.business_os_wijziging_uitvoeren(jsonb, uuid, boolean) to authenticated;

create or replace function public.business_os_wijziging_ongedaan(p_id uuid)
returns jsonb language plpgsql volatile security invoker set search_path = public as $$
declare
  v public.business_os_wijzigingen;
  v_kolommen text[];
  v_cols text;
  v_reden text;
  v_markering text;
  v_r jsonb;
  v_n integer;
  v_hersteld integer := 0;
  v_over integer := 0;
begin
  if coalesce(public.get_my_portal_role(), '') not in ('coach', 'both') then
    return jsonb_build_object('status', 'fout', 'fout', 'alleen voor coaches');
  end if;
  select * into v from public.business_os_wijzigingen where id = p_id for update;
  if not found then return jsonb_build_object('status', 'fout', 'fout', 'wijziging niet gevonden'); end if;
  if v.ongedaan_at is not null then return jsonb_build_object('status', 'al_ongedaan'); end if;
  if v.ongedaan_kan is not null then return jsonb_build_object('status', 'kan_niet', 'reden', v.ongedaan_kan); end if;

  begin
    if v.actie = 'update' then
      select array_agg(k) into v_kolommen from jsonb_object_keys(v.oude_waarden->0->'waarden') k;
      -- Is de tabel of het veld intussen bewaakt (nieuwe trigger)? Dan niet vanzelf terug.
      v_reden := public.business_os_wijziging_bewaakt(v.tabel, 'update', v_kolommen, null);
      if v_reden is not null then return jsonb_build_object('status', 'kan_niet', 'reden', v_reden); end if;
      select string_agg(quote_ident(k), ', ') into v_cols from unnest(v_kolommen) k;
      for v_r in select * from jsonb_array_elements(v.oude_waarden) loop
        -- Alleen terugzetten als er nog staat wat wij schreven: anders overschrijven we nieuwer werk.
        execute format($q$
          update public.%1$I t set (%2$s) = (select %2$s from jsonb_populate_record(null::public.%1$I, $1))
           where t.%3$I::text = $2
             and not exists (select 1 from unnest($4::text[]) k where k <> 'updated_at' and to_jsonb(t)->k is distinct from $3->k)
        $q$, v.tabel, v_cols, v.pk_kolom)
        using v_r->'waarden', v_r->>'pk',
          (select e->'waarden' from jsonb_array_elements(v.nieuwe_waarden) e where e->>'pk' = v_r->>'pk' limit 1), v_kolommen;
        get diagnostics v_n = row_count;
        if v_n > 0 then v_hersteld := v_hersteld + 1; else v_over := v_over + 1; end if;
      end loop;
    else
      v_reden := public.business_os_wijziging_bewaakt(v.tabel, 'update', '{}', null);
      if v_reden is not null then return jsonb_build_object('status', 'kan_niet', 'reden', v_reden); end if;
      v_markering := public.business_os_ongedaan_markering(v.tabel);
      if v_markering is null then return jsonb_build_object('status', 'kan_niet', 'reden', 'geen nette manier om deze rijen terug te draaien'); end if;
      execute format('update public.%I t set %s where t.%I::text = any ($1)', v.tabel, v_markering, v.pk_kolom)
        using (select array_agg(x) from jsonb_array_elements_text(v.ingevoegde_ids) x);
      get diagnostics v_hersteld = row_count;
      v_over := jsonb_array_length(v.ingevoegde_ids) - v_hersteld;
    end if;

    if v_hersteld = 0 then
      return jsonb_build_object('status', 'kan_niet', 'reden', 'de rijen zijn intussen veranderd, er is niets teruggezet');
    end if;
    update public.business_os_wijzigingen
       set ongedaan_at = now(), hersteld = v_hersteld, overgeslagen = v_over
     where id = p_id;
  exception when others then
    return jsonb_build_object('status', 'fout', 'fout', sqlerrm);
  end;

  return jsonb_build_object('status', 'ongedaan', 'hersteld', v_hersteld, 'overgeslagen', v_over);
end $$;

revoke all on function public.business_os_wijziging_ongedaan(uuid) from public, anon;
grant execute on function public.business_os_wijziging_ongedaan(uuid) to authenticated;

-- Code-opdracht: reden als hij een knop moet houden, anders null.
create or replace function public.business_os_opdracht_bewaakt(p_tekst text)
returns text language sql immutable as $$
  select case
    when p_tekst ~* 'melding|notificati|notification|push|e-?mail|mailtje|mailen|appje|whatsapp|\msms\M|bericht.{0,40}(klant|lead)|(klant|lead).{0,40}bericht'
      then 'kan een melding of bericht naar klanten sturen'
    when p_tekst ~* 'workout_schemas|assigned_schema_id|workout_schedule|client_meal_plans|client_day_overrides|client_plan_proposals|macro|(klant|client).{0,60}(plan|schema|voeding|workout|training)|(plan|schema|voeding|workout|training).{0,60}(klant|client)'
      then 'raakt een klantplan'
    when p_tekst ~* 'instagram.{0,80}(publiceer|publiceren|live|post|plaats|upload)|(publiceer|publiceren|post|plaats|live).{0,80}instagram|autopilot_status'
      then 'plaatst live op Instagram'
    when p_tekst ~* 'npm run release|vercel --prod|live-update'
      then 'zet live (npm run release)'
    when p_tekst ~* 'stripe.{0,80}(afschrijv|charge|incasso|factu|invoice|refund|betaling|payment)|(afschrijv|charge|incasso).{0,80}stripe'
      then 'echte Stripe-afschrijving'
  end
$$;

revoke all on function public.business_os_opdracht_bewaakt(text) from public, anon;
grant execute on function public.business_os_opdracht_bewaakt(text) to authenticated;

create or replace function public.business_os_code_starten(p_tekst text, p_toestemming boolean default false)
returns jsonb language plpgsql volatile security invoker set search_path = public as $$
declare
  v_reden text := public.business_os_opdracht_bewaakt(p_tekst);
  v_id uuid;
begin
  if coalesce(public.get_my_portal_role(), '') not in ('coach', 'both') then
    return jsonb_build_object('status', 'fout', 'fout', 'alleen voor coaches');
  end if;
  if coalesce(btrim(p_tekst), '') = '' then
    return jsonb_build_object('status', 'fout', 'fout', 'lege opdracht');
  end if;
  if v_reden is null and p_toestemming then v_reden := 'Gino vraagt het zelf'; end if;
  if v_reden is not null then
    return jsonb_build_object('status', 'toestemming_nodig', 'reden', v_reden);
  end if;
  insert into public.business_os_opdrachten (opdracht) values (p_tekst) returning id into v_id;
  return jsonb_build_object('status', 'gestart', 'opdracht_id', v_id);
exception when others then
  return jsonb_build_object('status', 'fout', 'fout', sqlerrm);
end $$;

revoke all on function public.business_os_code_starten(text, boolean) from public, anon;
grant execute on function public.business_os_code_starten(text, boolean) to authenticated;
