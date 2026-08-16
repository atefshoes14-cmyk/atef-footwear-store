import type { StoreProductFilters } from "./db";

export type FilterableProduct = {
  title: string;
  category: "men" | "women" | "kids" | "offers";
  price: number;
  sizes: number[];
  colors: string[];
};

export function filterStoreProducts<T extends FilterableProduct>(products: T[], filters: StoreProductFilters = {}) {
  const search = filters.search?.trim().toLocaleLowerCase("ar");
  const color = filters.color?.trim().toLocaleLowerCase("ar");
  return products.filter(product => {
    if (search && !product.title.toLocaleLowerCase("ar").includes(search)) return false;
    if (filters.category && product.category !== filters.category) return false;
    if (filters.size && !product.sizes.includes(filters.size)) return false;
    if (color && !product.colors.some(item => item.toLocaleLowerCase("ar") === color)) return false;
    if (filters.minPrice !== undefined && product.price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && product.price > filters.maxPrice) return false;
    return true;
  });
}
