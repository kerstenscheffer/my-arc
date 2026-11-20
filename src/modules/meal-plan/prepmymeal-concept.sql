-- Prep My Meal in het conceptvoedingsplan na de intake (20 nov 2026).
--
-- De intake vraagt: "Wil je kant-en-klare maaltijden in je plan?" Het antwoord
-- staat in nutrition_preferences.practical_info ->> 'kant_en_klaar':
--   'nee' of leeg   niets verandert
--   'paar_keer'     3 lunches op werkdagen
--   'elke_werkdag'  de lunch van maandag t/m vrijdag
-- Geen nieuwe kolom: practical_info is jsonb, dus een oude intake of een oude
-- app-versie zonder dit antwoord werkt precies zoals voorheen (= nee).
--
-- Keten: maak_intake_voedingsconcept -> edge function intake-maaltijden (eigen
-- maaltijden; roept aan het eind zet_partner_maaltijden_in_concept aan) ->
-- concept-nakijker. Alleen concepten (is_active false, status 'concept').
--
-- Regels (zelfde marges als intake-maaltijden):
--   - kcal binnen 10% van de lunch die hij vervangt;
--   - eiwit hooguit 5 g lager, of de dag haalt het eiwitdoel nog voor 95%;
--   - de dag zakt niet onder 95% van het vetminimum.
--   - Past er niets, dan blijft de dag zoals hij was en staat het onder
--     "Zelf nakijken".
--   - Een bak van 2 porties (label bak_2_porties) komt op twee dagen.
--   - Eerst verschillende gerechten; pas als die op zijn komt er een terug.
--   - Allergie (volledig vermijden) anders dan gluten, een eigen opmerking bij
--     allergieën of halal: niets plaatsen, want de allergenen per gerecht staan
--     niet in de app. Gluten: alleen gerechten met label glutenvrij.
--     Intolerantie en "lust ik niet": filteren op de naam van het gerecht.

create or replace function public.partner_opsomming(a text[])
returns text language sql immutable as $$
  select case coalesce(array_length(a, 1), 0)
    when 0 then ''
    when 1 then a[1]
    else array_to_string(a[1:array_length(a, 1) - 1], ', ') || ' en ' || a[array_length(a, 1)]
  end
$$;

-- Past deze partnermaaltijd (k kcal, p eiwit, f vet) op de plek van een lunch
-- (lk, lp, lf), gegeven het dagtotaal eiwit en vet van nu (dp, df)?
create or replace function public.partner_maaltijd_past(
  k numeric, p numeric, f numeric,
  lk numeric, lp numeric, lf numeric,
  dp numeric, df numeric,
  eiwit_doel numeric, vet_min numeric)
returns boolean language sql immutable as $$
  select coalesce(
    lk > 0
    and abs(k - lk) <= lk * 0.10
    and (p >= lp - 5 or (coalesce(eiwit_doel, 0) > 0 and dp - lp + p >= eiwit_doel * 0.95))
    and (coalesce(vet_min, 0) <= 0 or df - lf + f >= least(vet_min * 0.95, df)),
    false)
$$;

-- Afstand tot de lunch die hij vervangt: kcal en eiwit eerst (te weinig eiwit
-- telt zwaarder), koolhydraten en vet licht.
create or replace function public.partner_maaltijd_score(
  k numeric, p numeric, c numeric, f numeric,
  lk numeric, lp numeric, lc numeric, lf numeric)
returns numeric language sql immutable as $$
  select power((k - lk) / lk, 2)
       + power((p - lp) / greatest(lp, 1), 2) * (case when p < lp then 1.5 else 0.4 end)
       + power((coalesce(c, 0) - coalesce(lc, 0)) / greatest(coalesce(lc, 0), 20), 2) * 0.15
       + power((coalesce(f, 0) - coalesce(lf, 0)) / greatest(coalesce(lf, 0), 8), 2) * 0.15
$$;

-- Kiest de partnermaaltijden voor een week. Schrijft niets weg: geeft de nieuwe
-- week_structure terug met wat er geplaatst is en wat niet.
create or replace function public.partner_maaltijden_kies(
  p_week jsonb,
  p_keuze text,
  p_eiwit_doel numeric default 0,
  p_vet_min numeric default 0,
  p_allergens jsonb default null,
  p_wishes jsonb default null)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_week jsonb := coalesce(p_week, '{}'::jsonb);
  v_dagen text[]; v_wd int[]; v_max int; v_n int;
  v_nl constant jsonb := '{"monday":"maandag","tuesday":"dinsdag","wednesday":"woensdag","thursday":"donderdag","friday":"vrijdag"}';
  lk numeric[] := '{}'; lp numeric[] := '{}'; lc numeric[] := '{}'; lf numeric[] := '{}';
  dp numeric[] := '{}'; df numeric[] := '{}';
  v_dp numeric; v_df numeric;
  v_toe uuid[]; v_ok uuid[];
  v_all jsonb := coalesce(p_allergens, '{}'::jsonb);
  v_wis jsonb := coalesce(p_wishes, '{}'::jsonb);
  v_vol text; v_bep text; v_eigen text; v_dieet text; v_niet text; v_rest text;
  v_gluten boolean := false;
  v_pat text[] := '{}'; v_weg text := ''; v_lust text[] := '{}'; v_into text[] := '{}';
  v_blok text;
  v_nakijken jsonb := '[]'::jsonb; v_keuzes jsonb := '[]'::jsonb;
  v_geplaatst int := 0; v_gepl jsonb := '[]'::jsonb; v_open text[] := '{}';
  v_lunch jsonb; v_meal jsonb; v_tot jsonb; v_dag jsonb;
  i int; j int; t text;
  r record;
begin
  if p_keuze = 'elke_werkdag' then
    v_dagen := array['monday', 'tuesday', 'wednesday', 'thursday', 'friday']; v_wd := array[1, 2, 3, 4, 5]; v_max := 5;
  elsif p_keuze = 'paar_keer' then
    -- Voorkeur maandag, woensdag, vrijdag; past daar niets, dan dinsdag of donderdag.
    v_dagen := array['monday', 'wednesday', 'friday', 'tuesday', 'thursday']; v_wd := array[1, 3, 5, 2, 4]; v_max := 3;
  else
    return jsonb_build_object('week_structure', v_week, 'gevraagd', 0, 'geplaatst', '[]'::jsonb, 'niet_gevuld', '[]'::jsonb,
      'nakijken', '[]'::jsonb, 'keuzes', '[]'::jsonb, 'geblokkeerd', null);
  end if;
  v_n := array_length(v_dagen, 1);
  v_toe := array_fill(null::uuid, array[v_n]);

  -- ── Wat de klant niet mag of niet lust ────────────────────────────────────
  v_vol := lower(regexp_replace(coalesce(v_all -> 'selected_allergens', 'null'::jsonb)::text, '[\[\]"]|null', '', 'g'));
  v_bep := lower(regexp_replace(coalesce(v_all -> 'intolerances', 'null'::jsonb)::text, '[\[\]"]|null', '', 'g'));
  v_eigen := nullif(trim(coalesce(v_all ->> 'custom_allergens', '')), '');
  if v_eigen ~* '^\W*(geen|nee|niets|niks|nvt|n\.v\.t\.?|none|no|x)?\W*$' then v_eigen := null; end if;
  v_dieet := lower(coalesce(v_all ->> 'diet_preference', ''));
  v_niet := lower(concat_ws(' ',
    regexp_replace(coalesce(v_wis -> 'niet_lekker', 'null'::jsonb)::text, '[\[\]"]|null', '', 'g'),
    v_wis ->> 'niet_lekker_overig', v_wis ->> 'absoluut_niet'));
  v_gluten := (v_vol || ' ' || v_bep) ~ 'gluten|tarwe|coeliak';

  v_rest := trim(both ', ' from regexp_replace(v_vol, '(gluten|tarwe|coeliakie?)\s*,?\s*', '', 'g'));
  if v_rest <> '' then
    v_blok := 'allergie (' || v_rest || ')';
  elsif v_eigen is not null then
    v_blok := 'opmerking bij allergieën: "' || left(v_eigen, 80) || '"';
  elsif v_dieet ~ 'halal' then
    v_blok := 'halal is bij deze gerechten niet na te gaan';
  end if;
  if v_blok is not null then
    return jsonb_build_object('week_structure', v_week, 'gevraagd', v_max, 'geplaatst', '[]'::jsonb, 'niet_gevuld', '[]'::jsonb,
      'nakijken', '[]'::jsonb, 'keuzes', '[]'::jsonb, 'geblokkeerd', v_blok);
  end if;

  -- Intolerantie (beperkt): op naam filteren, en de coach laten nakijken.
  if v_bep ~ 'lactose|zuivel|melk' then v_pat := v_pat || 'kaas|cheese|room|alfredo|yoghurt|lasagne|butter|gegratineerd|sp[aä]tzle'::text; v_into := v_into || 'lactose'::text; end if;
  if v_bep ~ 'noten' then v_pat := v_pat || 'noot|noten|cashew|amandel|pinda|pesto'::text; v_into := v_into || 'noten'::text; end if;
  if v_bep ~ 'pinda' then v_pat := v_pat || 'pinda|sat[eé]'::text; v_into := v_into || 'pinda'::text; end if;
  if v_bep ~ '\mei\M|eieren' then v_pat := v_pat || '\mei\M|eier|noedel|noodle|sp[aä]tzle|\mmie\M'::text; v_into := v_into || 'ei'::text; end if;
  if v_bep ~ '\mvis\M' then v_pat := v_pat || 'zalm|salmone|\mvis\M|tonijn|kabeljauw|garnal|paella'::text; v_into := v_into || 'vis'::text; end if;
  if v_bep ~ 'schaaldier' then v_pat := v_pat || 'garnal|scampi|paella|kreeft'::text; v_into := v_into || 'schaaldieren'::text; end if;
  if v_bep ~ 'soja' then v_pat := v_pat || 'soja|tofu|tempeh|teriyaki|asian|aziatisch|oosters|noodle|noedel|vegan|plantaardig'::text; v_into := v_into || 'soja'::text; end if;

  -- Lust ik niet: vaste keuzes uit de intake met hun bijnamen, plus de vrije tekst woord voor woord.
  if v_niet ~ '\mvis\M' then v_pat := v_pat || 'zalm|salmone|\mvis\M|tonijn|kabeljauw|garnal|paella'::text; v_lust := v_lust || 'vis'::text; end if;
  if v_niet ~ 'champignon|paddenstoel' then v_pat := v_pat || 'champignon|paddenstoel'::text; v_lust := v_lust || 'champignons'::text; end if;
  if v_niet ~ '\mei\M|eieren' then v_pat := v_pat || '\mei\M|eier'::text; v_lust := v_lust || 'eieren'::text; end if;
  if v_niet ~ 'tofu|tempeh' then v_pat := v_pat || 'tofu|tempeh|vegan|plantaardig'::text; v_lust := v_lust || 'tofu'::text; end if;
  if v_niet ~ '\mkip\M' then v_pat := v_pat || '\mkip|chicken'::text; v_lust := v_lust || 'kip'::text; end if;
  for t in
    select distinct w from regexp_split_to_table(v_niet, '[^a-zà-ÿ]+') as w
    where length(w) >= 4 and w <> all (array['niet', 'geen', 'graag', 'eten', 'heel', 'veel', 'alles', 'lust', 'lekker', 'vind', 'liever', 'soms',
      'maar', 'voor', 'zoals', 'echt', 'alle', 'soort', 'soorten', 'enzo', 'verder', 'niks', 'niets', 'weinig', 'grote', 'beetje', 'andere',
      'dingen', 'houd', 'vooral', 'zoveel', 'mogelijk', 'liefst', 'absoluut', 'alleen', 'behalve', 'tenzij', 'eigenlijk', 'bijna', 'vaak',
      'nooit', 'altijd', 'omdat', 'maaltijd', 'maaltijden', 'gerecht', 'gerechten', 'smaak', 'structuur', 'warm', 'warme', 'koud', 'koude',
      'rauw', 'rauwe', 'gekookt', 'gekookte', 'gebakken', 'eieren', 'champignons', 'tofu', 'tempeh'])
  loop
    if length(t) > 5 then t := regexp_replace(t, '(en|s)$', ''); end if;
    v_pat := v_pat || t;
    if exists (select 1 from ai_meals a where a.partner = 'prepmymeal' and lower(a.name) ~ t) then v_lust := v_lust || t; end if;
  end loop;
  v_weg := array_to_string(v_pat, '|');

  select array_agg(a.id) into v_ok
  from ai_meals a
  where a.partner = 'prepmymeal' and coalesce(a.partner_actief, true) and not coalesce(a.needs_review, false)
    and a.partner_url is not null and a.calories > 0 and a.protein is not null
    and 'lunch' = any (a.timing)
    and (not v_gluten or a.labels ? 'glutenvrij')
    and (v_dieet !~ 'vegetar' or a.labels ? 'veggie/vegan')
    and (v_dieet !~ 'vegan' or lower(a.name) ~ 'vegan|plantaardig')
    and (v_dieet !~ 'pesc' or a.labels ? 'veggie/vegan' or lower(a.name) ~ 'zalm|salmone|\mvis\M')
    and (v_weg = '' or lower(a.name) !~ v_weg);
  v_ok := coalesce(v_ok, '{}'::uuid[]);

  if array_length(v_into, 1) > 0 then
    v_nakijken := v_nakijken || to_jsonb(format('Prep My Meal: gerechten op naam gefilterd voor %s (intolerantie). Controleer de allergenen op de productpagina.', partner_opsomming(v_into)));
  end if;
  if v_gluten then v_keuzes := v_keuzes || to_jsonb('Prep My Meal: alleen glutenvrije gerechten, omdat de klant gluten noemt.'::text); end if;
  if v_dieet ~ 'vegetar|vegan|pesc' then v_keuzes := v_keuzes || to_jsonb(format('Prep My Meal: alleen gerechten die bij %s passen.', v_dieet)); end if;
  if array_length(v_lust, 1) > 0 then
    v_keuzes := v_keuzes || to_jsonb(format('Prep My Meal: gerechten weggelaten die de klant niet lust (%s).', partner_opsomming(v_lust)));
  end if;

  -- ── De lunch per werkdag en het dagtotaal van nu ──────────────────────────
  for i in 1..v_n loop
    v_dag := case when jsonb_typeof(v_week -> v_dagen[i]) = 'object' then v_week -> v_dagen[i] else '{}'::jsonb end;
    v_lunch := v_dag -> 'lunch';
    if jsonb_typeof(v_lunch) = 'object' and v_lunch ? 'name' and coalesce(v_lunch ->> 'bron', '') <> 'partner' then
      lk[i] := coalesce(nullif(v_lunch ->> 'calories', '')::numeric, 0);
      lp[i] := coalesce(nullif(v_lunch ->> 'protein', '')::numeric, 0);
      lc[i] := coalesce(nullif(v_lunch ->> 'carbs', '')::numeric, 0);
      lf[i] := coalesce(nullif(v_lunch ->> 'fat', '')::numeric, 0);
    else
      lk[i] := 0; lp[i] := 0; lc[i] := 0; lf[i] := 0;
    end if;
    select coalesce(sum(nullif(m.value ->> 'protein', '')::numeric), 0), coalesce(sum(nullif(m.value ->> 'fat', '')::numeric), 0)
      into v_dp, v_df
      from jsonb_each(v_dag) m
      where m.key <> 'totals' and jsonb_typeof(m.value) = 'object' and m.value ? 'name';
    dp[i] := v_dp; df[i] := v_df;
  end loop;

  -- ── Kiezen: eerst alleen gerechten die er nog niet in staan, daarna mag er een terugkomen ──
  for v_pass in 1..2 loop
    for i in 1..v_n loop
      exit when v_geplaatst >= v_max;
      continue when v_toe[i] is not null or lk[i] <= 0;
      for r in
        select q.* from (
          select a.id, a.name, a.calories as k, a.protein as p, a.fat as f,
                 coalesce(a.labels ? 'bak_2_porties', false) as bak2,
                 (select count(*) from unnest(v_toe) as u(mid) where u.mid = a.id) as gebruikt,
                 partner_maaltijd_score(a.calories, a.protein, a.carbs, a.fat, lk[i], lp[i], lc[i], lf[i]) as s
          from ai_meals a
          where a.id = any (v_ok)
            and partner_maaltijd_past(a.calories, a.protein, a.fat, lk[i], lp[i], lf[i], dp[i], df[i], p_eiwit_doel, p_vet_min)
        ) q
        where v_pass = 2 or q.gebruikt = 0
        order by q.gebruikt, q.s, q.name
      loop
        if r.bak2 then
          -- Twee porties per bak: er moet een tweede dag zijn waar hij ook past.
          continue when v_geplaatst + 2 > v_max;
          select g.idx into j
            from generate_subscripts(v_dagen, 1) as g(idx)
            where g.idx <> i and v_toe[g.idx] is null and lk[g.idx] > 0
              and partner_maaltijd_past(r.k, r.p, r.f, lk[g.idx], lp[g.idx], lf[g.idx], dp[g.idx], df[g.idx], p_eiwit_doel, p_vet_min)
            order by abs(v_wd[g.idx] - v_wd[i]), v_wd[g.idx]
            limit 1;
          continue when j is null;
          v_toe[i] := r.id; v_toe[j] := r.id; v_geplaatst := v_geplaatst + 2;
        else
          v_toe[i] := r.id; v_geplaatst := v_geplaatst + 1;
        end if;
        exit;
      end loop;
    end loop;
  end loop;

  -- ── In de week zetten, in de volgorde van de week ─────────────────────────
  for i in select g.idx from generate_subscripts(v_dagen, 1) as g(idx) order by v_wd[g.idx] loop
    if v_toe[i] is null then
      if p_keuze = 'elke_werkdag' then v_open := v_open || (v_nl ->> v_dagen[i]); end if;
      continue;
    end if;
    select to_jsonb(a) into v_meal from ai_meals a where a.id = v_toe[i];
    v_lunch := v_week -> v_dagen[i] -> 'lunch';
    v_week := jsonb_set(v_week, array[v_dagen[i], 'lunch'], v_meal || jsonb_build_object(
      'slot', 'lunch',
      'timing', coalesce(v_lunch -> 'timing', 'null'::jsonb),
      'display_label', coalesce(v_lunch -> 'display_label', to_jsonb('Lunch'::text)),
      'meal_id', v_meal -> 'id', 'meal_name', v_meal -> 'name',
      'bron', 'partner', 'vervangt', v_lunch ->> 'name'));
    select jsonb_build_object(
        'kcal', round(coalesce(sum(nullif(m.value ->> 'calories', '')::numeric), 0)),
        'protein', round(coalesce(sum(nullif(m.value ->> 'protein', '')::numeric), 0), 1),
        'carbs', round(coalesce(sum(nullif(m.value ->> 'carbs', '')::numeric), 0), 1),
        'fat', round(coalesce(sum(nullif(m.value ->> 'fat', '')::numeric), 0), 1))
      into v_tot
      from jsonb_each(v_week -> v_dagen[i]) m
      where m.key <> 'totals' and jsonb_typeof(m.value) = 'object' and m.value ? 'name';
    v_week := jsonb_set(v_week, array[v_dagen[i], 'totals'], v_tot);
    v_gepl := v_gepl || jsonb_build_object(
      'dag', v_dagen[i], 'dag_nl', v_nl ->> v_dagen[i], 'id', v_meal -> 'id', 'naam', v_meal ->> 'name',
      'kcal', round((v_meal ->> 'calories')::numeric), 'eiwit', round((v_meal ->> 'protein')::numeric),
      'vet', round((v_meal ->> 'fat')::numeric),
      'bak2', coalesce(v_meal -> 'labels' ? 'bak_2_porties', false),
      'was', v_lunch ->> 'name', 'was_kcal', round(lk[i]), 'was_eiwit', round(lp[i]),
      'dag_kcal', v_tot -> 'kcal', 'dag_eiwit', v_tot -> 'protein', 'dag_vet', v_tot -> 'fat');
  end loop;

  return jsonb_build_object(
    'week_structure', v_week, 'gevraagd', v_max, 'geplaatst', v_gepl, 'niet_gevuld', to_jsonb(v_open),
    'kandidaten', coalesce(array_length(v_ok, 1), 0),
    'lunch_min', (select round(min(x)) from unnest(lk) x where x > 0), 'lunch_max', (select round(max(x)) from unnest(lk) x where x > 0),
    'nakijken', v_nakijken, 'keuzes', v_keuzes, 'geblokkeerd', null);
end $function$;

-- STAND 20 nov 2026: alles hierboven staat in de database en is droog getest.
-- De functie hieronder (de enige die schrijft) staat er NOG NIET in: de kaart
-- voor Kersten verliep. Zolang hij ontbreekt doet het antwoord uit de intake
-- niets. Daarna nog: edge functions intake-maaltijden en concept-nakijker
-- uitrollen, en één keer echt testen op een testaccount.
--
-- Zet de partnermaaltijden in het nieuwste concept van de klant en schrijft de
-- brief bij. Eén keer per concept (generation_settings.partner_maaltijden).
-- p_keuze alleen om te testen; anders geldt het antwoord uit de intake.
create or replace function public.zet_partner_maaltijden_in_concept(p_client uuid, p_keuze text default null)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  pl client_meal_plans%rowtype; np nutrition_preferences%rowtype;
  gs jsonb; mv jsonb; brief jsonb; r jsonb; v_keuze text; v_tekst text;
  v_n int; v_gevraagd int; v_dagen text[]; v_open text[];
  v_nakijken jsonb := '[]'::jsonb; v_keuzes jsonb := '[]'::jsonb;
  v_marge text; g record;
  v_kcal numeric; v_eiwit numeric; v_koolh numeric; v_vet numeric;
begin
  select * into pl from client_meal_plans
    where client_id = p_client and is_active = false and generation_settings ->> 'status' = 'concept'
    order by created_at desc limit 1;
  if not found then return jsonb_build_object('overgeslagen', 'geen concept'); end if;
  gs := coalesce(pl.generation_settings, '{}'::jsonb);
  if gs ? 'partner_maaltijden' then return jsonb_build_object('al', true, 'partner_maaltijden', gs -> 'partner_maaltijden'); end if;

  select * into np from nutrition_preferences where client_id = p_client order by updated_at desc nulls last limit 1;
  v_keuze := coalesce(nullif(p_keuze, ''), np.practical_info ->> 'kant_en_klaar', 'nee');
  -- Nee of niet ingevuld: niets veranderen, ook de brief niet.
  if v_keuze not in ('paar_keer', 'elke_werkdag') then return jsonb_build_object('keuze', 'nee', 'geplaatst', 0); end if;
  v_tekst := case v_keuze when 'paar_keer' then 'een paar keer per week' else 'elke werkdag' end;

  mv := coalesce(gs -> 'macro_voorstel', '{}'::jsonb);
  r := partner_maaltijden_kies(pl.week_structure, v_keuze,
    coalesce(nullif(mv ->> 'target_protein', '')::numeric, 0), coalesce(nullif(mv ->> 'target_fat', '')::numeric, 0),
    np.allergens, np.wishes);
  v_n := jsonb_array_length(r -> 'geplaatst');
  v_gevraagd := (r ->> 'gevraagd')::int;
  select coalesce(array_agg(x ->> 'dag_nl' order by o), '{}') into v_dagen from jsonb_array_elements(r -> 'geplaatst') with ordinality as e(x, o);
  select coalesce(array_agg(x order by o), '{}') into v_open from jsonb_array_elements_text(r -> 'niet_gevuld') with ordinality as e(x, o);
  v_marge := case when r ->> 'lunch_min' is null then 'geen lunch in het plan'
    when r ->> 'lunch_min' = r ->> 'lunch_max' then format('lunch van %s kcal', r ->> 'lunch_min')
    else format('lunch van %s tot %s kcal', r ->> 'lunch_min', r ->> 'lunch_max') end;

  if r ->> 'geblokkeerd' is not null then
    v_nakijken := v_nakijken || to_jsonb(format('Prep My Meal: de klant wil kant-en-klare maaltijden (%s), maar er is niets geplaatst: %s. De allergenen per gerecht staan niet in de app; zet ze er zelf in als het kan.', v_tekst, r ->> 'geblokkeerd'));
  else
    if v_n > 0 then
      v_nakijken := v_nakijken || to_jsonb(format('Prep My Meal: %s kant-en-klare %s in het plan (%s). De klant koos: %s.',
        v_n, case when v_n = 1 then 'lunch' else 'lunches' end, partner_opsomming(v_dagen), v_tekst));
    end if;
    if v_n = 0 then
      v_nakijken := v_nakijken || to_jsonb(format('Prep My Meal: de klant wil kant-en-klare maaltijden (%s), maar geen gerecht past binnen de marge (%s). Het plan staat zoals het was.', v_tekst, v_marge));
    elsif v_n < v_gevraagd then
      v_nakijken := v_nakijken || to_jsonb(format('Prep My Meal: %s van de %s niet geplaatst%s: geen gerecht binnen de marge (%s). Die dagen staan zoals ze waren.',
        v_gevraagd - v_n, v_gevraagd, case when array_length(v_open, 1) > 0 then ' (' || partner_opsomming(v_open) || ')' else '' end, v_marge));
    end if;
    -- Per gerecht: op welke dagen, en wat het vervangt.
    for g in
      select x ->> 'naam' as naam, (x ->> 'bak2')::boolean as bak2, count(*) as keer,
             array_agg(x ->> 'dag_nl' order by o) as dagen, min(x ->> 'kcal') as kcal, min(x ->> 'eiwit') as eiwit,
             (array_agg(x ->> 'was' order by o))[1] as was, (array_agg(x ->> 'was_kcal' order by o))[1] as was_kcal,
             (array_agg(x ->> 'was_eiwit' order by o))[1] as was_eiwit, min(o) as eerste
      from jsonb_array_elements(r -> 'geplaatst') with ordinality as e(x, o)
      group by 1, 2 order by min(o)
    loop
      v_keuzes := v_keuzes || to_jsonb(format('Prep My Meal: %s%s op %s: %s kcal, %s g eiwit%s (lunch was %s, %s kcal, %s g eiwit).',
        g.naam, case when g.bak2 and g.naam !~* '2 porties' then ' (bak van 2 porties)' else '' end, partner_opsomming(g.dagen),
        g.kcal, g.eiwit, case when g.bak2 then ' per portie' else '' end, g.was, g.was_kcal, g.was_eiwit));
      if (not g.bak2 and g.keer >= 3) or (g.bak2 and g.keer >= 4) then
        v_nakijken := v_nakijken || to_jsonb(format('Prep My Meal: weinig keus binnen de marge, %s staat er %s keer in.', g.naam, g.keer));
      end if;
    end loop;
    v_nakijken := v_nakijken || coalesce(r -> 'nakijken', '[]'::jsonb);
    v_keuzes := v_keuzes || coalesce(r -> 'keuzes', '[]'::jsonb);
  end if;

  brief := coalesce(gs -> 'brief', '{}'::jsonb);
  brief := brief || jsonb_build_object(
    'nakijken', v_nakijken || coalesce(brief -> 'nakijken', '[]'::jsonb),
    'keuzes', v_keuzes || coalesce(brief -> 'keuzes', '[]'::jsonb));
  gs := gs || jsonb_build_object('brief', brief, 'partner_maaltijden', jsonb_build_object(
    'op', now(), 'keuze', v_keuze, 'gevraagd', v_gevraagd, 'geplaatst', v_n,
    'maaltijden', (select coalesce(jsonb_agg(x - 'dag_kcal' - 'dag_eiwit' - 'dag_vet'), '[]'::jsonb) from jsonb_array_elements(r -> 'geplaatst') x),
    'niet_gevuld', r -> 'niet_gevuld', 'geblokkeerd', r -> 'geblokkeerd'));

  if v_n > 0 then
    select avg((d.value -> 'totals' ->> 'kcal')::numeric), avg((d.value -> 'totals' ->> 'protein')::numeric),
           avg((d.value -> 'totals' ->> 'carbs')::numeric), avg((d.value -> 'totals' ->> 'fat')::numeric)
      into v_kcal, v_eiwit, v_koolh, v_vet
      from jsonb_each(r -> 'week_structure') d
      where jsonb_typeof(d.value) = 'object' and d.value ? 'totals';
    update client_meal_plans set
      week_structure = r -> 'week_structure',
      daily_calories = coalesce(round(v_kcal), daily_calories), daily_protein = coalesce(round(v_eiwit), daily_protein),
      daily_carbs = coalesce(round(v_koolh), daily_carbs), daily_fat = coalesce(round(v_vet), daily_fat),
      generation_settings = gs, updated_at = now()
      where id = pl.id;
  else
    update client_meal_plans set generation_settings = gs, updated_at = now() where id = pl.id;
  end if;

  return jsonb_build_object('plan_id', pl.id, 'keuze', v_keuze, 'gevraagd', v_gevraagd, 'geplaatst', v_n,
    'dagen', to_jsonb(v_dagen), 'niet_gevuld', r -> 'niet_gevuld', 'geblokkeerd', r -> 'geblokkeerd',
    'maaltijden', r -> 'geplaatst', 'nakijken', v_nakijken, 'keuzes', v_keuzes);
end $function$;

-- Alleen de server (edge function intake-maaltijden met de service role) mag dit aanroepen.
revoke all on function public.partner_maaltijden_kies(jsonb, text, numeric, numeric, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.zet_partner_maaltijden_in_concept(uuid, text) from public, anon, authenticated;
grant execute on function public.partner_maaltijden_kies(jsonb, text, numeric, numeric, jsonb, jsonb) to service_role;
grant execute on function public.zet_partner_maaltijden_in_concept(uuid, text) to service_role;
