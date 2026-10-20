-- src/modules/lead-management/betaal-pauze.sql
-- Betalingen stilzetten bij een coaching-pauze (20 okt 2026, eerst voor Ferry).
-- Live definities: pg_get_functiondef('public.<naam>'::regproc).
--
-- 1. lead_movements.client_id: vaste koppeling sale → klant. E-mail werkt niet
--    (leads heten naar hun Insta-naam, vaak zonder e-mail). Koppelen gaat in
--    Coach Inzicht (BetaalPauze.jsx) zodra een klant op pauze staat.
alter table lead_movements add column if not exists client_id uuid references clients(id) on delete set null;
create index if not exists lead_movements_client_id_idx on lead_movements(client_id) where client_id is not null;

-- 2. sale_pauzes_team(): per gekoppelde sale de pauzes uit coaching_pauses,
--    [{vanaf, tot}] in NL-datum. Security definer (coaching_pauses is alleen
--    voor de eigen coach leesbaar, de uitbetaling van Marcel moet ze ook zien),
--    begrensd op team_coach_ids(auth.uid()).
-- 3. pauze_schuif(d, pauzes): termijn op/na de pauzestart → null zolang de
--    pauze loopt, daarna + lengte van de pauze. JS-tweeling: betaalPauze.js.
-- 4. get_payment_schedule past pauze_schuif toe op termijnen (niet op de
--    reservering) en laat gepauzeerde termijnen weg.
--    LeadManagementService: getRevenueProjection, getPartnerPayouts en de MRR
--    gebruiken dezelfde regel via laadSalePauzes().
--
-- Ferry (ferryvm030, €550) gekoppeld op 20 okt; pauze sinds 20 okt, dus
-- 10 nov en 10 dec staan stil. Stripe-abonnement heeft hij niet.
