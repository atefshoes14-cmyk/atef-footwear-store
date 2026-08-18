import { brandAssets } from "@/lib/brandAssets";
import { ClipboardList, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

export default function StoreFooter() {
  return <footer className="store-footer" dir="rtl"><div className="container store-footer-inner"><div className="footer-brand"><img src={brandAssets.officialLogo} alt="شعار عاطف للأحذية" onError={event => { event.currentTarget.style.display = "none"; }} /><div><b>عاطف للأحذية</b><span>ATEF SHOES · منذ عام 1969</span></div></div><div className="footer-links"><Link href="/orders"><ClipboardList size={15} /> طلباتي</Link><Link className="admin-footer-link" href="/admin"><ShieldCheck size={14} /> لوحة التحكم</Link></div></div><div className="container footer-bottom">© {new Date().getFullYear()} عاطف للأحذية · الدفع عند الاستلام وخدمة واتساب</div></footer>;
}
