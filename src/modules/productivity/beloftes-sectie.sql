-- Beloftes automatisch in de sectie 'Beloftes call transcript' (10 nov 2026)
-- Taken met een titel die begint met 'Belofte' (call-verwerker / Gino) en zonder
-- section_id krijgen de sectie 'Beloftes call transcript' van dezelfde coach.
-- Alleen toevoegen: geen bestaande kolommen/triggers gewijzigd.

create or replace function public.productivity_belofte_sectie()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sectie uuid;
begin
  if new.section_id is null and new.title ilike 'Belofte%' then
    select s.id into v_sectie
    from public.productivity_sections s
    where s.coach_id = new.coach_id
      and s.title = 'Beloftes call transcript'
    order by s.created_at
    limit 1;

    if v_sectie is null and new.coach_id = '5a0135ac-3188-499d-8682-ed6a179e5541' then
      v_sectie := 'c9d9ef14-29a6-4be7-b95c-cee0377032b4';
    end if;

    if v_sectie is not null then
      new.section_id := v_sectie;
    end if;
  end if;
  return new;
end;
$$;

-- Live gezet 10 nov 2026 via execute_sql (trigger bestond nog niet).
create trigger trg_productivity_belofte_sectie
  before insert on public.productivity_tasks
  for each row execute function public.productivity_belofte_sectie();
