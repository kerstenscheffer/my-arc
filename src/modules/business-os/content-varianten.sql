-- src/modules/business-os/content-varianten.sql
--
-- Privé preview van autopilot-varianten (1 nov 2026, uitgevoerd via MCP).
-- Het script zet elke variant in de privé bucket content-varianten en het pad
-- in content_items.autopilot_preview. Het Autopilot-paneel speelt hem af via
-- een ondertekende URL. De publiceer-cron leest alleen autopilot_video, dus
-- een preview komt nooit op Instagram. Alleen toevoegen, niets weggehaald.

alter table public.content_items add column if not exists autopilot_preview text; -- <eigenaar>/<id>/variant.mp4 in content-varianten

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('content-varianten', 'content-varianten', false, 209715200, array['video/mp4', 'image/jpeg'])
on conflict (id) do nothing;

-- Eerste map = eigenaar; content_eigenaar() geeft teamleden de eigenaar terug.
create policy cv_lees on storage.objects for select to authenticated
  using (bucket_id = 'content-varianten' and (storage.foldername(name))[1] = content_eigenaar()::text);
create policy cv_schrijf on storage.objects for insert to authenticated
  with check (bucket_id = 'content-varianten' and (storage.foldername(name))[1] = content_eigenaar()::text);
create policy cv_wijzig on storage.objects for update to authenticated
  using (bucket_id = 'content-varianten' and (storage.foldername(name))[1] = content_eigenaar()::text);
