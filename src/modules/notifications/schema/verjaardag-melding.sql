-- verjaardag-melding.sql (2 nov 2026)
--
-- Dagelijks om 08:00 (Amsterdam) een melding aan de coach als een klant jarig
-- is: één rij in coach_notifications, die via trg_push_on_coach_notification de
-- bestaande pushketen in gaat (user_id = coach, dus alleen zijn toestellen).
--
-- ⚠️ De rij krijgt bewust GEEN client_id. Klanten mogen coach_notifications met
-- hun eigen client_id lezen (policy "Clients view own notifications",
-- DatabaseService leest ze op client_id). De klant-id staat in action_data.
--
-- ⚠️ Type is 'personal', niet 'birthday'. De constraint valid_type weigert
-- 'birthday'; daardoor faalt de oude verjaardagscheck in oudere app-versies
-- (CoachNotificationBell) stil. 'birthday' toestaan zou die check tot leven
-- wekken: een tweede, dubbele melding vanuit elke oude bundel.

alter table public.clients
  add column if not exists is_testaccount boolean not null default false;

update public.clients set is_testaccount = true
where trainer_id = '5a0135ac-3188-499d-8682-ed6a179e5541'
  and email in (
    'review@gmail.com', 'demo@myarcfitness.internal', 'Janjan@gmail.com',
    'tom.devries.test@gmail.com', 'kerstenschVr@gmail.com', 'ks10k@gmail.com',
    'mark@test.com', 'test12/09@gmail.com', 'Kersd@gmail.com',
    'jinokersten@gmail.com', 'jino@gmail.com', 'kersten@gmail.com',
    'sentest@gmail.com', 'test@gmail.com'
  );

-- Per klant maximaal één melding per jaar. De primary key maakt een dubbele
-- cron-run onschadelijk. RLS aan zonder policies: alleen de functies hieronder.
create table if not exists public.coach_verjaardag_log (
  client_id uuid not null references public.clients(id) on delete cascade,
  jaar int not null,
  coach_id uuid not null,
  notification_id uuid,
  gemeld_op timestamptz not null default now(),
  primary key (client_id, jaar)
);
alter table public.coach_verjaardag_log enable row level security;

-- Wie is er op p_dag jarig. 29 februari telt in een niet-schrikkeljaar op
-- 28 februari. Leeftijd = jaarverschil, want age() geeft op die 28e een jaar te weinig.
create or replace function public.verjaardag_kandidaten(p_coach uuid, p_dag date)
returns table (client_id uuid, voornaam text, leeftijd int)
language sql stable security definer set search_path to 'public'
as $$
  select c.id,
         coalesce(nullif(trim(c.first_name), ''), 'Een klant'),
         (extract(year from p_dag) - extract(year from c.date_of_birth))::int
  from clients c
  where c.trainer_id = p_coach
    and c.coaching_status in ('active', 'paused')
    and not c.is_testaccount
    and c.date_of_birth is not null
    and c.date_of_birth < p_dag
    and (
      to_char(c.date_of_birth, 'MM-DD') = to_char(p_dag, 'MM-DD')
      or (
        to_char(c.date_of_birth, 'MM-DD') = '02-29'
        and to_char(p_dag, 'MM-DD') = '02-28'
        and to_char(p_dag + 1, 'MM-DD') <> '02-29'
      )
    );
$$;

-- p_dag + p_droog zijn er om te testen: droog logt en verstuurt niets.
create or replace function public.verstuur_verjaardagen(p_dag date default null, p_droog boolean default false)
returns jsonb
language plpgsql security definer set search_path to 'public'
as $$
declare
  coach constant uuid := '5a0135ac-3188-499d-8682-ed6a179e5541';
  lokaal timestamp := now() at time zone 'Europe/Amsterdam';
  dag date := coalesce(p_dag, lokaal::date);
  jaar_ int := extract(year from dag)::int;
  rijen jsonb;
  delen text[];
  aantal int;
  tekst text;
  melding uuid;
begin
  -- De cron loopt op UTC en vuurt zomer én winter; pas vanaf 08:00 echt melden.
  if p_dag is null and lokaal::time < time '08:00' then
    return jsonb_build_object('overgeslagen', 'voor 08:00');
  end if;

  if p_droog then
    select jsonb_agg(to_jsonb(k) order by k.voornaam) into rijen
    from verjaardag_kandidaten(coach, dag) k
    where not exists (select 1 from coach_verjaardag_log l
                      where l.client_id = k.client_id and l.jaar = jaar_);
  else
    with kand as (
      select * from verjaardag_kandidaten(coach, dag)
    ), nieuw as (
      insert into coach_verjaardag_log (client_id, jaar, coach_id)
      select kand.client_id, jaar_, coach from kand
      on conflict (client_id, jaar) do nothing
      returning coach_verjaardag_log.client_id
    )
    select jsonb_agg(to_jsonb(k) order by k.voornaam) into rijen
    from kand k join nieuw n on n.client_id = k.client_id;
  end if;

  if rijen is null then
    return jsonb_build_object('dag', dag, 'jarig', 0);
  end if;

  aantal := jsonb_array_length(rijen);
  if aantal = 1 then
    tekst := (rijen->0->>'voornaam') || ' is vandaag jarig (' || (rijen->0->>'leeftijd') || ')';
  else
    select array_agg((r->>'voornaam') || ' (' || (r->>'leeftijd') || ')' order by ord)
      into delen
    from jsonb_array_elements(rijen) with ordinality as t(r, ord);
    tekst := array_to_string(delen[1:aantal - 1], ', ') || ' en ' || delen[aantal] || ' zijn vandaag jarig';
  end if;

  if p_droog then
    return jsonb_build_object('dag', dag, 'jarig', aantal, 'tekst', tekst, 'droog', true);
  end if;

  -- Geen client_id op de rij: zie de waarschuwing bovenaan.
  insert into coach_notifications (coach_id, type, priority, title, message, tags, action_data)
  values (coach, 'personal', 'normal', 'Verjaardag', tekst, array['verjaardag'],
    jsonb_strip_nulls(jsonb_build_object(
      'soort', 'verjaardag',
      'client_id', case when aantal = 1 then rijen->0->>'client_id' end,
      'client_ids', (select jsonb_agg(r->>'client_id') from jsonb_array_elements(rijen) as t(r))
    )))
  returning id into melding;

  update coach_verjaardag_log l set notification_id = melding
  where l.jaar = jaar_ and l.client_id in (select (r->>'client_id')::uuid from jsonb_array_elements(rijen) as t(r));

  return jsonb_build_object('dag', dag, 'jarig', aantal, 'tekst', tekst, 'notification_id', melding);
end
$$;

revoke all on function public.verjaardag_kandidaten(uuid, date) from public, anon, authenticated;
revoke all on function public.verstuur_verjaardagen(date, boolean) from public, anon, authenticated;

-- Bestaande pushtrigger: stuurt alleen 'soort' en 'client_id' mee als de rij die
-- in action_data heeft, voor de tik op de melding. Ontvanger blijft NEW.coach_id.
create or replace function public.push_on_coach_notification()
returns trigger
language plpgsql security definer
set search_path to 'public', 'net', 'extensions'
as $function$
BEGIN
  IF NEW.coach_id IS NOT NULL AND NEW.title IS NOT NULL THEN
    PERFORM net.http_post(
      url := 'https://xlaycpwpnhjmulfsnynh.supabase.co/functions/v1/send-push-notification',
      body := jsonb_build_object(
        'user_id', NEW.coach_id,
        'title',   NEW.title,
        'body',    COALESCE(NEW.message, ''),
        'data',    jsonb_build_object('notification_id', NEW.id, 'type', NEW.type)
                   || jsonb_strip_nulls(jsonb_build_object(
                        'soort',     NEW.action_data->>'soort',
                        'client_id', NEW.action_data->>'client_id'))
      ),
      headers := jsonb_build_object(
        'content-type', 'application/json',
        'x-push-secret', (select hook_secret from apns_config where id = 1)
      )
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- 08:00 Amsterdam is 06:00 UTC in de zomer en 07:00 UTC in de winter. 08 UTC is
-- de vangnetronde als een run mist; de log voorkomt dubbele meldingen.
select cron.schedule('verjaardag-coach', '0 6-8 * * *', 'select public.verstuur_verjaardagen()');
