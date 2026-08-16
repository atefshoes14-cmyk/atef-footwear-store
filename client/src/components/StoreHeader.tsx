import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCatalog } from "@/contexts/CatalogContext";
import { useInquiry } from "@/contexts/InquiryContext";
import { createWhatsAppOrderLink } from "@/lib/whatsapp";
import { Link } from "wouter";
import { ArrowLeft, Minus, Search, ShoppingBag, Trash2 } from "lucide-react";

const navigation = [
  { id: undefined, label: "الكل" },
  { id: "men" as const, label: "رجالي" },
  { id: "women" as const, label: "نسائي" },
  { id: "kids" as const, label: "أطفال" },
  { id: "offers" as const, label: "العروض" },
];

const whatsappNumber = import.meta.env.VITE_STORE_WHATSAPP_NUMBER as string | undefined;

export default function StoreHeader() {
  const { search, setSearch, category, setCategory } = useCatalog();
  const { items, removeItem, clear } = useInquiry();
  const inquiryLink = items.length
    ? createWhatsAppOrderLink({
        phone: whatsappNumber,
        productTitle: items.map(item => item.title).join("، "),
        size: items.map(item => item.size ?? "غير محدد").join("، "),
        color: items.map(item => item.color ?? "غير محدد").join("، "),
      })
    : "#";

  return (
    <header className="store-header">
      <div className="container header-top">
        <Link href="/" className="brand" aria-label="العودة للرئيسية">
          <span className="brand-mark">ع</span>
          <span><b>Atef</b><small>عاطف للأحذية</small></span>
        </Link>
        <div className="header-search">
          <Search size={18} />
          <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="ابحث عن حذاءك القادم" aria-label="ابحث في الأحذية" />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="inquiry-trigger" aria-label="فتح سلة الاستفسار">
              <ShoppingBag size={19} />
              <span className="hidden sm:inline">استفساراتي</span>
              {items.length > 0 && <em>{items.length}</em>}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="inquiry-sheet" dir="rtl">
            <SheetHeader>
              <SheetTitle className="text-right">سلة الاستفسار</SheetTitle>
            </SheetHeader>
            {items.length === 0 ? (
              <div className="empty-inquiry"><ShoppingBag size={30} /><p>لم تضف أي حذاء بعد.</p><span>أضف ما يعجبك وسنجهّز لك رسالة واتساب جاهزة.</span></div>
            ) : (
              <div className="inquiry-list">
                {items.map(item => (
                  <article key={item.id} className="inquiry-item">
                    <img src={item.imageUrl} alt="" />
                    <div><b>{item.title}</b><span>{item.price.toLocaleString("ar-EG")} ج.م</span></div>
                    <button aria-label={`حذف ${item.title}`} onClick={() => removeItem(item.id)}><Trash2 size={17} /></button>
                  </article>
                ))}
                <a className="whatsapp-button" href={inquiryLink} target="_blank" rel="noreferrer"><span>إرسال الاستفسار عبر واتساب</span><ArrowLeft size={18} /></a>
                <button className="clear-inquiry" onClick={clear}><Minus size={15} /> إفراغ السلة</button>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
      <nav className="category-nav" aria-label="فئات المنتجات">
        <div className="container category-scroll">
          {navigation.map(item => <button key={item.label} className={category === item.id ? "active" : ""} onClick={() => setCategory(item.id)}>{item.label}</button>)}
          <Link href="/admin" className="admin-link">إدارة المخزون</Link>
        </div>
      </nav>
    </header>
  );
}
