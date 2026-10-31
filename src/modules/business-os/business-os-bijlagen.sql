-- Bijlagen in de Business OS-chat (31 okt 2026). Gedraaid via execute_sql.
-- Private bucket, map per coach (<uid>/<uuid>-<naam>), max 20 MB.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('business-os-bijlagen', 'business-os-bijlagen', false, 20971520, array[
 'application/pdf','text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-excel',
 'text/plain','image/png','image/jpeg','image/heic','image/heif'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Lezen: eigen map + team. Uploaden: alleen in de eigen map. (Tekstvergelijking,
-- geen ::uuid-cast: die zou bij andere buckets kunnen ontploffen.)
create policy "bos_bijlagen_lezen" on storage.objects for select to authenticated
  using (bucket_id = 'business-os-bijlagen' and (storage.foldername(name))[1] = any(public.team_coach_ids(auth.uid())::text[]));
create policy "bos_bijlagen_uploaden" on storage.objects for insert to authenticated
  with check (bucket_id = 'business-os-bijlagen' and (storage.foldername(name))[1] = auth.uid()::text);

alter table public.business_os_opdrachten add column if not exists bijlagen jsonb;

-- Opruimen: elke nacht 03:15 UTC, edge function business-os-bijlagen-opruimen
-- (Storage API; direct deleten in storage.objects blokkeert protect_delete).
select cron.schedule('business-os-bijlagen-opruimen', '15 3 * * *', $$
  select net.http_post(
    url := 'https://xlaycpwpnhjmulfsnynh.supabase.co/functions/v1/business-os-bijlagen-opruimen',
    body := '{}'::jsonb,
    headers := jsonb_build_object('content-type', 'application/json', 'Authorization', 'Bearer <anon-sleutel>')
  )
$$);
