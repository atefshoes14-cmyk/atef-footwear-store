import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useInquiry } from "@/contexts/InquiryContext";
import { Link } from "wouter";
import { ArrowUpLeft, Plus } from "lucide-react";

type ProductCardProps = {
  product: {
    id: string;
    title: string;
    price: number;
    imageUrl: string;
    stockQuantity: number;
    sizes: number[];
    colors: string[];
  };
};

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useInquiry();
  const inStock = product.stockQuantity > 0;
  return (
    <article className="product-card">
      <Link href={`/products/${product.id}`} className="product-image-wrap" aria-label={`عرض ${product.title}`}>
        <img src={product.imageUrl} alt={product.title} className="product-image" />
        <Badge className={inStock ? "stock-badge in-stock" : "stock-badge out-stock"}>{inStock ? "متوفر الآن" : "نفدت الكمية"}</Badge>
        <span className="product-arrow"><ArrowUpLeft size={17} /></span>
      </Link>
      <div className="product-info">
        <Link href={`/products/${product.id}`} className="product-title">{product.title}</Link>
        <div className="product-card-footer">
          <b>{product.price.toLocaleString("ar-EG")} <small>ج.م</small></b>
          <Button disabled={!inStock} size="icon" onClick={() => addItem({ id: product.id, title: product.title, price: product.price, imageUrl: product.imageUrl, size: product.sizes[0], color: product.colors[0] })} aria-label={`إضافة ${product.title} للاستفسار`}><Plus size={18} /></Button>
        </div>
      </div>
    </article>
  );
}
