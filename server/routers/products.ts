import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  archiveProduct,
  createProduct,
  deleteProduct,
  getAdminProduct,
  getStoreProduct,
  listAdminProducts,
  listStoreProducts,
  updateProduct,
} from "../db";
import { storagePut } from "../storage";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";

const productIdSchema = z.string().min(8).max(32);
const categorySchema = z.enum(["men", "women", "kids", "offers"]);
const publicFilterSchema = z.object({
  search: z.string().trim().max(180).optional(),
  category: categorySchema.optional(),
  size: z.number().int().min(30).max(50).optional(),
  color: z.string().trim().max(30).optional(),
  minPrice: z.number().int().min(0).max(10_000_000).optional(),
  maxPrice: z.number().int().min(0).max(10_000_000).optional(),
});

const productPayloadSchema = z.object({
  title: z.string().trim().min(2).max(180),
  category: categorySchema,
  price: z.number().int().min(0).max(10_000_000),
  sizes: z.array(z.number().int().min(30).max(50)).min(1).max(16),
  colors: z.array(z.string().trim().min(1).max(30)).min(1).max(12),
  stockQuantity: z.number().int().min(0).max(100_000),
  availability: z.boolean(),
  imageUrl: z.string().min(1).max(500),
  imageKey: z.string().max(500).nullable().optional(),
  imageUrls: z.array(z.string().min(1).max(500)).min(1).max(8),
  imageKeys: z.array(z.string().min(1).max(500)).max(8).optional(),
});

const productUpdateSchema = productPayloadSchema.partial().extend({
  id: productIdSchema,
  isArchived: z.boolean().optional(),
});

function normalizeImageBase64(value: string) {
  const base64 = value.includes(",") ? value.split(",").at(-1)! : value;
  const bytes = Buffer.from(base64, "base64");
  if (!bytes.length || bytes.length > 6 * 1024 * 1024) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "حجم الصورة يجب ألا يتجاوز 6 ميجابايت." });
  }
  return bytes;
}

async function requireAdminProduct(id: string) {
  const product = await getAdminProduct(id);
  if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "المنتج غير موجود." });
  return product;
}

export const productsRouter = router({
  list: publicProcedure.input(publicFilterSchema.optional()).query(({ input }) => {
    if (input?.minPrice !== undefined && input.maxPrice !== undefined && input.minPrice > input.maxPrice) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "الحد الأدنى للسعر أكبر من الحد الأقصى." });
    }
    return listStoreProducts(input);
  }),
  byId: publicProcedure.input(z.object({ id: productIdSchema })).query(async ({ input }) => {
    const product = await getStoreProduct(input.id);
    if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "المنتج غير متاح." });
    return product;
  }),
  adminList: adminProcedure.query(() => listAdminProducts()),
  adminById: adminProcedure.input(z.object({ id: productIdSchema })).query(async ({ input }) => {
    const product = await getAdminProduct(input.id);
    if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "المنتج غير موجود." });
    return product;
  }),
  create: adminProcedure.input(productPayloadSchema).mutation(({ input }) => createProduct(input)),
  update: adminProcedure.input(productUpdateSchema).mutation(async ({ input }) => {
    const { id, ...changes } = input;
    await requireAdminProduct(id);
    return updateProduct(id, changes);
  }),
  archive: adminProcedure.input(z.object({ id: productIdSchema })).mutation(async ({ input }) => {
    await requireAdminProduct(input.id);
    return archiveProduct(input.id);
  }),
  delete: adminProcedure.input(z.object({ id: productIdSchema })).mutation(async ({ input }) => {
    await requireAdminProduct(input.id);
    return deleteProduct(input.id);
  }),
  uploadImage: adminProcedure
    .input(
      z.object({
        filename: z.string().trim().min(1).max(100),
        contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
        base64Data: z.string().min(20).max(8_500_000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const safeFilename = input.filename.replace(/[^a-zA-Z0-9._-]/g, "-");
      const objectName = `products/${ctx.user.id}/${Date.now()}-${safeFilename}`;
      return storagePut(objectName, normalizeImageBase64(input.base64Data), input.contentType);
    }),
});

export type ProductPayload = z.infer<typeof productPayloadSchema>;
