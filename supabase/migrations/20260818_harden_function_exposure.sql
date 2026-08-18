-- Keep internal trigger/RLS helpers outside the exposed PostgREST schema.
create schema if not exists private;

alter function public.handle_new_user() set schema private;
alter function public.is_admin() set schema private;
alter function public.touch_updated_at() set schema private;

alter function private.handle_new_user() set search_path = public;
alter function private.is_admin() set search_path = public;
alter function private.touch_updated_at() set search_path = public;
alter function public.place_order(text, text, text, jsonb) set search_path = public;

revoke all on function private.handle_new_user() from public, anon, authenticated;
revoke all on function private.is_admin() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

-- This RPC is intentionally public for guest cash-on-delivery checkout.
revoke all on function public.place_order(text, text, text, jsonb) from public;
grant execute on function public.place_order(text, text, text, jsonb) to anon, authenticated;

drop policy if exists "profiles_self_or_admin_read" on public.profiles;
create policy "profiles_self_or_admin_read" on public.profiles for select to authenticated using (id = auth.uid() or private.is_admin());
drop policy if exists "profiles_admin_manage" on public.profiles;
create policy "profiles_admin_manage" on public.profiles for all to authenticated using (private.is_admin()) with check (private.is_admin());

drop policy if exists "products_public_read_active" on public.products;
drop policy if exists "products_admin_manage" on public.products;
create policy "products_public_read_active" on public.products for select to anon, authenticated using (is_active);
create policy "products_admin_read" on public.products for select to authenticated using (private.is_admin());
create policy "products_admin_manage" on public.products for all to authenticated using (private.is_admin()) with check (private.is_admin());

drop policy if exists "variants_public_read_active_products" on public.product_variants;
drop policy if exists "variants_admin_manage" on public.product_variants;
create policy "variants_public_read_active_products" on public.product_variants for select to anon, authenticated using (
  exists (select 1 from public.products where products.id = product_variants.product_id and products.is_active)
);
create policy "variants_admin_read" on public.product_variants for select to authenticated using (private.is_admin());
create policy "variants_admin_manage" on public.product_variants for all to authenticated using (private.is_admin()) with check (private.is_admin());

drop policy if exists "images_public_read_active_products" on public.product_images;
drop policy if exists "images_admin_manage" on public.product_images;
create policy "images_public_read_active_products" on public.product_images for select to anon, authenticated using (
  exists (select 1 from public.products where products.id = product_images.product_id and products.is_active)
);
create policy "images_admin_read" on public.product_images for select to authenticated using (private.is_admin());
create policy "images_admin_manage" on public.product_images for all to authenticated using (private.is_admin()) with check (private.is_admin());

drop policy if exists "orders_customer_or_admin_read" on public.orders;
drop policy if exists "orders_admin_manage" on public.orders;
create policy "orders_customer_or_admin_read" on public.orders for select to authenticated using (customer_id = auth.uid() or private.is_admin());
create policy "orders_admin_manage" on public.orders for all to authenticated using (private.is_admin()) with check (private.is_admin());

drop policy if exists "order_items_customer_or_admin_read" on public.order_items;
drop policy if exists "order_items_admin_manage" on public.order_items;
create policy "order_items_customer_or_admin_read" on public.order_items for select to authenticated using (
  private.is_admin() or exists (select 1 from public.orders where orders.id = order_items.order_id and orders.customer_id = auth.uid())
);
create policy "order_items_admin_manage" on public.order_items for all to authenticated using (private.is_admin()) with check (private.is_admin());

drop policy if exists "product_images_admin_insert" on storage.objects;
drop policy if exists "product_images_admin_update" on storage.objects;
drop policy if exists "product_images_admin_delete" on storage.objects;
create policy "product_images_admin_insert" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and private.is_admin());
create policy "product_images_admin_update" on storage.objects for update to authenticated using (bucket_id = 'product-images' and private.is_admin()) with check (bucket_id = 'product-images' and private.is_admin());
create policy "product_images_admin_delete" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and private.is_admin());
