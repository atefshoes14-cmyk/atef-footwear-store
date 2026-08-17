import { describe, expect, it } from "vitest";
import { createWhatsAppOrderLink } from "./whatsapp";

describe("createWhatsAppOrderLink", () => {
  it("uses the configured business destination when its public format is valid", () => {
    const configuredNumber = process.env.VITE_STORE_WHATSAPP_NUMBER;
    const normalizedNumber = configuredNumber?.replace(/\D/g, "");
    expect(normalizedNumber).toMatch(/^\d{8,15}$/);
    expect(createWhatsAppOrderLink({ phone: configuredNumber, productTitle: "اختبار", size: 40, color: "أسود" })).toContain(`wa.me/${normalizedNumber}`);
  });

  it("uses the exact Atef Shoes business number configured for this rebuild", () => {
    expect(process.env.VITE_STORE_WHATSAPP_NUMBER?.replace(/\D/g, "")).toBe("201007891081");
  });

  it("includes the selected Arabic shoe, size, and color in the encoded WhatsApp message", () => {
    const link = createWhatsAppOrderLink({ phone: "+20 (100) 123-4567", productTitle: "سنيكرز عاطف كلاسيك", size: 42, color: "أسود" });
    expect(link).toMatch(/^https:\/\/wa\.me\/201001234567\?text=/);
    expect(decodeURIComponent(link.split("text=")[1])).toContain("سنيكرز عاطف كلاسيك | المقاس: 42 | اللون: أسود");
  });
});
