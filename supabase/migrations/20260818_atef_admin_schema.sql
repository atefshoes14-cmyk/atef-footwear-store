-- Atef Shoes: Supabase data, security, storage, and checkout schema.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 180),
  description text not null default '',
  category text not null check (category in ('men', 'women', 'kids', 'bags', 'offers')),
  price numeric(12,2) not null check (price >= 0),
  sale_price numeric(12,2) check (sale_price is null or (sale_price >= 0 and sale_price <= price)),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null default 'N/A' check (size = 'N/A' or size ~ '^(3[6-9]|4[0-5])$'),
  color text not null check (char_length(color) between 2 and 50),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  sku text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, size, color)
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  alt_text text,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  unique (product_id, storage_path)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id) on delete set null,
  full_name text not null check (char_length(full_name) between 2 and 120),
  phone text not null check (char_length(phone) between 8 and 32),
  address text not null check (char_length(address) between 8 and 500),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'shipping', 'delivered', 'cancelled')),
  total_amount numeric(12,2) not null check (total_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  product_title text not null,
  size text not null,
  color text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  created_at timestamptz not null default now()
);

create index if not exists products_active_category_idx on public.products (is_active, category);
create index if not exists variants_product_idx on public.product_variants (product_id);
create index if not exists orders_status_created_idx on public.orders (status, created_at desc);
create index if not exists order_items_order_idx on public.order_items (order_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles for each row execute procedure public.touch_updated_at();
drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at before update on public.products for each row execute procedure public.touch_updated_at();
drop trigger if exists variants_touch_updated_at on public.product_variants;
create trigger variants_touch_updated_at before update on public.product_variants for each row execute procedure public.touch_updated_at();
drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at before update on public.orders for each row execute procedure public.touch_updated_at();

-- A public checkout RPC creates pending COD orders atomically and decrements stock.
create or replace function public.place_order(
  p_full_name text,
  p_phone text,
  p_address text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_order_id uuid;
  v_item jsonb;
  v_variant public.product_variants%rowtype;
  v_product public.products%rowtype;
  v_quantity integer;
  v_unit_price numeric(12,2);
  v_total numeric(12,2) := 0;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order must include at least one item';
  end if;

  insert into public.orders (customer_id, full_name, phone, address, total_amount)
  values (auth.uid(), p_full_name, p_phone, p_address, 0)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::integer;
    if v_quantity is null or v_quantity < 1 then
      raise exception 'Invalid quantity';
    end if;

    select * into v_variant from public.product_variants
    where id = (v_item ->> 'variant_id')::uuid
    for update;

    if not found or v_variant.stock_quantity < v_quantity then
      raise exception 'Selected variant is unavailable';
    end if;

    select * into v_product from public.products
    where id = v_variant.product_id and is_active = true;

    if not found then
      raise exception 'Product is unavailable';
    end if;

    v_unit_price := coalesce(v_product.sale_price, v_product.price);
    update public.product_variants
      set stock_quantity = stock_quantity - v_quantity
      where id = v_variant.id;

    insert into public.order_items (order_id, product_id, variant_id, product_title, size, color, quantity, unit_price)
    values (v_order_id, v_product.id, v_variant.id, v_product.title, v_variant.size, v_variant.color, v_quantity, v_unit_price);
    v_total := v_total + (v_unit_price * v_quantity);
  end loop;

  update public.orders set total_amount = v_total where id = v_order_id;
  return v_order_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "profiles_self_or_admin_read" on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "profiles_admin_manage" on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "products_public_read_active" on public.products for select to anon, authenticated using (is_active or public.is_admin());
create policy "products_admin_manage" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "variants_public_read_active_products" on public.product_variants for select to anon, authenticated using (
  exists (select 1 from public.products where products.id = product_variants.product_id and (products.is_active or public.is_admin()))
);
create policy "variants_admin_manage" on public.product_variants for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "images_public_read_active_products" on public.product_images for select to anon, authenticated using (
  exists (select 1 from public.products where products.id = product_images.product_id and (products.is_active or public.is_admin()))
);
create policy "images_admin_manage" on public.product_images for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "orders_customer_or_admin_read" on public.orders for select to authenticated using (customer_id = auth.uid() or public.is_admin());
create policy "orders_admin_manage" on public.orders for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "order_items_customer_or_admin_read" on public.order_items for select to authenticated using (
  public.is_admin() or exists (select 1 from public.orders where orders.id = order_items.order_id and orders.customer_id = auth.uid())
);
create policy "order_items_admin_manage" on public.order_items for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

create policy "product_images_public_read" on storage.objects for select to public using (bucket_id = 'product-images');
create policy "product_images_admin_insert" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());
create policy "product_images_admin_update" on storage.objects for update to authenticated using (bucket_id = 'product-images' and public.is_admin()) with check (bucket_id = 'product-images' and public.is_admin());
create policy "product_images_admin_delete" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());

alter publication supabase_realtime add table public.products, public.product_variants, public.orders;
