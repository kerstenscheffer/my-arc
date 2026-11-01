-- Content-autopilot → Metricool-draft (1 nov 2026).
-- Alleen toevoegen (oude app-versies blijven werken).
-- Edge function: supabase/functions/metricool-draft. Script: scripts/content-autopilot.mjs metricool.

alter table public.content_items add column if not exists metricool_post_id text;
alter table public.content_items add column if not exists metricool_link text;
alter table public.content_items add column if not exists metricool_at timestamptz;

-- Privé bucket: Metricool krijgt alleen een ondertekende URL van 24 uur.
insert into storage.buckets (id, name, public) values ('metricool-drafts', 'metricool-drafts', false)
on conflict (id) do nothing;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and policyname = 'mcd_lees') then
    create policy mcd_lees on storage.objects for select to authenticated
      using (bucket_id = 'metricool-drafts' and auth.uid() = public.content_eigenaar());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and policyname = 'mcd_schrijf') then
    create policy mcd_schrijf on storage.objects for insert to authenticated
      with check (bucket_id = 'metricool-drafts' and auth.uid() = public.content_eigenaar());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and policyname = 'mcd_wijzig') then
    create policy mcd_wijzig on storage.objects for update to authenticated
      using (bucket_id = 'metricool-drafts' and auth.uid() = public.content_eigenaar());
  end if;
end $$;
