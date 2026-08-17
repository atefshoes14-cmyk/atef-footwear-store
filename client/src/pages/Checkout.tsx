import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useInquiry } from "@/contexts/InquiryContext";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, ChevronRight, Loader2, MapPin, Phone, ShoppingBag, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function Checkout() {
  const [, navigate] = useLocation();
  const { items, total, clear } = useInquiry();
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [orderId, setOrderId] = useState<string>();
  const submitOrder = trpc.products.createOrder.useMutation({ onSuccess: order => { clear(); setOrderId(order?.id); } });
  if (orderId) return <main className="checkout-page"><div className="container checkout-confirmation"><CheckCircle2 size={64} /><span className="eyebrow">ATEF SHOES · شكراً لثقتك</span><h1>تم استلام طلبك بنجاح</h1><p>طلبك رقم <b>#{orderId}</b> قيد الانتظار الآن. سيتواصل معك فريق عاطف لتأكيد التفاصيل قبل الشحن.</p><div className="confirmation-badge">الدفع عند الاستلام · قيد الانتظار</div><Link href="/" className="checkout-back">العودة إلى المتجر</Link></div></main>;
  if (!items.length) return <main className="checkout-page"><div className="container checkout-empty"><ShoppingBag size={42} /><h1>سلة المشتريات فارغة</h1><p>أضيفي المنتجات التي تحبينها أولاً ثم عودي لإتمام الطلب.</p><Link href="/" className="checkout-back">تصفح المنتجات</Link></div></main>;
  const submit = (event: React.FormEvent) => { event.preventDefault(); submitOrder.mutate({ customerName, phone, address, items: items.map(item => ({ productId: item.id, quantity: item.quantity, size: item.size, color: item.color })) }); };
  return <main className="checkout-page" dir="rtl"><div className="container checkout-breadcrumb"><Link href="/">الرئيسية</Link><ChevronRight size={14} /><b>إتمام الطلب</b></div><div className="container checkout-layout"><form className="checkout-form" onSubmit={submit}><div className="checkout-title"><span className="eyebrow">الخطوة الأخيرة</span><h1>أكملي طلبك</h1><p>سيتم التواصل معك لتأكيد العنوان وموعد التوصيل.</p></div><div className="checkout-field"><Label htmlFor="customerName"><UserRound size={16} /> الاسم بالكامل</Label><Input id="customerName" required value={customerName} onChange={event => setCustomerName(event.target.value)} placeholder="اكتبي اسمك بالكامل" /></div><div className="checkout-field"><Label htmlFor="phone"><Phone size={16} /> رقم الموبايل</Label><Input id="phone" required type="tel" value={phone} onChange={event => setPhone(event.target.value)} placeholder="0100 000 0000" /></div><div className="checkout-field"><Label htmlFor="address"><MapPin size={16} /> العنوان بالتفصيل - المحافظة والمنطقة</Label><Textarea id="address" required value={address} onChange={event => setAddress(event.target.value)} placeholder="المحافظة، المنطقة، الشارع، رقم العمارة والشقة" /></div><div className="payment-method"><div><b>طريقة الدفع</b><span>اختيار آمن ومريح عند استلام طلبك</span></div><strong>الدفع عند الاستلام</strong></div><Button className="place-order" type="submit" disabled={submitOrder.isPending}>{submitOrder.isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={18} />} تأكيد الطلب</Button>{submitOrder.isError && <p className="form-error">{submitOrder.error.message || "تعذّر حفظ الطلب. راجعي البيانات وحاولي مرة أخرى."}</p>}</form><aside className="checkout-summary"><div className="summary-title"><ShoppingBag size={18} /><h2>ملخص الطلب</h2></div>{items.map(item => <article key={`${item.id}-${item.size}-${item.color}`} className="summary-item"><img src={item.imageUrl} alt="" /><div><b>{item.title}</b><span>{item.size && item.size !== "N/A" ? `مقاس ${item.size}` : "بدون مقاس"} · {item.color} · {item.quantity} قطعة</span><strong>{(item.price * item.quantity).toLocaleString("ar-EG")} ج.م</strong></div></article>)}<div className="summary-total"><span>الإجمالي</span><b>{total.toLocaleString("ar-EG")} ج.م</b></div></aside></div></main>;
}
