# Atef Shoes — Supabase Handoff

The storefront, checkout, product administration, order administration, and product-image storage use the Supabase project configured in this application. The public browser client requires only the project URL and publishable key; it must never contain a Supabase service-role key.

## Applied database changes

The following repository files are the source of truth for the current Supabase configuration.

| File | Purpose |
| --- | --- |
| `supabase/migrations/20260818_atef_admin_schema.sql` | Tables, product variants, images, orders, order line items, RLS rules, `product-images` bucket, and the atomic `place_order` function. |
| `supabase/migrations/20260818_harden_function_exposure.sql` | Moves authorization helpers into a private schema and limits their public exposure. |
| `supabase/seed.sql` | The six launch products, twelve inventory variants, and catalog image metadata. |

## Production environment variables

Configure the following **Vite** variables in the production host before publishing. Use the root project URL, not the `/rest/v1/` endpoint.

| Variable | Required value |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://jycfcyvmmwsipivadhok.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | The current Supabase publishable key for this project. |
| `VITE_STORE_WHATSAPP_NUMBER` | `01007891081` |

> Do not place a Supabase service-role key in a `VITE_` variable or in the client source code.

## Activate the first store administrator

The interface intentionally rejects every account until the account has an `admin` profile role. This prevents a valid ordinary Supabase user from accessing product, order, or storage administration.

1. In the Supabase dashboard, open **Authentication → Users → Add user** and create the store manager's email/password account. Use a real mailbox controlled by the store.
2. Copy the created user's UUID.
3. In **SQL Editor**, run the following statement after replacing the placeholder UUID:

```sql
update public.profiles
set role = 'admin', full_name = 'مدير عاطف'
where id = 'REPLACE_WITH_AUTH_USER_UUID';
```

4. Sign in at `/admin` using that email and password. The account should see the products dashboard and `/admin/orders`; any account without the `admin` role should be signed out and denied access.

## Final deployment check

After activating the administrator, confirm one complete administrator flow: edit a seeded product without removing its existing gallery, change an order status, upload a new product image, and confirm the public storefront remains readable while protected tables reject unauthenticated writes. The product editor preserves every existing gallery image unless the administrator deliberately removes it with the image-level **×** control.
