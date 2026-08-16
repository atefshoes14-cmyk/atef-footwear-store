import { boolean, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing the existing Manus OAuth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/**
 * Catalog and stock record for every shoe offered by Atef / عاطف.
 * Prices are persisted as whole currency units to avoid floating-point errors.
 */
export const products = mysqlTable("products", {
  id: varchar("id", { length: 32 }).primaryKey(),
  title: varchar("title", { length: 180 }).notNull(),
  category: mysqlEnum("category", ["men", "women", "kids", "offers"]).notNull(),
  price: int("price").notNull(),
  sizes: json("sizes").$type<number[]>().notNull(),
  colors: json("colors").$type<string[]>().notNull(),
  stockQuantity: int("stockQuantity").notNull().default(0),
  availability: boolean("availability").notNull().default(true),
  imageUrl: varchar("imageUrl", { length: 500 }).notNull(),
  imageKey: varchar("imageKey", { length: 500 }),
  imageUrls: json("imageUrls").$type<string[]>().notNull(),
  imageKeys: json("imageKeys").$type<string[]>(),
  isArchived: boolean("isArchived").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
