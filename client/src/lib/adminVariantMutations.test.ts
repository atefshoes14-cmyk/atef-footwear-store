import { describe, expect, it } from "vitest";
import { prepareVariantChanges } from "./adminVariantMutations";

describe("prepareVariantChanges", () => {
  it("keeps existing variant IDs for in-place updates and isolates only new variants for insertion", () => {
    const changes = prepareVariantChanges([
      { id: "ordered-variant", size: "40", color: "أبيض", stock_quantity: 9 },
      { size: "42", color: "أبيض", stock_quantity: 12 },
    ], ["removed-variant", "removed-variant"]);

    expect(changes.updates).toEqual([{ id: "ordered-variant", size: "40", color: "أبيض", stock_quantity: 9 }]);
    expect(changes.inserts).toEqual([{ size: "42", color: "أبيض", stock_quantity: 12 }]);
    expect(changes.removals).toEqual(["removed-variant"]);
  });
});
