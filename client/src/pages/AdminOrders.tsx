import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { Loader2, MapPin, PackageCheck, Phone, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Status = "pending" | "confirmed" | "shipping" | "delivered" | "cancelled";
type OrderItem = { id: string; product_title: string; size: string; color: string; quantity: number; unit_price: number };
type Order = { id: string; full_name: string; phone: string; address: string; status: Status; total_amount: number; created_at: string; order_items: OrderItem[] };
const statuses: Status[] = ["pending", "confirmed", "shipping", "delivered", "cancelled"];
const labels: Record<Status, string> = { pending: "قيد الانتظار", confirmed: "تم التأكيد", shipping: "جاري الشحن", delivered: "تم التوصيل", cancelled: "ملغي" };

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Status>("all");
  async function loadOrders() { setLoading(true); const { data, error } = await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }); if (error) toast.error("تعذّر تحميل الطلبات من Supabase."); else setOrders((data ?? []) as Order[]); setLoading(false); }
  useEffect(() => { void loadOrders(); const channel = supabase.channel("admin-orders").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => { void loadOrders(); }).subscribe(); return () => { void supabase.removeChannel(channel); }; }, []);
  async function changeStatus(id: string, status: Status) { const { error } = await supabase.from("orders").update({ status }).eq("id", id); if (error) toast.error("تعذّر تحديث حالة الطلب."); else { toast.success("تم تحديث حالة الطلب."); await loadOrders(); } }
  const visible = useMemo(() => filter === "all" ? orders : orders.filter(order => order.status === filter), [filter, orders]);
  return <DashboardLayout><div className="orders-page" dir="rtl"><div className="inventory-heading"><div><span className="eyebrow">SUPABASE · خدمة العملاء</span><h1>طلبات العملاء</h1><p>طلبات الدفع عند الاستلام محفوظة في Supabase مع تفاصيل المقاس واللون والكمية.</p></div><div className="orders-total"><PackageCheck size={19} /> {visible.length} طلب</div></div><div className="mb-5 max-w-xs"><Select value={filter} onValueChange={value => setFilter(value as "all" | Status)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">كل الحالات</SelectItem>{statuses.map(status => <SelectItem value={status} key={status}>{labels[status]}</SelectItem>)}</SelectContent></Select></div>{loading ? <div className="admin-list-state"><Loader2 className="animate-spin" />جاري تحميل الطلبات...</div> : visible.length ? <div className="orders-list">{visible.map(order => <article className="order-card" key={order.id}><div className="order-card-head"><div><span className="order-number">طلب #{order.id.slice(0, 8).toUpperCase()}</span><time>{new Date(order.created_at).toLocaleString("ar-EG")}</time></div><Select value={order.status} onValueChange={value => void changeStatus(order.id, value as Status)}><SelectTrigger className={`order-status status-${order.status}`}><SelectValue /></SelectTrigger><SelectContent>{statuses.map(status => <SelectItem key={status} value={status}>{labels[status]}</SelectItem>)}</SelectContent></Select></div><div className="order-customer"><span><UserRound size={14} /> {order.full_name}</span><a href={`tel:${order.phone}`}><Phone size={14} /> {order.phone}</a><span><MapPin size={14} /> {order.address}</span></div><div className="order-items">{order.order_items.map(item => <div className="order-line" key={item.id}><div className="grid h-11 w-11 place-items-center rounded-lg bg-[#f5ede2] text-xs font-bold text-[#6b1d2f]">ع</div><div><b>{item.product_title}</b><span>{item.size !== "N/A" ? `مقاس ${item.size}` : "بدون مقاس"} · {item.color} · {item.quantity} قطعة</span></div><strong>{(item.unit_price * item.quantity).toLocaleString("ar-EG")} ج.م</strong></div>)}</div><div className="order-card-foot"><span>الدفع عند الاستلام</span><b>{order.total_amount.toLocaleString("ar-EG")} ج.م</b><Badge className={`status-badge status-${order.status}`}>{labels[order.status]}</Badge></div></article>)}</div> : <div className="admin-list-state"><PackageCheck size={30} /><b>لا توجد طلبات مطابقة</b><span>ستظهر طلبات العملاء هنا فور إنشائها.</span></div>}</div></DashboardLayout>;
}
