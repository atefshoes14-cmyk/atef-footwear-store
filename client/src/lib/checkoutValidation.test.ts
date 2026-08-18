import { describe, expect, it } from "vitest";
import { validateCheckoutFields } from "./checkoutValidation";

describe("checkout field validation", () => {
  it("accepts a complete local delivery request", () => {
    expect(validateCheckoutFields({ fullName: "عميل اختبار", phone: "0100 789 1081", address: "القاهرة، مدينة نصر، شارع الاختبار" })).toBeNull();
  });

  it("rejects an incomplete mobile number with general Arabic copy", () => {
    expect(validateCheckoutFields({ fullName: "عميل اختبار", phone: "1234", address: "القاهرة، مدينة نصر، شارع الاختبار" })).toBe("اكتب رقم موبايل صحيحاً قبل تأكيد الطلب.");
  });
});
