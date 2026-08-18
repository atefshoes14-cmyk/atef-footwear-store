-- Customer order tracking by phone number.
-- Deliberately returns no customer name, address, or phone number.
create or replace function public.track_orders_by_phone(p_phone text)
returns table (
  order_id uuid,
  status text,
  total_amount numeric,
  created_at timestamptz,
  items jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  with normalized_phone as (
    select regexp_replace(coalesce(trim(p_phone), ''), '\\D', '', 'g') as value
  )
  select
    o.id as order_id,
    o.status,
    o.total_amount,
    o.created_at,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'product_title', oi.product_title,
          'size', oi.size,
          'color', oi.color,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price
        ) order by oi.created_at
      ),
      '[]'::jsonb
    ) as items
  from public.orders o
  join normalized_phone np on char_length(np.value) between 8 and 15
  left join public.order_items oi on oi.order_id = o.id
  where regexp_replace(o.phone, '\\D', '', 'g') = np.value
  group by o.id
  order by o.created_at desc
  limit 20;
$$;

revoke all on function public.track_orders_by_phone(text) from public;
grant execute on function public.track_orders_by_phone(text) to anon, authenticated;
