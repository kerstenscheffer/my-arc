-- Stand onder de leus op Business OS (19 nov 2026, Kersten).
-- Staat LIVE. get_business_os geeft in 'nu' en 'voor' drie velden extra:
--   mannen            nieuwe leads met gender 'male', aangemaakt in de periode, niet verwijderd
--   callsVoorgesteld  leads die in de periode naar 'Call voorgesteld' zijn gezet
--   callsGevoerd      leads met een Sales Call-rij waarvan call_date in de periode valt en call_happened waar is
--                     (zelfde som als 'gehouden' in business-os-agent.sql)
-- Alleen velden erbij; bestaande velden en oudere app-versies blijven ongemoeid.
--
-- De patch is op de live functie gezet (pg_get_functiondef + replace), niet via
-- business-os.sql: dat bestand loopt achter op de live definitie. Draai dit
-- opnieuw als get_business_os ooit uit een ouder bestand wordt teruggezet.

do $do$
declare d text; a text; b text; n text;
begin
  select pg_get_functiondef(p.oid) into d from pg_proc p where proname = 'get_business_os';
  if position('callsGevoerd' in d) > 0 then return; end if;

  a := E'  keten as (\n';
  if position(a in d) = 0 then raise exception 'plek 1 niet gevonden'; end if;
  n := E'  -- Stand onder de leus (19 nov 2026): mannelijke leads, calls voorgesteld en gevoerd.\n'
    || E'  stand as (\n'
    || E'    select per.p,\n'
    || E'      (select count(*) from call_leads l where l.created_at >= per.van and l.created_at < per.tot\n'
    || E'         and l.coach_id = any(v_team) and l.deleted_at is null and l.gender = ''male'') mannen,\n'
    || E'      (select count(distinct m.lead_id) from lead_movements m where m.moved_at >= per.van and m.moved_at < per.tot\n'
    || E'         and m.reverted_at is null and m.coach_id = any(v_team) and lower(m.to_section_title) like ''call voorgesteld%'') voorgesteld,\n'
    || E'      (select count(distinct m.lead_id) from lead_movements m where m.call_date >= per.van and m.call_date < per.tot\n'
    || E'         and m.reverted_at is null and m.coach_id = any(v_team) and m.call_happened\n'
    || E'         and lower(m.to_section_title) like ''%sales call%'') gevoerd\n'
    || E'    from per\n'
    || E'  ),\n';
  d := replace(d, a, n || a);

  a := E'''omzet'', mv.omzet) j\n    from content c join leads l using (p) join reacties r using (p) join mov mv using (p)';
  if position(a in d) = 0 then raise exception 'plek 2 niet gevonden'; end if;
  b := E'''omzet'', mv.omzet,\n      ''mannen'', st.mannen, ''callsVoorgesteld'', st.voorgesteld, ''callsGevoerd'', st.gevoerd) j\n    from content c join leads l using (p) join reacties r using (p) join mov mv using (p) join stand st using (p)';
  d := replace(d, a, b);
  execute d;
end $do$;
