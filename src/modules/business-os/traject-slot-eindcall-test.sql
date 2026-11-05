-- src/modules/business-os/traject-slot-eindcall-test.sql
--
-- Test met terugdraaien: de exception aan het eind maakt alles ongedaan, er blijft niets staan.
-- pa-sql meldt daarom altijd gelukt:false; de uitkomst staat in de foutregel na 'TEST:'.
-- Doet na elkaar: signaal twee keer maken (mag maar één rij geven), doorstap nee zetten bij een
-- lopende klant en bij een gepauzeerde. Draait de slot-update zelf niet.

do $$
declare
  eerste integer; tweede integer; rijen integer; h record;
  actief public.clients; gepauzeerd public.clients;
  actief_slot boolean; gepauzeerd_slot boolean; actief_voor boolean;
begin
  eerste := public.traject_signaal_maak();
  tweede := public.traject_signaal_maak();
  select count(*) into rijen from public.business_os_herinneringen x
    where x.tekst like 'Einde traject.%' and x.klaar_at is null;
  select x.tekst, x.moment, x.bron, x.coach_id into h from public.business_os_herinneringen x
    where x.tekst like 'Einde traject.%' and x.klaar_at is null limit 1;

  select c.* into actief from public.clients c join public.traject_slot_stand() s on s.client_id = c.id
    where c.coaching_status = 'active' and s.einde > (now() at time zone 'Europe/Amsterdam')::date + 7
      and s.verlenging_tot is null and not s.nee order by s.einde limit 1;
  select c.* into gepauzeerd from public.clients c
    where c.coaching_status = 'paused' and c.account_locked_at is null and not c.coaching_onbeperkt
      and c.coaching_paused_at::date < public.traject_einde(c) order by c.id limit 1;

  select exists (select 1 from public.traject_verlopen_klanten() k where k.id = actief.id) into actief_voor;
  insert into public.client_doorstap (client_id, coach_id, status, notitie)
    values (actief.id, actief.coach_id, 'nee', 'test'), (gepauzeerd.id, gepauzeerd.coach_id, 'nee', 'test');
  select exists (select 1 from public.traject_verlopen_klanten() k where k.id = actief.id) into actief_slot;
  select exists (select 1 from public.traject_verlopen_klanten() k where k.id = gepauzeerd.id) into gepauzeerd_slot;

  raise exception 'TEST: maak1=% maak2=% openrijen=% moment=% bron=% coach=% tekst=[%] | actief % voor_nee=% na_nee=% | gepauzeerd % na_nee=%',
    eerste, tweede, rijen, h.moment, h.bron, h.coach_id, h.tekst,
    actief.first_name, actief_voor, actief_slot, gepauzeerd.first_name, gepauzeerd_slot;
end $$;
