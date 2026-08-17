import { TRPCError } from "@trpc/server";
import { ADMIN_COOKIE_NAME, adminSessionTtlSeconds, createAdminSession, validateAdminCredentials } from "../adminAuth";
import { getSessionCookieOptions } from "../_core/cookies";
import { z } from "zod";
import { ORDER_STATUSES, type OrderStatus } from "../../drizzle/schema";
import {
  archiveProduct,
  createOrder,
  createProduct,
  deleteProduct,
  getAdminProduct,
  getOrder,
  getStoreProduct,
  listAdminProducts,
  listOrders,
  listStoreProducts,
  updateOrderStatus,
  updateProduct,
} from "../db";
import { storagePut } from "../storage";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";

const productIdSchema = z.string().min(3).max(64);
const categorySchema = z.enum(["men", "women", "kids", "bags", "offers"]);
const sizeSchema = z.union([z.number().int().min(28).max(45), z.literal("N/A")]);
const publicFilterSchema = z.object({
  search: z.string().trim().max(180).optional(),
  category: categorySchema.optional(),
  size: sizeSchema.optional(),
  color: z.string().trim().max(30).optional(),
  minPrice: z.number().int().min(0).max(10_000_000).optional(),
  maxPrice: z.number().int().min(0).max(10_000_000).optional(),
  inStock: z.boolean().optional(),
});

const productPayloadSchema = z.object({
  title: z.string().trim().min(2).max(180),
  category: categorySchema,
  price: z.number().int().min(0).max(10_000_000),
  salePrice: z.number().int().min(0).max(10_000_000).nullable().optional(),
  sizes: z.array(sizeSchema).max(16),
  colors: z.array(z.string().trim().min(1).max(30)).min(1).max(12),
  stockQuantity: z.number().int().min(0).max(100_000),
  availability: z.boolean(),
  imageUrl: z.string().min(1).max(500),
  imageKey: z.string().max(500).nullable().optional(),
  imageUrls: z.array(z.string().min(1).max(500)).min(1).max(8),
  imageKeys: z.array(z.string().max(500)).max(8).optional(),
});

const productUpdateSchema = productPayloadSchema.partial().extend({ id: productIdSchema, isArchived: z.boolean().optional() });
const checkoutItemSchema = z.object({ productId: productIdSchema, quantity: z.number().int().min(1).max(20), size: sizeSchema.optional(), color: z.string().trim().max(30).optional() });
const checkoutSchema = z.object({
  customerName: z.string().trim().min(2).max(255),
  phone: z.string().trim().min(8).max(20),
  address: z.string().trim().min(8).max(1000),
  items: z.array(checkoutItemSchema).min(1).max(50),
});

function normalizeImageBase64(value: string) {
  const base64 = value.includes(",") ? value.split(",").at(-1)! : value;
  const bytes = Buffer.from(base64, "base64");
  if (!bytes.length || bytes.length > 6 * 1024 * 1024) throw new TRPCError({ code: "BAD_REQUEST", message: "حجم الصورة يجب ألا يتجاوز 6 ميجابايت." });
  return bytes;
}

async function requireAdminProduct(id: string) {
  const product = await getAdminProduct(id);
  if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "المنتج غير موجود." });
  return product;
}

export const productsRouter = router({
  list: publicProcedure.input(publicFilterSchema.optional()).query(({ input }) => {
    if (input?.minPrice !== undefined && input.maxPrice !== undefined && input.minPrice > input.maxPrice) throw new TRPCError({ code: "BAD_REQUEST", message: "الحد الأدنى للسعر أكبر من الحد الأقصى." });
    return listStoreProducts(input);
  }),
  byId: publicProcedure.input(z.object({ id: productIdSchema })).query(async ({ input }) => {
    const product = await getStoreProduct(input.id);
    if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "المنتج غير متاح." });
    return product;
  }),
  adminLogin: publicProcedure.input(z.object({ username: z.string().trim().min(1).max(80), password: z.string().min(8).max(200) })).mutation(({ ctx, input }) => {
    if (!validateAdminCredentials(input.username, input.password)) throw new TRPCError({ code: "UNAUTHORIZED", message: "اسم المستخدم أو كلمة المرور غير صحيحة." });
    ctx.res.cookie(ADMIN_COOKIE_NAME, createAdminSession(input.username), { ...getSessionCookieOptions(ctx.req), maxAge: adminSessionTtlSeconds * 1000 });
    return { success: true } as const;
  }),
  adminSession: publicProcedure.query(({ ctx }) => Boolean(ctx.adminSession || ctx.user?.role === "admin")),
  adminLogout: publicProcedure.mutation(({ ctx }) => { ctx.res.clearCookie(ADMIN_COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 }); return { success: true } as const; }),
  createOrder: publicProcedure.input(checkoutSchema).mutation(async ({ input }) => {
    try {
      return await createOrder(input);
    } catch (error) {
      throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "تعذر حفظ الطلب." });
    }
  }),
  getOrder: publicProcedure.input(z.object({ id: productIdSchema })).query(async ({ input }) => {
    const order = await getOrder(input.id);
    if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "الطلب غير موجود." });
    return order;
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
  uploadImage: adminProcedure.input(z.object({ filename: z.string().trim().min(1).max(100), contentType: z.enum(["image/jpeg", "image/png", "image/webp"]), base64Data: z.string().min(20).max(8_500_000) })).mutation(async ({ ctx, input }) => {
    const safeFilename = input.filename.replace(/[^a-zA-Z0-9._-]/g, "-");
    return storagePut(`products/${ctx.user.id}/${Date.now()}-${safeFilename}`, normalizeImageBase64(input.base64Data), input.contentType);
  }),
  orders: adminProcedure.query(() => listOrders()),
  orderById: adminProcedure.input(z.object({ id: productIdSchema })).query(async ({ input }) => {
    const order = await getOrder(input.id);
    if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "الطلب غير موجود." });
    return order;
  }),
  updateOrderStatus: adminProcedure.input(z.object({ id: productIdSchema, status: z.enum(ORDER_STATUSES) })).mutation(async ({ input }) => {
    const order = await getOrder(input.id);
    if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "الطلب غير موجود." });
    return updateOrderStatus(input.id, input.status as OrderStatus);
  }),
});

export type ProductPayload = z.infer<typeof productPayloadSchema>;
export type CheckoutPayload = z.infer<typeof checkoutSchema>;
