-- Grubbix Warehouse — core schema
-- Tables: categories, products, product_images, admin_roles
-- Prices are stored as integer kobo (never floating point).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Security definer so that policies can check administrator membership without
-- recursing through the admin_roles RLS policy.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_roles where user_id = auth.uid()
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- admin_roles
-- ---------------------------------------------------------------------------

create table if not exists public.admin_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'admin' check (role in ('admin', 'owner')),
  created_at timestamptz not null default now()
);

comment on table public.admin_roles is
  'Administrators allowed to use the admin portal. Rows are created with the service role only.';

alter table public.admin_roles enable row level security;

drop policy if exists admin_roles_self_read on public.admin_roles;
create policy admin_roles_self_read on public.admin_roles
  for select
  using (auth.uid() = user_id or public.is_admin());

-- No insert/update/delete policies: only the service role can grant admin access.

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_not_blank check (length(btrim(name)) > 0)
);

create index if not exists categories_sort_order_idx on public.categories (sort_order, name);

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

alter table public.categories enable row level security;

drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories
  for select using (true);

drop policy if exists categories_admin_write on public.categories;
create policy categories_admin_write on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  category_id uuid references public.categories (id) on delete set null,
  price_kobo bigint not null check (price_kobo >= 0),
  specifications jsonb not null default '{}'::jsonb
    check (jsonb_typeof(specifications) = 'object'),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_available boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_name_not_blank check (length(btrim(name)) > 0)
);

create index if not exists products_category_id_idx on public.products (category_id);
create index if not exists products_created_at_idx on public.products (created_at desc);
create index if not exists products_visible_idx on public.products (is_available, stock_quantity);
create index if not exists products_featured_idx on public.products (is_featured) where is_featured;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

alter table public.products enable row level security;

drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
  for select
  using (public.is_admin() or (is_available and stock_quantity > 0));

drop policy if exists products_admin_write on public.products;
create policy products_admin_write on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- product_images
-- ---------------------------------------------------------------------------

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null,
  alt_text text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_id_idx
  on public.product_images (product_id, sort_order);

alter table public.product_images enable row level security;

drop policy if exists product_images_public_read on public.product_images;
create policy product_images_public_read on public.product_images
  for select
  using (
    public.is_admin()
    or exists (
      select 1
      from public.products p
      where p.id = product_images.product_id
        and p.is_available
        and p.stock_quantity > 0
    )
  );

drop policy if exists product_images_admin_write on public.product_images;
create policy product_images_admin_write on public.product_images
  for all using (public.is_admin()) with check (public.is_admin());
