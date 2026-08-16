import { describe, expect, it } from "vitest";
import { filterStoreProducts } from "./productFilters";

const products = [
  { title: "سنيكرز عاطف كلاسيك", category: "men" as const, price: 1250, sizes: [40, 41, 42], colors: ["أسود", "أبيض"] },
  { title: "حذاء عاطف اليومي", category: "women" as const, price: 1800, sizes: [38, 39], colors: ["بيج"] },
];

describe("filterStoreProducts", () => {
  it("matches every supplied catalog criterion", () => {
    const result = filterStoreProducts(products, { search: "كلاسيك", category: "men", size: 41, color: "أسود", minPrice: 1000, maxPrice: 1300 });
    expect(result).toEqual([products[0]]);
  });

  it("returns no product when an option does not match", () => {
    expect(filterStoreProducts(products, { size: 45 })).toEqual([]);
  });
});
