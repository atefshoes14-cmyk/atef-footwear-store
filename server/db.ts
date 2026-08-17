import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { nanoid } from "nanoid";
import { InsertOrder, InsertProduct, InsertUser, OrderItem, OrderStatus, orders, products, users } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { filterStoreProducts } from "./productFilters";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حالياً.");
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach(field => {
    if (user[field] !== undefined) {
      const value = user[field] ?? null;
      values[field] = value;
      updateSet[field] = value;
    }
  });
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export type StoreProductFilters = {
  search?: string;
  category?: "men" | "women" | "kids" | "bags" | "offers";
  size?: number | "N/A";
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
};

export async function listStoreProducts(filters: StoreProductFilters = {}) {
  const db = await requireDb();
  const result = await db.select().from(products).where(and(eq(products.isArchived, false), eq(products.availability, true))).orderBy(desc(products.createdAt));
  return filterStoreProducts(result, filters);
}

export async function listAdminProducts() {
  const db = await requireDb();
  return db.select().from(products).orderBy(desc(products.updatedAt));
}

export async function getStoreProduct(id: string) {
  const db = await requireDb();
  const result = await db.select().from(products).where(and(eq(products.id, id), eq(products.isArchived, false), eq(products.availability, true))).limit(1);
  return result[0];
}

export async function getAdminProduct(id: string) {
  const db = await requireDb();
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0];
}

export async function createProduct(input: Omit<InsertProduct, "id" | "createdAt" | "updatedAt">) {
  const db = await requireDb();
  const id = nanoid(16);
  await db.insert(products).values({ ...input, id });
  return getAdminProduct(id);
}

export async function updateProduct(id: string, changes: Partial<Omit<InsertProduct, "id" | "createdAt" | "updatedAt">>) {
  const db = await requireDb();
  await db.update(products).set(changes).where(eq(products.id, id));
  return getAdminProduct(id);
}

export async function archiveProduct(id: string) {
  return updateProduct(id, { isArchived: true, availability: false });
}

export async function deleteProduct(id: string) {
  const db = await requireDb();
  await db.delete(products).where(eq(products.id, id));
  return { success: true } as const;
}

export type CheckoutInput = {
  customerName: string;
  phone: string;
  address: string;
  items: Array<{ productId: string; quantity: number; size?: number | "N/A"; color?: string }>;
};

export async function createOrder(input: CheckoutInput) {
  const db = await requireDb();
  const orderId = nanoid(16);
  const resolvedItems: OrderItem[] = [];
  let totalAmount = 0;

  await db.transaction(async tx => {
    for (const item of input.items) {
      const result = await tx.select().from(products).where(and(eq(products.id, item.productId), eq(products.isArchived, false), eq(products.availability, true))).limit(1);
      const product = result[0];
      if (!product) throw new Error("أحد المنتجات لم يعد متاحاً.");
      if (product.stockQuantity < item.quantity) throw new Error(`الكمية المتاحة من ${product.title} غير كافية.`);
      const size = item.size ?? product.sizes[0] ?? "N/A";
      if (product.sizes.length > 0 && !product.sizes.includes(size)) throw new Error(`المقاس المختار غير متاح لمنتج ${product.title}.`);
      const color = item.color ?? product.colors[0];
      if (color && !product.colors.includes(color)) throw new Error(`اللون المختار غير متاح لمنتج ${product.title}.`);
      const unitPrice = product.salePrice ?? product.price;
      totalAmount += unitPrice * item.quantity;
      resolvedItems.push({ productId: product.id, title: product.title, imageUrl: product.imageUrl, unitPrice, quantity: item.quantity, size, color });
      await tx.update(products).set({ stockQuantity: product.stockQuantity - item.quantity }).where(eq(products.id, product.id));
    }
    const order: InsertOrder = { id: orderId, customerName: input.customerName, phone: input.phone, address: input.address, items: resolvedItems, totalAmount, status: "Pending" };
    await tx.insert(orders).values(order);
  });

  return getOrder(orderId);
}

export async function getOrder(id: string) {
  const db = await requireDb();
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result[0];
}

export async function listOrders() {
  const db = await requireDb();
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const db = await requireDb();
  await db.update(orders).set({ status }).where(eq(orders.id, id));
  return getOrder(id);
}
