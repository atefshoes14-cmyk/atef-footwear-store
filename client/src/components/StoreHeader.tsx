import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCatalog } from "@/contexts/CatalogContext";
import { useInquiry } from "@/contexts/InquiryContext";
import { brandAssets } from "@/lib/brandAssets";
import { createWhatsAppOrderLink } from "@/lib/whatsapp";
import { Link } from "wouter";
import { ArrowLeft, ClipboardList, Minus, Plus, Search, ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";

const navigation = [
  { id: undefined, label: "الرئيسية" },
  { id: "men" as const, label: "الأحذية الرجالي" },
  { id: "women" as const, label: "الأحذية الحريمي" },
  { id: "kids" as const, label: "أحذية الأطفال" },
  { id: "bags" as const, label: "الشنط والحقائب" },
  { id: "offers" as const, label: "العروض والخصومات" },
];

const whatsappNumber = (import.meta.env.VITE_STORE_WHATSAPP_NUMBER as string | undefined) || "201007891081";

export default function StoreHeader() {
  const { search, setSearch, category, setCategory } = useCatalog();
  const { items, count, total, removeItem, updateQuantity, clear } = useInquiry();
  const [cartOpen, setCartOpen] = useState(false);
  const [logoUnavailable, setLogoUnavailable] = useState(false);
  const inquiryLink = items.length ? createWhatsAppOrderLink({ phone: whatsappNumber, productTitle: items.map(item => `${item.title} × ${item.quantity}`).join("، "), size: items.map(item => item.size ?? "N/A").join("، "), color: items.map(item => item.color ?? "غير محدد").join("، ") }) : "#";

  return (
    <header className="store-header">
      <div className="top-announcement">عاطف للأحذية <span>•</span> منذ عام 1969 <span>•</span> 01007891081</div>
      <div className="container header-top">
        <Link href="/" className="brand" aria-label="عاطف للأحذية - ATEF SHOES">
          {logoUnavailable ? <span className="brand-logo-fallback" aria-hidden="true">ع</span> : <img className="brand-logo-image" src={brandAssets.officialLogo} alt="شعار عاطف للأحذية" onError={() => setLogoUnavailable(true)} />}
          <span className="brand-copy"><b>عاطف للأحذية</b><small>ATEF SHOES <i>منذ عام 1969</i></small></span>
        </Link>
        <div className="header-search"><Search size={18} /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="ابحث عن حذاءك أو حقيبتك" aria-label="ابحث في منتجات عاطف" /></div>
        <Link href="/orders" className="orders-header-link"><ClipboardList size={18} /><span>طلباتي</span></Link>
        <Sheet open={cartOpen} onOpenChange={setCartOpen}>
          <SheetTrigger asChild><Button variant="outline" className="cart-trigger" aria-label="فتح سلة المشتريات"><ShoppingBag size={19} /><span className="cart-trigger-label">سلة المشتريات</span>{count > 0 && <em>{count}</em>}</Button></SheetTrigger>
          <SheetContent side="left" className="inquiry-sheet" dir="rtl">
            <SheetHeader><SheetTitle className="text-right">سلة المشتريات</SheetTitle></SheetHeader>
            {items.length === 0 ? <div className="empty-inquiry"><ShoppingBag size={30} /><p>سلتك فارغة</p><span>اختر ما يناسبك من تشكيلة عاطف وابدأ التسوق.</span></div> : <div className="inquiry-list">
              {items.map(item => <article key={`${item.id}-${item.size}-${item.color}`} className="inquiry-item"><img src={item.imageUrl} alt="" /><div className="cart-item-info"><b>{item.title}</b><span>{item.size && item.size !== "N/A" ? `مقاس ${item.size}` : "بدون مقاس"} · {item.color}</span><strong>{item.price.toLocaleString("ar-EG")} ج.م</strong><div className="quantity-control"><button onClick={() => updateQuantity(item.id, item.quantity - 1, item.size, item.color)} aria-label="تقليل الكمية"><Minus size={13} /></button><b>{item.quantity}</b><button onClick={() => updateQuantity(item.id, item.quantity + 1, item.size, item.color)} aria-label="زيادة الكمية"><Plus size={13} /></button></div></div><button className="remove-cart-item" aria-label={`حذف ${item.title}`} onClick={() => removeItem(item.id, item.size, item.color)}><Trash2 size={16} /></button></article>)}
              <div className="cart-total"><span>الإجمالي</span><b>{total.toLocaleString("ar-EG")} ج.م</b></div>
              <Link className="checkout-link" href="/checkout" onClick={() => setCartOpen(false)}><span>إتمام الطلب والدفع عند الاستلام</span><ArrowLeft size={18} /></Link>
              <a className="whatsapp-button secondary-whatsapp" href={inquiryLink} target="_blank" rel="noreferrer"><span>استفسار سريع عبر واتساب</span><ArrowLeft size={18} /></a>
              <button className="clear-inquiry" onClick={clear}><Minus size={15} /> إفراغ السلة</button>
            </div>}
          </SheetContent>
        </Sheet>
      </div>
      <nav className="category-nav" aria-label="فئات المنتجات"><div className="container category-scroll">{navigation.map(item => <button key={item.label} className={category === item.id ? "active" : ""} onClick={() => setCategory(item.id)}>{item.label}</button>)}</div></nav>
    </header>
  );
}
