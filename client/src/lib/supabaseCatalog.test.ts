import { describe, expect, it } from "vitest";
import { toStoreProduct } from "./supabaseCatalog";

describe("toStoreProduct", () => {
  it("maps Supabase images and variants to a purchasable public catalog product", () => {
    const result = toStoreProduct({
      id: "product-1",
      title: "حذاء اختبار",
      description: "وصف",
      category: "men",
      price: 1500,
      sale_price: 1200,
      product_images: [{ id: "image-1", public_url: "https://example.com/shoe.jpg", sort_order: 0 }],
      product_variants: [
        { id: "variant-sold-out", size: "41", color: "أسود", stock_quantity: 0 },
        { id: "variant-live", size: "42", color: "بني", stock_quantity: 3 },
      ],
    });

    expect(result).toMatchObject({
      imageUrl: "https://example.com/shoe.jpg",
      stockQuantity: 3,
      salePrice: 1200,
      defaultVariantId: "variant-live",
    });
    expect(result.sizes).toEqual(["41", "42"]);
    expect(result.colors).toEqual(["أسود", "بني"]);
  });
});
