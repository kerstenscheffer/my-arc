-- 5 nov 2026: bestaande rijen 'Gino vraagt toestemming' op gelezen, zoals de bel dat doet
-- (read_status, CoachNotificationBell.jsx). Niets verwijderd, andere titels blijven staan.
-- Mag vaker draaien: geeft terug hoeveel rijen deze keer zijn gezet.
with gezet as (
  update public.coach_notifications
     set read_status = true
   where title = 'Gino vraagt toestemming'
     and read_status is distinct from true
  returning id
)
select count(*) as gemarkeerd from gezet;
