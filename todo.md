# Project TODO

- [x] Establish the Arabic RTL design system, global font, and responsive application shell.
- [x] Add a Drizzle `products` table with inventory, option, availability, and image reference fields.
- [x] Generate and apply the products database migration through the managed database workflow.
- [x] Implement public product listing and detail procedures with live filtering support.
- [x] Implement admin-only product creation, update, archive, delete, and image-upload procedures.
- [x] Add typed server-side product filtering for keyword, category, size, color, and price range.
- [x] Return explicit not-found errors for invalid admin update, archive, and delete requests.
- [x] Build the mobile-first Atef / عاطف storefront header, search, category navigation, filters, product grid, and inquiry drawer.
- [x] Build the product detail gallery, option selectors, and dynamic WhatsApp inquiry link.
- [x] Extend products and the admin interface to support multiple uploaded product images for a genuine selectable gallery.
- [x] Build a Manus OAuth-protected admin dashboard using the provided dashboard layout and role checks.
- [x] Connect dashboard product CRUD forms, stock controls, availability toggle, and S3 image uploads.
- [x] Add unit coverage for filtering, authorization, and WhatsApp-link construction.
- [x] Validate desktop and mobile rendering, type safety, server behavior, and database interaction.
- [x] Visually validate product detail gallery, selectors, and WhatsApp CTA on desktop and mobile using a temporary product.
- [x] Exercise create, update, archive, and delete against the managed database and S3, then remove the temporary verification product.
- [x] Document environment variables and GitHub/Vercel handoff steps, then create a delivery checkpoint.
- [x] Push the final validated source to the requested private GitHub repository.
- [x] Connect the provided `atefshoes14-cmyk/atef-footwear-store` remote and push the release commit to `main`.
- [x] Verify the updated GitHub write access and push the prepared `main` commits.

## Atef Shoes rebuild

- [x] Replace the visual system with the exact Atef Shoes burgundy, cream, gold, and bilingual 1969 brand identity.
- [x] Update storefront navigation and catalog taxonomy for men, women, kids, bags, and offers.
- [x] Add sale pricing, stock-state filtering, and size 36–45 or N/A catalog controls.
- [x] Implement the multi-item cart drawer with size/color selections, quantity controls, and totals.
- [x] Implement cash-on-delivery customer checkout with name, phone, and detailed delivery address.
- [x] Persist customer orders with Pending status and reduce product inventory transactionally.
- [x] Add protected order management with status controls for Pending, Shipped, Delivered, and Cancelled.
- [x] Extend protected product CRUD for sale price, bags/N/A sizes, image URL/upload, and stock status.
- [x] Seed six realistic Atef launch products and verify they render from the database.
- [x] Add tests and complete responsive, checkout, WhatsApp, admin, and order-flow validation.
- [x] Save a new rebuilt checkpoint and push the updated source to GitHub.

- [x] Add credential-backed username/password login for `/admin` in addition to server-side admin role enforcement.
- [x] Fix password-authenticated admin logout so the custom session cookie is always cleared.
- [x] Add a Vitest lifecycle test for admin login, access, logout, and revoked access.
- [x] Add a manual image URL field to the protected product form and preserve it through CRUD validation.
- [x] Extend the admin auth lifecycle test to assert access is denied after the cleared session cookie.
- [x] Exercise authenticated admin product/order UI and browser checkout/status flows, then record the validation.

## Storefront header and catalog refinement

- [x] Remove the public storefront filter sidebar and expand the product grid across the full container.
- [x] Upload and reference the supplied Atef banner and official square logo through managed project asset URLs.
- [x] Replace the public header’s temporary mark with the supplied official logo and banner-led brand treatment.
- [x] Validate the revised desktop and mobile storefront, then save and push the refined delivery checkpoint.

## Supabase admin and deployment assessment

- [x] Compare the current Manus-managed authentication, database, and storage architecture with the requested Supabase implementation.
- [x] Enable the Supabase integration only after user confirmation and connect the correct Supabase project credentials.
- [x] Define and apply Supabase role, RLS, storage-bucket, inventory-option, product, and order policies.
- [x] Update the protected admin product and order workflows to use the approved Supabase data and storage integration.
- [x] Validate administration security, role access, RLS behavior, and deployment-compatible source handoff.
- [x] Revalidate the newly added Supabase public key against the project REST endpoint.
- [x] Evaluate the initially supplied Supabase publishable key, record its REST rejection, and replace it with the newly issued validated key.
- [x] Normalize the supplied `/rest/v1/` Data API endpoint to the Supabase project root before the final credentials test.
- [x] Apply and validate the newly issued Supabase publishable key from the user.
- [x] Create and promote the first Supabase Auth administrator, then validate the authenticated dashboard and order-management flows end to end.
- [x] Preserve existing Supabase Storage gallery images during product edits, with explicit per-image removal controls.
- [x] Create a controlled storefront COD verification order, review it in `/admin/orders`, and confirm an allowed status transition.
- [x] Exercise an authenticated Supabase admin product mutation and verify the public catalog reflects the authorized change.
- [x] Record anonymous RLS write-denial checks for products, orders, and Supabase Storage.
- [x] Replace destructive variant recreation in admin product edits with order-safe updates that preserve variants referenced by historical order items.
- [x] Verify the restored authorized product stock from the public Supabase product page after the admin update.
- [x] Diagnose the Vercel blank screen and add a production configuration notice that replaces the startup crash.
- [x] Add the Supabase Vite variables to Vercel, redeploy the latest GitHub revision, and verify the storefront loads six Supabase products in production.
