-- Grubbix Warehouse — editable store settings + storage access rules

create table if not exists public.store_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now(),
  constraint store_settings_key_format check (key ~ '^[a-z0-9_]+$')
);

drop trigger if exists store_settings_set_updated_at on public.store_settings;
create trigger store_settings_set_updated_at
  before update on public.store_settings
  for each row execute function public.set_updated_at();

alter table public.store_settings enable row level security;

drop policy if exists store_settings_public_read on public.store_settings;
create policy store_settings_public_read on public.store_settings
  for select using (true);

drop policy if exists store_settings_admin_write on public.store_settings;
create policy store_settings_admin_write on public.store_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage: the "product-images" bucket is assumed to already exist.
-- Public read for published product images; writes restricted to admins.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists product_images_storage_public_read on storage.objects;
create policy product_images_storage_public_read on storage.objects
  for select
  using (bucket_id = 'product-images');

drop policy if exists product_images_storage_admin_write on storage.objects;
create policy product_images_storage_admin_write on storage.objects
  for insert
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists product_images_storage_admin_update on storage.objects;
create policy product_images_storage_admin_update on storage.objects
  for update
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists product_images_storage_admin_delete on storage.objects;
create policy product_images_storage_admin_delete on storage.objects
  for delete
  using (bucket_id = 'product-images' and public.is_admin());
