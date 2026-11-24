-- Betaald = vandaag binnen (24 nov 2026, Kersten).
-- Een vooruitbetaalde sale die "nog niet betaald" geboekt werd met een verwachte
-- datum in de toekomst (Patrick: 1 jan), en daarna eerder betaald wordt, hield
-- die toekomstige datum. Het betaalschema (en "binnen" op Business OS) telde het
-- geld dan pas in januari. Gaat payment_received naar true en ligt de datum nog
-- in de toekomst, dan wordt de betaaldatum vandaag. Geldt voor elke route
-- (Stripe-webhook, afvinken in Business OS, oude app-versies).
-- Datums in het verleden blijven staan: die kunnen al in een uitbetaalde maand zitten.

create or replace function public.betaald_op_dag()
returns trigger language plpgsql as $$
declare v_dag date := (now() at time zone 'Europe/Amsterdam')::date;
begin
  if new.payment_received is true and old.payment_received is distinct from true
     and coalesce(new.payment_type, 'prepaid') = 'prepaid'
     and new.payment_due_date > v_dag then
    new.payment_due_date := v_dag;
  end if;
  return new;
end $$;

drop trigger if exists trg_betaald_op_dag on public.lead_movements;
create trigger trg_betaald_op_dag before update of payment_received on public.lead_movements
  for each row execute function public.betaald_op_dag();
