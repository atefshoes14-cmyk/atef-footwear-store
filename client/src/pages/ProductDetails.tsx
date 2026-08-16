import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useInquiry } from "@/contexts/InquiryContext";
import { trpc } from "@/lib/trpc";
import { createWhatsAppOrderLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { ArrowRight, Check, MessageCircle, PackageOpen, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";

const whatsappNumber = import.meta.env.VITE_STORE_WHATSAPP_NUMBER as string | undefined;

export default function ProductDetails() {
  const [, params] = useRoute("/products/:id");
  const productId = params?.id ?? "";
  const productQuery = trpc.products.byId.useQuery({ id: productId }, { enabled: Boolean(productId) });
  const product = productQuery.data;
  const [size, setSize] = useState<number>();
  const [color, setColor] = useState<string>();
  const [activeImage, setActiveImage] = useState<string>();
  const { addItem } = useInquiry();
  const gallery = product?.imageUrls.length ? product.imageUrls : product ? [product.imageUrl] : [];
  useEffect(() => { if (product) { setSize(product.sizes[0]); setColor(product.colors[0]); setActiveImage(gallery[0]); } }, [product]);

  if (productQuery.isLoading) return <main className="page-state">جاري تحميل المنتج...</main>;
  if (!product) return <main className="page-state"><PackageOpen size={38} /><h1>المنتج غير متاح</h1><Link href="/">العودة للتسوق</Link></main>;
  const inStock = product.stockQuantity > 0;
  const orderLink = createWhatsAppOrderLink({ phone: whatsappNumber, productTitle: product.title, size: size ?? "غير محدد", color: color ?? "غير محدد" });
  const addToInquiry = () => addItem({ id: product.id, title: product.title, price: product.price, imageUrl: product.imageUrl, size, color });

  return <main className="container product-page">
    <Link href="/" className="back-link"><ArrowRight size={17} /> العودة إلى المجموعة</Link>
    <div className="product-detail-grid">
      <div className="detail-gallery"><div className="detail-image"><img src={activeImage ?? gallery[0]} alt={product.title} /><span className="image-caption">Atef / عاطف</span></div><div className="gallery-thumbnails">{gallery.map((image, index) => <button key={image} className={cn(activeImage === image && "active")} aria-label={`عرض الصورة ${index + 1} من ${product.title}`} onClick={() => setActiveImage(image)}><img src={image} alt="" /></button>)}</div></div>
      <section className="detail-info">
        <div className="detail-title-row"><Badge className={inStock ? "stock-badge in-stock" : "stock-badge out-stock"}>{inStock ? "متوفر الآن" : "نفدت الكمية"}</Badge><span>{product.category === "men" ? "رجالي" : product.category === "women" ? "نسائي" : product.category === "kids" ? "أطفال" : "عرض مميز"}</span></div>
        <h1>{product.title}</h1><b className="detail-price">{product.price.toLocaleString("ar-EG")} <small>ج.م</small></b>
        <div className="selector"><div><b>اختر المقاس</b><span>{size ? `${size} EU` : ""}</span></div><div className="size-options">{product.sizes.map(value => <button key={value} onClick={() => setSize(value)} className={cn(size === value && "selected")}>{value}{size === value && <Check size={13} />}</button>)}</div></div>
        <div className="selector"><div><b>اختر اللون</b><span>{color}</span></div><div className="color-options">{product.colors.map(value => <button key={value} onClick={() => setColor(value)} className={cn(color === value && "selected")}><i className={`swatch swatch-${value}`} />{value}</button>)}</div></div>
        <div className="product-actions"><Button variant="outline" disabled={!inStock} onClick={addToInquiry}><Plus size={18} /> أضف للاستفسار</Button><a className={cn("whatsapp-button", !inStock && "disabled")} href={inStock ? orderLink : undefined} target="_blank" rel="noreferrer"><MessageCircle size={19} /> اطلب عبر واتساب</a></div>
        <p className="detail-note">سيتم تضمين اسم الحذاء والمقاس واللون المختار في رسالة واتساب تلقائياً.</p>
      </section>
    </div>
  </main>;
}
