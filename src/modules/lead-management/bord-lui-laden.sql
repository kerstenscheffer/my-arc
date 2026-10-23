-- Lui laden van het leadbord (23 okt 2026).
--
-- Drie secties (Nieuwe volgers, 3+ Dagen Stil, Follow up stil) bevatten ~95%
-- van alle leads (~10.800 van 11.600). Het bord haalde die elke keer volledig
-- op, terwijl je er alleen via zoeken of bewust iets in doet. Nu:
--  - secties tot p_drempel leads, of die in p_open staan: alle leads mee;
--  - grotere secties: alleen het aantal, leads = [] (knop "Open sectie").
-- Security invoker: RLS op call_leads / lead_section_items blijft bepalen wat
-- je ziet, net als bij get_kanban_board_light. Lege kolommen gaan eruit
-- (jsonb_strip_nulls): dat halveert de payload; de kaart leest ze als undefined.

create or replace function public.get_kanban_board_lui(
  p_drempel integer default 250,
  p_met_vrouwen boolean default true,
  p_open uuid[] default '{}'
)
returns jsonb
language sql
stable
set work_mem to '16MB'
as $function$
-- Alleen id's materialiseren en pas aan het eind de volle rij joinen, en de
-- leads per sectie met group by i.p.v. een subquery per sectie: 440 → 95 ms.
with zichtbaar as materialized (
  select l.id from call_leads l
  where l.deleted_at is null
    and (p_met_vrouwen or l.gender is null or l.gender <> 'female')
),
items as materialized (
  select si.* from lead_section_items si join zichtbaar z on z.id = si.lead_id
),
totaal as (
  select section_id, count(*) as total from items group by section_id
),
open_secties as (
  select section_id from totaal
  where total <= p_drempel or section_id = any(p_open)
),
sectie_leads as (
  select i.section_id,
         jsonb_agg(jsonb_strip_nulls(to_jsonb(l) - 'dm_node_history' - 'sales_call_notes')
           || jsonb_build_object(
                'position', i.position,
                'previous_section_id', i.previous_section_id,
                'previous_section_title', i.previous_section_title,
                'previous_section_color', i.previous_section_color,
                'moved_to_stale_at', i.moved_to_stale_at,
                'source_lead_magnet', case when lm.id is null then null
                   else jsonb_build_object('id', lm.id, 'name', lm.name) end,
                'outreach_campaign', case when oc.id is null then null
                   else jsonb_build_object('id', oc.id, 'name', oc.name, 'variant_tag', oc.variant_tag) end
              ) order by i.position, l.created_at desc) as leads
  from items i
  join open_secties o on o.section_id = i.section_id
  join call_leads l on l.id = i.lead_id
  left join lead_magnets lm       on lm.id = l.source_lead_magnet_id
  left join outreach_campaigns oc on oc.id = l.outreach_campaign_id
  group by i.section_id
),
unassigned_ids as (
  select z.id from zichtbaar z
  where not exists (select 1 from lead_section_items si where si.lead_id = z.id)
)
select jsonb_build_object(
  'sections', (select coalesce(jsonb_agg(
      to_jsonb(s) || jsonb_build_object('lead_count', coalesce(tt.total, 0), 'leads', coalesce(sl.leads, '[]'::jsonb))
      order by s.position), '[]'::jsonb)
    from lead_sections s
    left join totaal tt on tt.section_id = s.id
    left join sectie_leads sl on sl.section_id = s.id),
  'unassigned', jsonb_build_object(
    'lead_count', (select count(*) from unassigned_ids),
    'leads', case when (select count(*) from unassigned_ids) <= p_drempel
      then (select coalesce(jsonb_agg(jsonb_strip_nulls(to_jsonb(l) - 'dm_node_history' - 'sales_call_notes') order by l.created_at desc), '[]'::jsonb)
            from call_leads l join unassigned_ids u on u.id = l.id)
      else '[]'::jsonb end)
);
$function$;

-- Alle leads van één sectie, voor de knop "Open sectie". p_section_id null =
-- "Niet toegewezen".
create or replace function public.get_board_sectie(
  p_section_id uuid,
  p_met_vrouwen boolean default true
)
returns jsonb
language sql
stable
as $function$
  select case when p_section_id is null then (
    select coalesce(jsonb_agg(jsonb_strip_nulls(to_jsonb(l) - 'dm_node_history' - 'sales_call_notes') order by l.created_at desc), '[]'::jsonb)
    from call_leads l
    where l.deleted_at is null
      and (p_met_vrouwen or l.gender is null or l.gender <> 'female')
      and not exists (select 1 from lead_section_items si where si.lead_id = l.id)
  ) else (
    select coalesce(jsonb_agg(x.lead order by x.position), '[]'::jsonb)
    from (
      select si.position,
             jsonb_strip_nulls(to_jsonb(l) - 'dm_node_history' - 'sales_call_notes')
             || jsonb_build_object(
                  'position', si.position,
                  'previous_section_id', si.previous_section_id,
                  'previous_section_title', si.previous_section_title,
                  'previous_section_color', si.previous_section_color,
                  'moved_to_stale_at', si.moved_to_stale_at,
                  'source_lead_magnet', case when lm.id is null then null
                     else jsonb_build_object('id', lm.id, 'name', lm.name) end,
                  'outreach_campaign', case when oc.id is null then null
                     else jsonb_build_object('id', oc.id, 'name', oc.name, 'variant_tag', oc.variant_tag) end
                ) as lead
      from lead_section_items si
      join call_leads l on l.id = si.lead_id and l.deleted_at is null
      left join lead_magnets lm       on lm.id = l.source_lead_magnet_id
      left join outreach_campaigns oc on oc.id = l.outreach_campaign_id
      where si.section_id = p_section_id
        and (p_met_vrouwen or l.gender is null or l.gender <> 'female')
    ) x
  ) end;
$function$;

revoke execute on function public.get_kanban_board_lui(integer, boolean, uuid[]) from public, anon;
revoke execute on function public.get_board_sectie(uuid, boolean) from public, anon;
grant execute on function public.get_kanban_board_lui(integer, boolean, uuid[]) to authenticated;
grant execute on function public.get_board_sectie(uuid, boolean) to authenticated;
