import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useInquiry } from "@/contexts/InquiryContext";
import { Link } from "wouter";
import { ArrowUpLeft, ShoppingBag } from "lucide-react";

type ProductCardProps = {
  product: {
    id: string;
    title: string;
    price: number;
    salePrice: number | null;
    imageUrl: string;
    stockQuantity: number;
    sizes: Array<number | "N/A">;
    colors: string[];
  };
};

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useInquiry();
  const inStock = product.stockQuantity > 0;
  const displayPrice = product.salePrice ?? product.price;
  return (
    <article className="product-card">
      <Link href={`/products/${product.id}`} className="product-image-wrap" aria-label={`عرض ${product.title}`}>
        <img src={product.imageUrl} alt={product.title} className="product-image" />
        {product.salePrice && <span className="sale-ribbon">خصم</span>}
        <Badge className={inStock ? "stock-badge in-stock" : "stock-badge out-stock"}>{inStock ? "متوفر" : "نفدت الكمية"}</Badge>
        <span className="product-arrow"><ArrowUpLeft size={17} /></span>
      </Link>
      <div className="product-info">
        <span className="product-kicker">عاطف للأحذية</span>
        <Link href={`/products/${product.id}`} className="product-title">{product.title}</Link>
        <div className="product-card-footer">
          <div className="price-stack"><b>{displayPrice.toLocaleString("ar-EG")} <small>ج.م</small></b>{product.salePrice && <del>{product.price.toLocaleString("ar-EG")} ج.م</del>}</div>
          <Button disabled={!inStock} size="icon" onClick={() => addItem({ id: product.id, title: product.title, price: displayPrice, imageUrl: product.imageUrl, size: product.sizes[0], color: product.colors[0] })} aria-label={`إضافة ${product.title} للسلة`}><ShoppingBag size={18} /></Button>
        </div>
      </div>
    </article>
  );
}
