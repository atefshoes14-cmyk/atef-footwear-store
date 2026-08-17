import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { useCatalog } from "@/contexts/CatalogContext";
import { brandAssets } from "@/lib/brandAssets";
import { trpc } from "@/lib/trpc";
import { Package, SearchX, Sparkles } from "lucide-react";

const categoryLabels: Record<string, string> = { men: "الأحذية الرجالي", women: "الأحذية الحريمي", kids: "أحذية الأطفال", bags: "الشنط والحقائب", offers: "العروض والخصومات" };

export default function Home() {
  const { search, category, resetCatalog } = useCatalog();
  const products = trpc.products.list.useQuery({ search: search || undefined, category });
  return <main>
    <section className="official-brand-banner" aria-label="عاطف للأحذية - منذ عام 1969"><img src={brandAssets.officialBanner} alt="عاطف للأحذية - ATEF SHOES - منذ عام 1969" /></section>
    <section className="brand-strip"><div className="container brand-strip-content"><span>أصالة مصرية</span><span>جلود مختارة</span><span>راحة في كل خطوة</span><span>خبرة منذ 1969</span></div></section>
    <section className="container catalog-layout catalog-fullwidth" id="catalog"><div className="catalog-content"><div className="catalog-heading"><div><span className="eyebrow">{category ? categoryLabels[category] : "مختارات عاطف"}</span><h2>{category ? categoryLabels[category] : "تشكيلة الموسم"}</h2></div><div className="result-count"><Package size={16} /> {products.data?.length ?? 0} منتج</div></div>{products.isLoading ? <div className="catalog-state">جاري تحضير المجموعة...</div> : products.isError ? <div className="catalog-state error">تعذّر تحميل المنتجات. حاول مرة أخرى.</div> : products.data?.length ? <div className="product-grid">{products.data.map(product => <ProductCard key={product.id} product={product} />)}</div> : <div className="catalog-state empty"><SearchX size={34} /><h3>لا توجد منتجات مطابقة</h3><p>جرّب البحث باسم مختلف أو استكشف جميع اختيارات عاطف.</p><Button variant="outline" onClick={resetCatalog}>عرض جميع المنتجات</Button></div>}</div></section>
    <section className="container story-banner"><div><span className="eyebrow"><Sparkles size={14} /> حكاية عاطف</span><h2>ثقة تتوارثها<br />الأجيال.</h2></div><p>منذ عام 1969، نختار لك ما يليق بخطواتك. جودة حقيقية، ذوق مصري، وخدمة نعرف قيمتها.</p></section>
  </main>;
}
