import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { nanoid } from "nanoid";
import { InsertProduct, InsertUser, products, users } from "../drizzle/schema";
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
  category?: "men" | "women" | "kids" | "offers";
  size?: number;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
};

export async function listStoreProducts(filters: StoreProductFilters = {}) {
  const db = await requireDb();
  const result = await db
    .select()
    .from(products)
    .where(and(eq(products.isArchived, false), eq(products.availability, true)))
    .orderBy(desc(products.createdAt));

  return filterStoreProducts(result, filters);
}

export async function listAdminProducts() {
  const db = await requireDb();
  return db.select().from(products).orderBy(desc(products.updatedAt));
}

export async function getStoreProduct(id: string) {
  const db = await requireDb();
  const result = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.isArchived, false), eq(products.availability, true)))
    .limit(1);
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
