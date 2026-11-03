-- supabase/rls-klant-coach-terugdraai.sql (3 nov 2026)
--
-- Zet de regels van rls-klant-coach-scheiding.sql terug naar de stand van
-- rls_backup_20261103. Alleen gebruiken als de klant-app ergens op breekt.

grant select, insert, update, delete on public.clients to anon;

do $$
declare p record; rol text;
begin
  for p in select tablename, policyname from pg_policies
           where schemaname = 'public'
             and policyname in ('rls_coach','rls_coach_update','rls_eigen','rls_gedeeld_lezen','rls_lezen',
                                'rls_gedeelde_maaltijd','rls_intake_anon','rls_eigen_lezen','rls_eigen_wijzigen','rls_eigen_toevoegen')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;

  for p in select b.* from public.rls_backup_20261103 b
           where not exists (select 1 from pg_policies c where c.schemaname = 'public'
                             and c.tablename = b.tablename and c.policyname = b.policyname)
  loop
    select string_agg(quote_ident(r), ',') into rol from unnest(p.roles) r;
    execute format('create policy %I on public.%I as %s for %s to %s %s %s',
      p.policyname, p.tablename, p.permissive, p.cmd, rol,
      case when p.qual is not null then 'using (' || p.qual || ')' else '' end,
      case when p.with_check is not null then 'with check (' || p.with_check || ')' else '' end);
  end loop;
end $$;
