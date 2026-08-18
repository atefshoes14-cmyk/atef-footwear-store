export type CheckoutFields = { fullName: string; phone: string; address: string };

export function validateCheckoutFields({ fullName, phone, address }: CheckoutFields) {
  if (!fullName.trim()) return "اكتب الاسم بالكامل قبل تأكيد الطلب.";
  const normalizedPhone = phone.replace(/\D/g, "");
  if (normalizedPhone.length < 8 || normalizedPhone.length > 15) return "اكتب رقم موبايل صحيحاً قبل تأكيد الطلب.";
  if (address.trim().length < 8) return "اكتب العنوان بالتفصيل قبل تأكيد الطلب.";
  return null;
}
