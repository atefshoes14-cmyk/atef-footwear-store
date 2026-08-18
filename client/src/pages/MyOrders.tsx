import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { canTrackPhone, normalizeTrackingPhone, trackingStatusLabels, type TrackingStatus } from "@/lib/orderTracking";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, ClipboardList, Loader2, PackageCheck, Search, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link } from "wouter";

type TrackingItem = { product_title: string; size: string; color: string; quantity: number; unit_price: number };
type TrackingOrder = { order_id: string; status: TrackingStatus; total_amount: number; created_at: string; items: TrackingItem[] };

export default function MyOrders() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<TrackingOrder[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!canTrackPhone(phone)) { setError("اكتب رقم موبايل صحيحاً مكوّناً من 8 إلى 15 رقماً."); setOrders([]); return; }
    setLoading(true); setError(""); setSearched(false);
    const { data, error: requestError } = await supabase.rpc("track_orders_by_phone", { p_phone: normalizeTrackingPhone(phone) });
    if (requestError) { setError("تعذّر الوصول إلى طلباتك الآن. حاول مرة أخرى."); setOrders([]); }
    else setOrders(((data ?? []) as TrackingOrder[]).map((order: TrackingOrder) => ({ ...order, items: Array.isArray(order.items) ? order.items : [] })));
    setSearched(true); setLoading(false);
  }

  return <main className="orders-tracking-page" dir="rtl"><section className="container orders-tracking-wrap"><div className="orders-tracking-intro"><span className="eyebrow"><ClipboardList size={14} /> خدمة ما بعد الطلب</span><h1>تابع <i>طلباتك</i> بسهولة</h1><p>اكتب رقم الموبايل المستخدم عند الطلب لعرض حالة الشحن والمنتجات والإجمالي. لا تظهر في هذه الصفحة بيانات العنوان أو أي تفاصيل خاصة.</p></div><form className="tracking-form" onSubmit={submit}><label htmlFor="tracking-phone">رقم الموبايل المستخدم عند الطلب</label><div><Input id="tracking-phone" inputMode="tel" autoComplete="tel" value={phone} onChange={event => setPhone(event.target.value)} placeholder="مثال: 01007891081" /><Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" size={17} /> : <Search size={17} />} بحث عن طلباتي</Button></div>{error && <p className="tracking-error">{error}</p>}<small><ShieldCheck size={13} /> نعرض ملخص الطلب فقط للمحافظة على خصوصية بياناتك.</small></form>{searched && !loading && (orders.length ? <section className="tracking-results" aria-live="polite">{orders.map(order => <article className="tracking-card" key={order.order_id}><div className="tracking-card-head"><div><span>طلب #{order.order_id.slice(0, 8).toUpperCase()}</span><time>{new Date(order.created_at).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" })}</time></div><b className={`tracking-status status-${order.status}`}>{trackingStatusLabels[order.status] ?? order.status}</b></div><div className="tracking-items">{order.items.map((item, index) => <div className="tracking-line" key={`${item.product_title}-${index}`}><div className="tracking-product-mark">ع</div><div><b>{item.product_title}</b><span>{item.size !== "N/A" ? `مقاس ${item.size}` : "بدون مقاس"} · {item.color} · {item.quantity} قطعة</span></div><strong>{(item.unit_price * item.quantity).toLocaleString("ar-EG")} ج.م</strong></div>)}</div><div className="tracking-total"><span>الدفع عند الاستلام</span><b>{Number(order.total_amount).toLocaleString("ar-EG")} ج.م</b></div></article>)}</section> : <section className="tracking-empty"><PackageCheck size={31} /><h2>لا توجد طلبات بهذا الرقم</h2><p>تأكد من رقم الموبايل الذي أُدخل عند إتمام الطلب، أو تواصل معنا عبر واتساب للمساعدة.</p></section>) }<Link href="/" className="tracking-back"><ArrowLeft size={16} /> العودة للتسوق</Link></section></main>;
}
