# Atef / عاطف Footwear Store

**Atef / عاطف** is a mobile-first Arabic RTL footwear storefront with database-backed catalog filters, selectable multi-image product galleries, WhatsApp inquiries, and a protected stock-management dashboard.

## Product capabilities

| Area | Included behavior |
|---|---|
| Storefront | Arabic RTL layout, Cairo typography, category navigation, search, filters for size/color/category/price, availability badges, and an inquiry drawer. |
| Product page | Multi-image gallery, selected size and color controls, and a `wa.me` URL whose message contains the exact chosen product, size, and color. |
| Inventory | Admin-only product creation, editing, stock increments/decrements, availability changes, archive/delete controls, and up to eight S3-backed product images. |
| Security | Manus OAuth session handling and server-side `adminProcedure` enforcement for every inventory mutation. |
| Data | Drizzle schema and applied migrations for `products`, including JSON size/color/image-gallery fields. |

## Configuration

Set `VITE_STORE_WHATSAPP_NUMBER` in the project’s managed **Secrets** settings to the business WhatsApp number in international form. A leading `+` is safely normalized for `wa.me` links. The storefront uses this value to construct customer inquiry links; no message content is hard-coded.

The full-stack scaffold supplies the database, authentication, and storage runtime variables in its managed environment. For a self-hosted runtime, configure equivalents for `DATABASE_URL`, OAuth, and storage through that host’s secret manager; do not commit actual credentials.

## Development and verification

```bash
pnpm install
pnpm dev
pnpm test
pnpm check
pnpm build
```

The database migrations are tracked in `drizzle/migrations/`. Apply new schema changes by generating a Drizzle migration, reviewing its SQL, and applying it through the managed database migration workflow.

## Deployment note

This implementation uses the initialized **React/Vite + Express/tRPC + Drizzle + Manus OAuth + managed S3** runtime rather than the originally proposed Supabase/Next.js stack. It is ready for the project’s built-in managed deployment after a checkpoint is created.

> A direct Vercel deployment requires an Express-to-serverless adapter and replacements for the managed OAuth and S3 runtime helpers. Those dependencies are platform-specific, so this repository intentionally does not claim a one-click Vercel deployment that would leave authentication or image uploads nonfunctional. If Vercel is mandatory, migrate the runtime layer first or use the platform’s built-in hosting with a custom domain.

## Admin access

The project owner is assigned the `admin` role automatically on first sign-in. Other users can be promoted by changing their `users.role` value to `admin` in the managed database.
