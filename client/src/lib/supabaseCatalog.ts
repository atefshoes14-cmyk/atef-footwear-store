import { supabase } from "./supabase";

export type SupabaseVariant = { id: string; size: string; color: string; stock_quantity: number };
export type SupabaseImage = { id: string; public_url: string; sort_order: number };
export type SupabaseCatalogProduct = { id: string; title: string; description: string; category: string; price: number; sale_price: number | null; product_variants: SupabaseVariant[]; product_images: SupabaseImage[] };

export type StoreProduct = { id: string; title: string; price: number; salePrice: number | null; imageUrl: string; stockQuantity: number; sizes: Array<string | "N/A">; colors: string[]; defaultVariantId?: string };

const placeholder = "https://placehold.co/800x800/f5ede2/6b1d2f?text=ATEF+SHOES";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isCatalogProductId(value: string) {
  return uuidPattern.test(value);
}

export function toStoreProduct(product: SupabaseCatalogProduct): StoreProduct {
  const variants = product.product_variants ?? [];
  const images = [...(product.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const available = variants.filter(variant => variant.stock_quantity > 0);
  return { id: product.id, title: product.title, price: Number(product.price), salePrice: product.sale_price === null ? null : Number(product.sale_price), imageUrl: images[0]?.public_url || placeholder, stockQuantity: variants.reduce((sum, variant) => sum + variant.stock_quantity, 0), sizes: Array.from(new Set(variants.map(variant => variant.size))), colors: Array.from(new Set(variants.map(variant => variant.color))), defaultVariantId: available[0]?.id };
}

export async function fetchCatalog(search?: string, category?: string | null) {
  let query = supabase.from("products").select("id,title,description,category,price,sale_price,product_variants(id,size,color,stock_quantity),product_images(id,public_url,sort_order)").eq("is_active", true).order("created_at", { ascending: false });
  if (category) query = query.eq("category", category);
  if (search) query = query.ilike("title", `%${search}%`);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as SupabaseCatalogProduct[];
}

export async function fetchCatalogProduct(id: string) {
  if (!isCatalogProductId(id)) return null;
  const { data, error } = await supabase.from("products").select("id,title,description,category,price,sale_price,product_variants(id,size,color,stock_quantity),product_images(id,public_url,sort_order)").eq("id", id).eq("is_active", true).maybeSingle();
  if (error) throw error;
  return data as SupabaseCatalogProduct | null;
}
