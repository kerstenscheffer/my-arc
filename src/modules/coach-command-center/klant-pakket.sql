-- Pakket per klant (24 nov 2026, Kersten): filter op Command voor een
-- data- + feedbackdag. De niveaus komen uit business_os_aanbod:
--   app     = Solo      (alleen de app, geen monitoring)
--   basis   = Op koers  (wekelijkse monitoring, WhatsApp)
--   midden  = Coaching  (monitoring, calls, video-feedback)
--   premium = All-in
-- Standaard 'midden': iedereen die nu loopt is coaching of challenge.
-- Bij een nieuwe of gewijzigde sale met een aanbod zet de trigger het pakket
-- vanzelf goed; met de hand aanpassen kan via het ⋯-menu op de klantkaart.

alter table public.clients add column if not exists pakket text not null default 'midden';
do $$ begin
  alter table public.clients add constraint clients_pakket_check check (pakket in ('app', 'basis', 'midden', 'premium'));
exception when duplicate_object then null; end $$;
comment on column public.clients.pakket is 'Niveau uit business_os_aanbod: app (Solo), basis (Op koers), midden (Coaching), premium (All-in). 24 nov 2026.';

create or replace function public.pakket_uit_aanbod(p_aanbod text)
returns text language sql immutable as $$
  select case
    when p_aanbod is null or trim(p_aanbod) = '' then null
    when p_aanbod ~* '(^|\W)(app|solo)(\W|$)' then 'app'
    when p_aanbod ~* 'op koers' then 'basis'
    when p_aanbod ~* 'all-?in' then 'premium'
    when p_aanbod ~* 'coaching' then 'midden'
    else null
  end
$$;

create or replace function public.pakket_bij_sale()
returns trigger language plpgsql security definer set search_path = public as $$
declare p text := public.pakket_uit_aanbod(new.aanbod);
begin
  if new.client_id is not null and new.reverted_at is null and p is not null then
    update public.clients set pakket = p where id = new.client_id and pakket is distinct from p;
  end if;
  return null;
end $$;
revoke all on function public.pakket_bij_sale() from public, anon, authenticated;

drop trigger if exists trg_pakket_bij_sale on public.lead_movements;
create trigger trg_pakket_bij_sale after insert or update of aanbod, client_id on public.lead_movements
  for each row execute function public.pakket_bij_sale();

-- Eenmalig: wat de sales al zeggen (laatste sale met een herkenbaar aanbod).
update public.clients c set pakket = s.p
  from (select distinct on (client_id) client_id, public.pakket_uit_aanbod(aanbod) p
          from public.lead_movements
         where client_id is not null and reverted_at is null and public.pakket_uit_aanbod(aanbod) is not null
         order by client_id, moved_at desc) s
 where s.client_id = c.id and c.pakket is distinct from s.p;
