-- 5 nov 2026: vervolgopdracht in de wachtrij. De echte test van de toestemmingskaart kan pas
-- op de herstarte PA, en die herstart pas na de opdracht die de code bouwde. Eenmalig draaien.
insert into public.business_os_opdrachten (coach_id, opdracht, status, soort)
select coach_id, $opdracht$Vervolgtest van de toestemmingskaarten, stap 5 uit opdracht 2aa168d0. Niets bouwen, geen code wijzigen. De PA draait nu de nieuwe code.

Kersten: laat de twee testkaarten langer dan 60 seconden staan en sta ze daarna toe.

1. Roep in hetzelfde bericht twee Bash-commando's tegelijk aan: sips --version en pip3 --version, allebei met de description "Test toestemmingskaart: versie tonen". Beide krijgen een kaart.
2. Lees daarna met node scripts/pa-db.mjs lees:
   select invoer, status, gevraagd_at, beslist_at from business_os_toestemmingen where invoer ilike '%sips --version%' or invoer ilike '%pip3 --version%' order by gevraagd_at desc limit 2
   select id, created_at, read_status, action_data from coach_notifications where title = 'Gino vraagt toestemming' and action_data->>'regeling' = 'na60s' order by created_at
3. Geslaagd als er precies één rij is en created_at 60 tot 70 seconden na de eerste gevraagd_at ligt. Zijn beide kaarten binnen 60 seconden beantwoord, dan hoort er geen rij te zijn: zeg dan eerlijk dat de rij niet getest is.
4. Markeer niets: schrijven naar die tabel is voor Gino hard geblokkeerd. Tel alleen hoeveel rijen met die titel nog ongelezen zijn, en zet bij NODIG dat Kersten src/modules/business-os/gino-toestemming-gelezen.sql moet draaien.

Rapport in maximaal 3 regels: de gemeten seconden, het aantal rijen, en hoeveel rijen nog ongelezen zijn.$opdracht$, 'wacht', 'code'
from public.business_os_opdrachten
where id = '2aa168d0-ff7f-4ac8-bc07-c3f385762a44'
returning id, status, soort;
