import { Button } from "@/components/ui/button";
import { useInquiry } from "@/contexts/InquiryContext";
import { createWhatsAppOrderLink } from "@/lib/whatsapp";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { ArrowRight, Check, ChevronRight, Minus, Plus, ShoppingBag, Tag, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";

const categoryLabels: Record<string, string> = { men: "الأحذية الرجالي", women: "الأحذية الحريمي", kids: "أحذية الأطفال", bags: "الشنط والحقائب", offers: "العروض والخصومات" };
const whatsappNumber = (import.meta.env.VITE_STORE_WHATSAPP_NUMBER as string | undefined) || "201007891081";

export default function ProductDetails() {
  const [, params] = useRoute("/products/:id");
  const [, navigate] = useLocation();
  const { addItem } = useInquiry();
  const productQuery = trpc.products.byId.useQuery({ id: params?.id ?? "" }, { enabled: Boolean(params?.id) });
  const product = productQuery.data;
  const [size, setSize] = useState<number | "N/A">();
  const [color, setColor] = useState<string>();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string>();
  const gallery = product?.imageUrls?.length ? product.imageUrls : product ? [product.imageUrl] : [];
  useEffect(() => { if (product) { setSize(product.sizes[0] ?? "N/A"); setColor(product.colors[0]); setActiveImage(gallery[0]); } }, [product, gallery.length]);
  if (productQuery.isLoading) return <main className="detail-state">جاري تحميل المنتج...</main>;
  if (productQuery.isError || !product) return <main className="detail-state error">لم نتمكن من العثور على هذا المنتج.</main>;
  const displayPrice = product.salePrice ?? product.price;
  const inStock = product.stockQuantity > 0;
  const addToCart = () => { addItem({ id: product.id, title: product.title, price: displayPrice, imageUrl: product.imageUrl, size, color }, quantity); };
  const whatsappLink = createWhatsAppOrderLink({ phone: whatsappNumber, productTitle: product.title, size: size ?? "N/A", color: color ?? "غير محدد" });
  return <main className="product-detail-page"><div className="container detail-breadcrumb"><Link href="/">الرئيسية</Link><ChevronRight size={14} /><span>{categoryLabels[product.category] ?? "المنتجات"}</span><ChevronRight size={14} /><b>{product.title}</b></div><div className="container detail-layout"><div className="detail-gallery"><div className="detail-image"><img src={activeImage ?? gallery[0]} alt={product.title} /><span className="image-caption">ATEF SHOES · 1969</span></div><div className="gallery-thumbnails">{gallery.map((image, index) => <button key={`${image}-${index}`} className={cn(activeImage === image && "active")} aria-label={`عرض الصورة ${index + 1}`} onClick={() => setActiveImage(image)}><img src={image} alt="" /></button>)}</div></div><div className="detail-copy"><span className="detail-category">{categoryLabels[product.category]}</span><div className="detail-stock">{inStock ? <><i /> متوفر في المخزون</> : "نفدت الكمية حالياً"}</div><h1>{product.title}</h1><div className="detail-price"><b>{displayPrice.toLocaleString("ar-EG")} <small>ج.م</small></b>{product.salePrice && <><del>{product.price.toLocaleString("ar-EG")} ج.م</del><span><Tag size={13} /> عرض خاص</span></>}</div><p className="detail-description">اختيار أنيق من عاطف للأحذية، مصمم ليمنحك راحة تدوم وأناقة تليق بكل مشوار.</p>{product.sizes.length > 0 && <div className="selector-block"><div className="selector-heading"><b>اختاري المقاس</b><span>{product.category === "bags" ? "هذا المنتج لا يحتاج مقاساً" : "مقاس مصري"}</span></div><div className="selector-options">{product.sizes.map(item => <button key={String(item)} className={cn(size === item && "selected")} onClick={() => setSize(item)}>{item === "N/A" ? "بدون مقاس" : item}{size === item && <Check size={13} />}</button>)}</div></div>}<div className="selector-block"><div className="selector-heading"><b>اختاري اللون</b><span>{color}</span></div><div className="color-options">{product.colors.map(item => <button key={item} className={cn(color === item && "selected")} onClick={() => setColor(item)}><i className={`swatch swatch-${item}`} />{item}</button>)}</div></div><div className="detail-benefits"><span><Truck size={17} /> توصيل لجميع المحافظات</span><span><Check size={17} /> الدفع عند الاستلام</span></div><div className="detail-actions"><div className="quantity-control large"><button onClick={() => setQuantity(current => Math.max(1, current - 1))}><Minus size={15} /></button><b>{quantity}</b><button onClick={() => setQuantity(current => Math.min(product.stockQuantity || 1, current + 1))}><Plus size={15} /></button></div><Button className="add-cart-button" disabled={!inStock} onClick={addToCart}><ShoppingBag size={18} /> أضف إلى السلة</Button></div><a className="whatsapp-button detail-whatsapp" href={whatsappLink} target="_blank" rel="noreferrer"><span>اطلب مباشرة عبر واتساب</span><ArrowRight size={18} /></a><button className="back-link" onClick={() => navigate("/")}>العودة للتسوق</button></div></div></main>;
}
