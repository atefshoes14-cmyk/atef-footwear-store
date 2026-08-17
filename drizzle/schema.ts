import { boolean, int, json, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/** Core user table backing the existing Manus OAuth flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 24 }).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/** Catalog and stock record for every Atef Shoes product. */
export const products = mysqlTable("products", {
  id: varchar("id", { length: 64 }).primaryKey(),
  title: varchar("title", { length: 180 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  price: int("price").notNull(),
  salePrice: int("salePrice"),
  sizes: json("sizes").$type<Array<number | "N/A">>().notNull(),
  colors: json("colors").$type<string[]>().notNull(),
  stockQuantity: int("stockQuantity").notNull().default(0),
  availability: boolean("availability").notNull().default(true),
  imageUrl: varchar("imageUrl", { length: 500 }).notNull(),
  imageKey: varchar("imageKey", { length: 500 }),
  imageUrls: json("imageUrls").$type<string[]>().notNull(),
  imageKeys: json("imageKeys").$type<string[]>(),
  isArchived: boolean("isArchived").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").onUpdateNow().notNull(),
});

export type OrderItem = {
  productId: string;
  title: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  size?: number | "N/A";
  color?: string;
};

export const orders = mysqlTable("orders", {
  id: varchar("id", { length: 64 }).primaryKey(),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  address: text("address").notNull(),
  items: json("items").$type<OrderItem[]>().notNull(),
  totalAmount: int("totalAmount").notNull(),
  status: varchar("status", { length: 50 }).default("Pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export const ORDER_STATUSES = ["Pending", "Shipped", "Delivered", "Cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const PRODUCT_CATEGORIES = ["men", "women", "kids", "bags", "offers"] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
export const PRODUCT_SIZES = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45] as const;
export type ProductSize = (typeof PRODUCT_SIZES)[number] | "N/A";
export const STORE_WHATSAPP_NUMBER = "201007891081";
