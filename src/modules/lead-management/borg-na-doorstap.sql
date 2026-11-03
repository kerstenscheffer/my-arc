-- src/modules/lead-management/borg-na-doorstap.sql
--
-- De challenge-borg is pas winst als de doorstap betaald is (3 nov 2026, besluit
-- Kersten). Tot die tijd kan de klant zijn borg terugvragen.
--
-- verlenging.borg_movement_id wijst naar de challenge-sale. Gaat de verlenging op
-- betaald, dan gaat de borg op behouden en zet lead_movement_telt_mee de maand.
-- Bewust geen foreign key: een tweede relatie op lead_movements kan PostgREST-embeds
-- in oude app-versies dubbelzinnig maken.
--
-- Alleen aanvullend. Stuurt niets naar klanten, Marcel of Meta: order_value blijft
-- ongemoeid, dus meta_purchase vuurt niet.

begin;

alter table public.lead_movements add column if not exists borg_movement_id uuid;
comment on column public.lead_movements.borg_movement_id is
  'Op een verlenging: de challenge-sale waarvan de borg behouden wordt zodra deze verlenging betaald is.';

create or replace function public.lead_movement_borg_behouden()
returns trigger language plpgsql as $$
begin
  if new.borg_movement_id is not null and new.payment_received is true and new.reverted_at is null
     and (tg_op = 'INSERT' or old.payment_received is distinct from true or old.borg_movement_id is distinct from new.borg_movement_id) then
    update public.lead_movements set challenge_status = 'behouden'
     where id = new.borg_movement_id and sale_kind = 'challenge' and challenge_status = 'open';
  end if;
  return null;
end $$;

drop trigger if exists lead_movement_borg_behouden on public.lead_movements;
create trigger lead_movement_borg_behouden
  after insert or update of payment_received, borg_movement_id
  on public.lead_movements
  for each row execute function public.lead_movement_borg_behouden();

-- De vier die ja zeiden maar nog niet betaalden: verlenging koppelen aan de borg.
update public.lead_movements v set borg_movement_id = k.borg
  from (values
    ('1410ee3e-3a09-43b6-8f4f-a75b554a1594'::uuid, 'bf2f2356-571b-4741-b53f-5dcfea7f43a7'::uuid),  -- Mark Behr
    ('11792c0a-e179-4a3d-a895-6cb83c5bd4e1'::uuid, '9ad19d6f-3229-4e67-ab0e-b4e4097a8c81'::uuid),  -- Martijn Kroes
    ('936f7b51-1867-4ddd-8045-c289f32f0b70'::uuid, 'acddda20-eacc-4491-a676-5333c560fa41'::uuid),  -- Jacco Aalbregt
    ('a3ac491f-0893-4f19-8ce3-4081bc37d76c'::uuid, '446637e9-d58c-4633-8cec-31bb89b5a215'::uuid)   -- Ronald Vervoort
  ) k(client, borg)
 where v.client_id = k.client and v.outcome_type = 'verlenging' and v.reverted_at is null
   and v.payment_received is not true;

-- Hun borg terug op open: telt niet meer voor Marcel tot de verlenging betaald is.
update public.lead_movements set challenge_status = 'open', telt_mee_vanaf = null
 where id in (
   'bf2f2356-571b-4741-b53f-5dcfea7f43a7',
   '9ad19d6f-3229-4e67-ab0e-b4e4097a8c81',
   'acddda20-eacc-4491-a676-5333c560fa41',
   '446637e9-d58c-4633-8cec-31bb89b5a215'
 ) and challenge_status = 'behouden';

do $$
begin
  if (select count(*) from public.lead_movements where borg_movement_id is not null) <> 4 then
    raise exception 'Verwacht 4 gekoppelde verlengingen';
  end if;
  if (select count(*) from public.lead_movements where sale_kind = 'challenge' and challenge_status = 'behouden' and reverted_at is null) <> 1 then
    raise exception 'Verwacht 1 behouden borg (ditgeeftmijenergie)';
  end if;
end $$;

commit;

-- Marco Molenaar = ditgeeftmijenergie: verlenging en borg bij elkaar (al betaald,
-- de borg stond al op behouden). Los gedraaid op 3 nov, staat hier voor de volledigheid.
update public.lead_movements set borg_movement_id = 'e5645a14-8b27-4a82-9d8a-47523c61fd49'
 where client_id = '953b39cb-c3d0-45c8-b7d2-b084d1ef0c21' and outcome_type = 'verlenging'
   and reverted_at is null and borg_movement_id is null;
