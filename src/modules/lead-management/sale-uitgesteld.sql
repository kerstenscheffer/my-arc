-- Sale-status 'uitgesteld' (30 okt 2026)
-- Uitgestelde sales (challenge_status = 'uitgesteld') tellen nergens mee:
-- omzet, sales, betaalschema, Marcel-deel, bron-/magnet-trechter, ads-overzicht.
-- Wel zichtbaar: get_business_os geeft een extra veld 'uitgesteld' terug.
-- Alleen toevoegen: functienamen + returnvorm blijven gelijk (oude app-versies).

alter table public.lead_movements drop constraint lead_movements_challenge_status_check;
alter table public.lead_movements add constraint lead_movements_challenge_status_check
  check (challenge_status is null or challenge_status = any (array['open','behouden','terugbetaald','uitgesteld']));

-- Patcht een functie met tekstvervangingen; faalt als een vervanging niets raakt.
do $$
declare
  f record;
  def text;
  nieuw text;
  i int;
  patches jsonb := jsonb_build_array(
    jsonb_build_object('fn', 'get_business_os(date,date)', 'r', jsonb_build_array(
      jsonb_build_array(
        'on m.moved_at >= per.van and m.moved_at < per.tot and m.reverted_at is null and m.coach_id = any(v_team)',
        'on m.moved_at >= per.van and m.moved_at < per.tot and m.reverted_at is null and m.coach_id = any(v_team) and coalesce(m.challenge_status, '''') <> ''uitgesteld'''),
      jsonb_build_array(
        'where m.reverted_at is null and m.order_value is not null and m.coach_id = any(v_team)',
        'where m.reverted_at is null and m.order_value is not null and m.coach_id = any(v_team) and coalesce(m.challenge_status, '''') <> ''uitgesteld'''),
      jsonb_build_array(
        '    ''agents'', coalesce(',
        '    ''uitgesteld'', coalesce((select jsonb_agg(jsonb_build_object(''id'', m.id, ''lead_id'', m.lead_id, ''naam'', m.lead_name, ''bedrag'', m.order_value, ''sinds'', (m.moved_at at time zone ''Europe/Amsterdam'')::date, ''soort'', m.sale_kind) order by m.moved_at)
        from lead_movements m
        where m.reverted_at is null and m.order_value > 0 and m.coach_id = any(v_team)
          and m.challenge_status = ''uitgesteld''), ''[]''::jsonb),
    ''agents'', coalesce(')
    )),
    jsonb_build_object('fn', 'get_payment_schedule(uuid,date,date)', 'r', jsonb_build_array(
      jsonb_build_array(
        'and m.reverted_at is null',
        'and m.reverted_at is null
      and coalesce(m.challenge_status, '''') <> ''uitgesteld''')
    )),
    jsonb_build_object('fn', 'get_bron_resultaat(timestamp with time zone,timestamp with time zone)', 'r', jsonb_build_array(
      jsonb_build_array('coalesce(m.challenge_status, '''') <> ''terugbetaald''', 'coalesce(m.challenge_status, '''') not in (''terugbetaald'', ''uitgesteld'')')
    )),
    jsonb_build_object('fn', 'get_bron_details(timestamp with time zone,timestamp with time zone,text,text)', 'r', jsonb_build_array(
      jsonb_build_array('coalesce(m.challenge_status, '''') <> ''terugbetaald''', 'coalesce(m.challenge_status, '''') not in (''terugbetaald'', ''uitgesteld'')')
    )),
    jsonb_build_object('fn', 'get_magnet_trechter(timestamp with time zone,timestamp with time zone)', 'r', jsonb_build_array(
      jsonb_build_array('coalesce(m.order_value, 0) > 0', 'coalesce(m.order_value, 0) > 0 and coalesce(m.challenge_status, '''') <> ''uitgesteld''')
    )),
    jsonb_build_object('fn', 'get_challenge_ads_overzicht(timestamp with time zone,timestamp with time zone,text)', 'r', jsonb_build_array(
      jsonb_build_array('coalesce(m.order_value,0) > 0', 'coalesce(m.order_value,0) > 0 and coalesce(m.challenge_status,'''') <> ''uitgesteld'''),
      jsonb_build_array('v.outcome_type = ''verlenging'' and v.reverted_at is null and (', 'v.outcome_type = ''verlenging'' and v.reverted_at is null and coalesce(v.challenge_status,'''') <> ''uitgesteld'' and (')
    ))
  );
  p jsonb;
begin
  for p in select * from jsonb_array_elements(patches) loop
    def := pg_get_functiondef((p->>'fn')::regprocedure);
    if def ilike '%uitgesteld%' then continue; end if;  -- al gepatcht
    nieuw := def;
    for i in 0 .. jsonb_array_length(p->'r') - 1 loop
      if position((p->'r'->i->>0) in nieuw) = 0 then
        raise exception 'patch % / % raakt niets', p->>'fn', i;
      end if;
      nieuw := replace(nieuw, p->'r'->i->>0, p->'r'->i->>1);
    end loop;
    execute nieuw;
  end loop;
end $$;

-- Eenmalig (akkoord Kersten): yungkaravito + jayssonnn op uitgesteld.
update public.lead_movements set challenge_status = 'uitgesteld', challenge_deadline = null
where id in ('1e32fbbe-0e69-4ef9-9331-627f0444e769','c9dfad6c-d9af-4618-8459-a16879a2d7df');
