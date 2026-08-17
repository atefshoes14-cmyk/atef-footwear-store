import type { StoreProductFilters } from "./db";

export type FilterableProduct = {
  title: string;
  category: string;
  price: number;
  salePrice: number | null;
  sizes: Array<number | "N/A">;
  colors: string[];
  stockQuantity: number;
};

export function filterStoreProducts<T extends FilterableProduct>(products: T[], filters: StoreProductFilters = {}) {
  const search = filters.search?.trim().toLocaleLowerCase("ar");
  const color = filters.color?.trim().toLocaleLowerCase("ar");
  return products.filter(product => {
    const effectivePrice = product.salePrice ?? product.price;
    if (search && !product.title.toLocaleLowerCase("ar").includes(search)) return false;
    if (filters.category && product.category !== filters.category) return false;
    if (filters.size !== undefined && !product.sizes.includes(filters.size)) return false;
    if (color && !product.colors.some(item => item.toLocaleLowerCase("ar") === color)) return false;
    if (filters.minPrice !== undefined && effectivePrice < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && effectivePrice > filters.maxPrice) return false;
    if (filters.inStock !== undefined && (product.stockQuantity > 0) !== filters.inStock) return false;
    return true;
  });
}
