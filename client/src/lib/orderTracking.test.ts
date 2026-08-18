import { describe, expect, it } from "vitest";
import { canTrackPhone, normalizeTrackingPhone, trackingStatusLabels } from "./orderTracking";

describe("customer order tracking helpers", () => {
  it("normalizes Egyptian phone-number formatting before lookup", () => {
    expect(normalizeTrackingPhone("010-078 91081")).toBe("01007891081");
  });

  it("allows only practical phone-number lengths", () => {
    expect(canTrackPhone("01007891081")).toBe(true);
    expect(canTrackPhone("12345")).toBe(false);
  });

  it("provides an Arabic label for every public order status", () => {
    expect(trackingStatusLabels.shipping).toBe("جاري الشحن");
  });
});
