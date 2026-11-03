-- src/modules/business-os/opdracht-uitkomst.sql
--
-- Eerlijke afloop van code-opdrachten (3 nov 2026). status = 'klaar' zegt alleen
-- dat het proces stopte; uitkomst zegt of het werk ook af is. Alleen aanvullend.

alter table public.business_os_opdrachten add column if not exists uitkomst text;   -- live | wacht_op_jou | mislukt
alter table public.business_os_opdrachten add column if not exists nodig text;      -- wat Kersten nog moet doen
alter table public.business_os_opdrachten add column if not exists voortgang text;  -- wat de opdracht nu doet
