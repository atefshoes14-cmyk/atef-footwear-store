import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { useCatalog } from "@/contexts/CatalogContext";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Filter, RotateCcw, SearchX, SlidersHorizontal, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

const sizes: Array<number | "N/A"> = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, "N/A"];
const colorOptions = ["أسود", "أبيض", "بني", "بيج", "أزرق", "رمادي", "عنابي"];
const categoryLabels: Record<string, string> = { men: "الأحذية الرجالي", women: "الأحذية الحريمي", kids: "أحذية الأطفال", bags: "الشنط والحقائب", offers: "العروض والخصومات" };

export default function Home() {
  const { search, category, resetCatalog } = useCatalog();
  const [size, setSize] = useState<number | "N/A">();
  const [color, setColor] = useState<string>();
  const [range, setRange] = useState<[number, number]>([0, 3000]);
  const [inStock, setInStock] = useState<boolean>();
  const filters = useMemo(() => ({ search: search || undefined, category, size, color, minPrice: range[0] || undefined, maxPrice: range[1] < 3000 ? range[1] : undefined, inStock }), [search, category, size, color, range, inStock]);
  const products = trpc.products.list.useQuery(filters);
  const clearFilters = () => { resetCatalog(); setSize(undefined); setColor(undefined); setRange([0, 3000]); setInStock(undefined); };
  return <main>
    <section className="hero-section"><div className="container hero-grid"><div className="hero-copy"><span className="eyebrow">عاطف للأحذية · منذ عام 1969</span><h1>أناقة تمشي<br /><i>معك كل يوم.</i></h1><p>من أول خطوة إلى آخر مشوار، اختاري من تشكيلة عاطف التي تجمع الأصالة، الراحة، وأناقة التفاصيل.</p><a href="#catalog" className="hero-link">اكتشف التشكيلة <span>←</span></a></div><div className="hero-visual" aria-hidden="true"><div className="hero-orbit" /><span>ATEF<br />SHOES</span><strong>1969</strong></div></div></section>
    <section className="brand-strip"><div className="container brand-strip-content"><span>أصالة مصرية</span><span>جلود مختارة</span><span>راحة في كل خطوة</span><span>خبرة منذ 1969</span></div></section>
    <section className="container catalog-layout" id="catalog"><aside className="filter-panel"><div className="filter-title"><div><SlidersHorizontal size={18} /><b>تصفية المنتجات</b></div><button onClick={clearFilters} title="إعادة ضبط"><RotateCcw size={16} /></button></div><div className="filter-group"><span>المقاس</span><div className="size-grid">{sizes.map(value => <button key={value} className={cn(size === value && "selected")} onClick={() => setSize(current => current === value ? undefined : value)}>{value}</button>)}</div></div><div className="filter-group"><span>اللون</span><div className="color-filters">{colorOptions.map(value => <button key={value} className={cn(color === value && "selected")} onClick={() => setColor(current => current === value ? undefined : value)}><i className={`swatch swatch-${value}`} />{value}</button>)}</div></div><div className="filter-group"><span>نطاق السعر</span><div className="range-label"><b>{range[0].toLocaleString("ar-EG")} ج.م</b><em>إلى</em><b>{range[1].toLocaleString("ar-EG")} ج.م</b></div><input aria-label="الحد الأقصى للسعر" type="range" min="300" max="3000" step="50" value={range[1]} onChange={event => setRange([0, Number(event.target.value)])} /></div><label className="stock-toggle"><input type="checkbox" checked={inStock === true} onChange={event => setInStock(event.target.checked ? true : undefined)} /><span>المتاح فقط</span></label></aside><div className="catalog-content"><div className="catalog-heading"><div><span className="eyebrow">{category ? categoryLabels[category] : "مختارات عاطف"}</span><h2>{category ? categoryLabels[category] : "تشكيلة الموسم"}</h2></div><div className="result-count"><Filter size={16} /> {products.data?.length ?? 0} منتج</div></div>{products.isLoading ? <div className="catalog-state">جاري تحضير المجموعة...</div> : products.isError ? <div className="catalog-state error">تعذّر تحميل المنتجات. حاول مرة أخرى.</div> : products.data?.length ? <div className="product-grid">{products.data.map(product => <ProductCard key={product.id} product={product} />)}</div> : <div className="catalog-state empty"><SearchX size={34} /><h3>لا توجد منتجات مطابقة</h3><p>جرّب تغيير الفلاتر أو استكشف جميع اختيارات عاطف.</p><Button variant="outline" onClick={clearFilters}>إعادة ضبط الفلاتر</Button></div>}</div></section>
    <section className="container story-banner"><div><span className="eyebrow"><Sparkles size={14} /> حكاية عاطف</span><h2>ثقة تتوارثها<br />الأجيال.</h2></div><p>منذ عام 1969، نختار لك ما يليق بخطواتك. جودة حقيقية، ذوق مصري، وخدمة نعرف قيمتها.</p></section>
  </main>;
}
