import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { useCatalog } from "@/contexts/CatalogContext";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Filter, RotateCcw, SearchX, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

const sizes = [38, 39, 40, 41, 42, 43, 44, 45];
const colorOptions = ["أسود", "أبيض", "بني", "بيج", "أزرق", "رمادي"];
const categoryLabels: Record<string, string> = { men: "رجالي", women: "نسائي", kids: "أطفال", offers: "العروض" };

export default function Home() {
  const { search, category, resetCatalog } = useCatalog();
  const [size, setSize] = useState<number>();
  const [color, setColor] = useState<string>();
  const [range, setRange] = useState<[number, number]>([0, 5000]);
  const filters = useMemo(() => ({ search: search || undefined, category, size, color, minPrice: range[0] || undefined, maxPrice: range[1] < 5000 ? range[1] : undefined }), [search, category, size, color, range]);
  const products = trpc.products.list.useQuery(filters);
  const clearFilters = () => { resetCatalog(); setSize(undefined); setColor(undefined); setRange([0, 5000]); };

  return (
    <main>
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Atef / عاطف</span>
            <h1>خطوتك القادمة<br /><i>تبدأ من هنا.</i></h1>
            <p>تشكيلة مختارة من الأحذية التي تجمع الراحة، الذوق، والحضور في كل خطوة.</p>
            <a href="#catalog" className="hero-link">تصفّح المجموعة <span>←</span></a>
          </div>
          <div className="hero-visual" aria-hidden="true"><div className="hero-orbit" /><span>اختر<br />خطوتك</span><strong>01</strong></div>
        </div>
      </section>
      <section className="container catalog-layout" id="catalog">
        <aside className="filter-panel">
          <div className="filter-title"><div><SlidersHorizontal size={18} /><b>تصفية المنتجات</b></div><button onClick={clearFilters} title="إعادة ضبط"><RotateCcw size={16} /></button></div>
          <div className="filter-group"><span>المقاس</span><div className="size-grid">{sizes.map(value => <button key={value} className={cn(size === value && "selected")} onClick={() => setSize(current => current === value ? undefined : value)}>{value}</button>)}</div></div>
          <div className="filter-group"><span>اللون</span><div className="color-filters">{colorOptions.map(value => <button key={value} className={cn(color === value && "selected")} onClick={() => setColor(current => current === value ? undefined : value)}><i className={`swatch swatch-${value}`} />{value}</button>)}</div></div>
          <div className="filter-group"><span>نطاق السعر</span><div className="range-label"><b>{range[0].toLocaleString("ar-EG")} ج.م</b><em>إلى</em><b>{range[1].toLocaleString("ar-EG")} ج.م</b></div><input aria-label="الحد الأقصى للسعر" type="range" min="500" max="5000" step="100" value={range[1]} onChange={event => setRange([0, Number(event.target.value)])} /></div>
        </aside>
        <div className="catalog-content">
          <div className="catalog-heading"><div><span className="eyebrow">المجموعة</span><h2>{category ? categoryLabels[category] : "اختيارات عاطف"}</h2></div><div className="result-count"><Filter size={16} /> {products.data?.length ?? 0} منتج</div></div>
          {products.isLoading ? <div className="catalog-state">جاري تحضير المجموعة...</div> : products.isError ? <div className="catalog-state error">تعذّر تحميل المنتجات. حاول مرة أخرى.</div> : products.data?.length ? <div className="product-grid">{products.data.map(product => <ProductCard key={product.id} product={product} />)}</div> : <div className="catalog-state empty"><SearchX size={34} /><h3>لا توجد منتجات مطابقة</h3><p>جرّب تغيير الفلاتر أو أضف منتجاتك الأولى من لوحة الإدارة.</p><Button variant="outline" onClick={clearFilters}>إعادة ضبط الفلاتر</Button></div>}
        </div>
      </section>
    </main>
  );
}
