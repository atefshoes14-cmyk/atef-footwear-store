export type TrackingStatus = "pending" | "confirmed" | "shipping" | "delivered" | "cancelled";

export const trackingStatusLabels: Record<TrackingStatus, string> = {
  pending: "قيد الانتظار",
  confirmed: "تم التأكيد",
  shipping: "جاري الشحن",
  delivered: "تم التوصيل",
  cancelled: "ملغي",
};

export function normalizeTrackingPhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export function canTrackPhone(phone: string) {
  const normalized = normalizeTrackingPhone(phone);
  return normalized.length >= 8 && normalized.length <= 15;
}
