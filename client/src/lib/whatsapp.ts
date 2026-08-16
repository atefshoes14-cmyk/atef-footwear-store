export type WhatsAppOrder = {
  phone?: string;
  productTitle: string;
  size: number | string;
  color: string;
};

export function createWhatsAppOrderLink({ phone, productTitle, size, color }: WhatsAppOrder) {
  const destination = phone?.replace(/\D/g, "") ?? "";
  const message = `مرحباً عاطف، أرغب في طلب الحذاء: ${productTitle} | المقاس: ${size} | اللون: ${color}`;
  return `https://wa.me/${destination}?text=${encodeURIComponent(message)}`;
}
