-- src/modules/business-os/business-os-agent.sql
--
-- Database-toegang voor de Business OS-chat (30 okt 2026).
--
-- business_os_lees(p_sql): de AI stelt zelf een SELECT-vraag. Veiligheid:
--   → security INVOKER: draait met de rechten (RLS) van de ingelogde coach;
--   → alleen coaches (get_my_portal_role);
--   → transaction_read_only = on vóór de query: ook functies die iets willen
--     schrijven falen, de hele aanroep is één read-only transactie;
--   → ingepakt als subquery: geen meerdere statements, geen schrijvende CTE's;
--   → statement_timeout 8 s, maximaal 200 rijen terug.
--
-- business_os_schema(p_tabel): tabellen of kolommen (met omschrijving) van het
-- public-schema, zodat de AI weet wat er bestaat. Alleen metadata.
--
-- Schrijven gaat NIET via SQL: de AI zet een voorstel klaar (tabel + filter +
-- velden) en Kerstens klik voert het uit via supabase-js met zijn eigen RLS.

create or replace function public.business_os_lees(p_sql text)
returns jsonb
language plpgsql volatile security invoker
set search_path = public
as $$
declare
  v_sql text := btrim(p_sql);
  v_res jsonb;
begin
  if public.get_my_portal_role() not in ('coach', 'both') then
    raise exception 'alleen voor coaches';
  end if;
  v_sql := regexp_replace(v_sql, ';\s*$', '');
  if v_sql !~* '^\s*(select|with)\s' then
    raise exception 'alleen SELECT-vragen';
  end if;
  if position(';' in v_sql) > 0 then
    raise exception 'één vraag tegelijk';
  end if;
  perform set_config('transaction_read_only', 'on', true);
  perform set_config('statement_timeout', '8000', true);
  execute format('select coalesce(jsonb_agg(t), ''[]''::jsonb) from (select * from (%s) q limit 200) t', v_sql)
    into v_res;
  return v_res;
end;
$$;

revoke all on function public.business_os_lees(text) from public, anon;
grant execute on function public.business_os_lees(text) to authenticated;

create or replace function public.business_os_schema(p_tabel text default null)
returns jsonb
language sql stable security definer
set search_path = public
as $$
  select case when p_tabel is null then (
    select coalesce(jsonb_agg(jsonb_build_object(
      'tabel', c.relname,
      'rijen', greatest(c.reltuples, 0)::bigint,
      'omschrijving', obj_description(c.oid, 'pg_class')
    ) order by c.relname), '[]'::jsonb)
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'v')
      and c.relname !~ '(backup|_bak|_old|_test)'
  ) else (
    select coalesce(jsonb_agg(jsonb_build_object(
      'kolom', a.attname,
      'type', format_type(a.atttypid, a.atttypmod),
      'omschrijving', col_description(a.attrelid, a.attnum)
    ) order by a.attnum), '[]'::jsonb)
    from pg_attribute a
    where a.attrelid = to_regclass('public.' || quote_ident(p_tabel))
      and a.attnum > 0 and not a.attisdropped
  ) end
  where public.get_my_portal_role() in ('coach', 'both')
$$;

revoke all on function public.business_os_schema(text) from public, anon;
grant execute on function public.business_os_schema(text) to authenticated;
