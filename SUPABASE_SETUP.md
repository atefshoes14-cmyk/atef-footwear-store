# Atef Shoes — Supabase Handoff

The storefront, checkout, product administration, order administration, and product-image storage use the Supabase project configured in this application. The public browser client requires only the project URL and publishable key; it must never contain a Supabase service-role key.

## Applied database changes

The following repository files are the source of truth for the current Supabase configuration.

| File | Purpose |
| --- | --- |
| `supabase/migrations/20260818_atef_admin_schema.sql` | Tables, product variants, images, orders, order line items, RLS rules, `product-images` bucket, and the atomic `place_order` function. |
| `supabase/migrations/20260818_harden_function_exposure.sql` | Moves authorization helpers into a private schema and limits their public exposure. |
| `supabase/migrations/20260818_customer_order_tracking.sql` | Adds the public `track_orders_by_phone` RPC used by `/orders`; it returns only order ID, status, total, date, and item summaries. |
| `supabase/seed.sql` | The six launch products, twelve inventory variants, and catalog image metadata. |

## Production environment variables

Configure the following **Vite** variables in the production host before publishing. Use the root project URL, not the `/rest/v1/` endpoint.

| Variable | Required value |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://jycfcyvmmwsipivadhok.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | The current Supabase publishable key for this project. |
| `VITE_STORE_WHATSAPP_NUMBER` | `01007891081` |

> Do not place a Supabase service-role key in a `VITE_` variable or in the client source code.

### Vercel configuration

For the Vercel project, open **Settings → Environment Variables** and add the three variables above to **Production**, **Preview**, and **Development** as applicable. The browser bundle reads `VITE_` variables **during the Vercel build**, so adding them requires a fresh deployment after saving. In the Vercel dashboard, use **Deployments → Redeploy** on the latest deployment after setting the values. A missing URL or publishable key now shows an Arabic setup screen instead of a blank page.

The repository also includes `vercel.json`, which routes direct requests such as `/admin` and `/admin/orders` back to the React entry document. This lets Wouter render the protected client-side route rather than Vercel returning `404 NOT_FOUND` before the application starts.

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

## Verification record

On 18 August 2026, a confirmed Supabase account was promoted to `profiles.role = 'admin'` and tested through the public application. The authenticated account loaded the protected products dashboard with all six seeded products and their twelve variants, and `/admin/orders` loaded the protected empty-state view for the current zero-order database. After clearing the browser session, `/admin/orders` returned to the email/password gate, confirming that protected-route access is session dependent. No password is recorded in this repository.

The subsequent end-to-end validation created a clearly marked cash-on-delivery verification order through the public checkout. It contained one `سنيكرز أبيض يومي`, size `40`, color `أبيض`, for `1,190` EGP. The promoted manager read the customer, item, and total from `/admin/orders`, changed its status from `pending` to `cancelled`, and then restored the temporarily reduced variant quantity from `9` to `10`. The verification order remains cancelled for auditability and is not a fulfilment request.

The product editor was also validated with this historical order attached. Its variant-update logic now preserves existing variant IDs, updates them in place, and refuses removal of a variant referenced by an order item. This protects past order lines and allows administrators to adjust stock or product data safely. Existing gallery rows remain visible and are retained unless explicitly removed.

After the authorized restoration to 10 units for the ordered size-40 variant, the customer-facing product page reloaded from Supabase with the product, both size options (`40` and `42`), its existing image, sale price, and the **in-stock** state intact.

Anonymous REST write checks were denied for `products` and `orders` (HTTP `401`) and the `product-images` Storage object write was denied by a row-level security policy (Storage `AccessDenied`). Public catalog read and public checkout remained available by design.

### Supabase security advisor note

The latest advisor report contains warnings for the public `place_order` and `track_orders_by_phone` `SECURITY DEFINER` functions. These exposures are **intentional**: guest checkout needs `place_order`, and the requested guest tracking page needs a phone lookup. The tracking RPC validates a practical phone length and intentionally returns no name, phone, address, or customer profile—only the status, date, total, and ordered-item summaries. Revoking anonymous execution would disable the corresponding customer feature. The other remaining warning is that leaked-password protection is disabled in Supabase Auth; enable it in the Supabase Auth password-security settings when convenient. See the relevant [Supabase linter guidance](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable) and [password-protection guidance](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
