import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { prepareVariantChanges, type EditableVariant } from "@/lib/adminVariantMutations";
import { Archive, ImageUp, Loader2, PackagePlus, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Category = "men" | "women" | "kids" | "bags" | "offers";
type Variant = EditableVariant;
type ProductImage = { id: string; storage_path: string; public_url: string; sort_order: number };
type Product = { id: string; title: string; description: string; category: Category; price: number; sale_price: number | null; is_active: boolean; product_variants: Variant[]; product_images: ProductImage[] };

const categories: Record<Category, string> = { men: "الأحذية الرجالي", women: "الأحذية الحريمي", kids: "أحذية الأطفال", bags: "الشنط والحقائب", offers: "العروض والخصومات" };
const blankVariant = (): Variant => ({ size: "", color: "", stock_quantity: 0 });
const blankProduct = () => ({ title: "", description: "", category: "men" as Category, price: "", salePrice: "", isActive: true, variants: [blankVariant()], removedVariantIds: [] as string[], imageUrl: "", files: [] as File[], existingImages: [] as ProductImage[] });

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Product>();
  const [form, setForm] = useState(blankProduct());

  async function loadProducts() {
    setLoading(true);
    const { data, error } = await supabase.from("products").select("*, product_variants(*), product_images(*)").order("created_at", { ascending: false });
    if (error) toast.error("تعذّر تحميل المنتجات من Supabase.");
    else setProducts((data ?? []).map(product => ({ ...product, product_variants: product.product_variants ?? [], product_images: [...(product.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order) })) as Product[]);
    setLoading(false);
  }

  useEffect(() => {
    void loadProducts();
    const channel = supabase.channel("admin-products").on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => { void loadProducts(); }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);

  function reset() { setEditing(undefined); setForm(blankProduct()); }
  function edit(product: Product) { setEditing(product); setForm({ title: product.title, description: product.description, category: product.category, price: String(product.price), salePrice: product.sale_price ? String(product.sale_price) : "", isActive: product.is_active, variants: product.product_variants.length ? product.product_variants.map(item => ({ ...item })) : [blankVariant()], removedVariantIds: [], imageUrl: "", files: [], existingImages: product.product_images.map(image => ({ ...image })) }); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function changeVariant(index: number, key: keyof Variant, value: string | number) { setForm(current => ({ ...current, variants: current.variants.map((variant, itemIndex) => itemIndex === index ? { ...variant, [key]: value } : variant) })); }
  function pickFiles(files: FileList | null) { const selected = Array.from(files ?? []); if (selected.some(file => file.size > 6 * 1024 * 1024)) return toast.error("الحد الأقصى لحجم الصورة هو 6 ميجابايت."); setForm(current => ({ ...current, files: [...current.files, ...selected].slice(0, 8) })); }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const variantChanges = prepareVariantChanges(form.variants, form.removedVariantIds);
    if (!form.title.trim() || !form.description.trim() || !form.price || !(variantChanges.updates.length + variantChanges.inserts.length)) return toast.error("أكمل اسم ووصف وسعر المنتج وخياراً واحداً على الأقل للمقاس واللون والمخزون.");
    if (editing && variantChanges.removals.length) {
      const referenced = await supabase.from("order_items").select("variant_id").in("variant_id", variantChanges.removals);
      if (referenced.error) return toast.error("تعذّر التحقق من ارتباط خيارات المخزون بالطلبات السابقة.");
      if (referenced.data.length) return toast.error("لا يمكن حذف خيار مخزون مستخدم في طلب سابق؛ أبقه بكمية صفر بدلاً من ذلك.");
    }
    setSaving(true);
    const productPayload = { title: form.title.trim(), description: form.description.trim(), category: form.category, price: Number(form.price), sale_price: form.salePrice ? Number(form.salePrice) : null, is_active: form.isActive };
    const productResult = editing ? await supabase.from("products").update(productPayload).eq("id", editing.id).select("id").single() : await supabase.from("products").insert(productPayload).select("id").single();
    if (productResult.error || !productResult.data) { setSaving(false); return toast.error("تعذّر حفظ بيانات المنتج. تحقّق من الصلاحية والحقول."); }
    const savedProductId = productResult.data.id;
    for (const variant of variantChanges.updates) {
      const { error } = await supabase.from("product_variants").update({ size: variant.size, color: variant.color, stock_quantity: variant.stock_quantity }).eq("id", variant.id).eq("product_id", savedProductId);
      if (error) { setSaving(false); return toast.error("تعذّر تحديث خيار من خيارات المخزون."); }
    }
    if (variantChanges.inserts.length) {
      const variantResult = await supabase.from("product_variants").insert(variantChanges.inserts.map(item => ({ ...item, product_id: savedProductId })));
      if (variantResult.error) { setSaving(false); return toast.error("تعذّر حفظ خيارات المقاس واللون."); }
    }
    if (editing && variantChanges.removals.length) {
      const { error } = await supabase.from("product_variants").delete().in("id", variantChanges.removals).eq("product_id", savedProductId);
      if (error) { setSaving(false); return toast.error("تعذّر حذف خيار المخزون المحدد."); }
    }

    const imageRows: Array<{ product_id: string; storage_path: string; public_url: string; sort_order: number }> = form.existingImages.map((image, index) => ({ product_id: savedProductId, storage_path: image.storage_path, public_url: image.public_url, sort_order: index }));
    if (form.imageUrl.trim()) imageRows.push({ product_id: savedProductId, storage_path: `external/${crypto.randomUUID()}`, public_url: form.imageUrl.trim(), sort_order: imageRows.length });
    for (let index = 0; index < form.files.length; index += 1) {
      const file = form.files[index]!;
      const path = `${savedProductId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const upload = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type, upsert: false });
      if (upload.error) { setSaving(false); return toast.error("تعذّر رفع إحدى الصور إلى Supabase Storage."); }
      imageRows.push({ product_id: savedProductId, storage_path: upload.data.path, public_url: supabase.storage.from("product-images").getPublicUrl(upload.data.path).data.publicUrl, sort_order: imageRows.length });
    }
    if (editing) {
      const clearImages = await supabase.from("product_images").delete().eq("product_id", savedProductId);
      if (clearImages.error) { setSaving(false); return toast.error("تم حفظ المنتج لكن تعذّر تحديث معرض الصور."); }
    }
    if (imageRows.length) {
      const imageResult = await supabase.from("product_images").insert(imageRows);
      if (imageResult.error) { setSaving(false); return toast.error("تم حفظ المنتج لكن تعذّر حفظ معرض الصور."); }
    }
    if (editing) {
      const removedStoragePaths = editing.product_images.filter(image => !form.existingImages.some(current => current.id === image.id)).map(image => image.storage_path).filter(path => !path.startsWith("external/"));
      if (removedStoragePaths.length) await supabase.storage.from("product-images").remove(removedStoragePaths);
    }
    setSaving(false); toast.success(editing ? "تم تحديث المنتج والمخزون." : "تمت إضافة المنتج إلى Supabase."); reset(); await loadProducts();
  }

  async function remove(product: Product) { if (!window.confirm(`حذف «${product.title}» نهائياً؟`)) return; const paths = product.product_images.map(image => image.storage_path).filter(path => !path.startsWith("external/")); await supabase.from("products").delete().eq("id", product.id); if (paths.length) await supabase.storage.from("product-images").remove(paths); toast.success("تم حذف المنتج."); await loadProducts(); }
  async function toggleActive(product: Product) { const { error } = await supabase.from("products").update({ is_active: !product.is_active }).eq("id", product.id); if (error) toast.error("تعذّر تغيير حالة المنتج."); else await loadProducts(); }

  return <DashboardLayout><div className="inventory-page" dir="rtl"><div className="inventory-heading"><div><span className="eyebrow">SUPABASE · ATEF SHOES</span><h1>المنتجات والمخزون</h1><p>إدارة المنتج، المتغيرات حسب المقاس واللون، وصور التخزين من Supabase.</p></div><Button onClick={reset}><Plus size={17} /> منتج جديد</Button></div><div className="inventory-stats"><div><span>كل المنتجات</span><b>{products.length}</b></div><div><span>ظاهرة للعملاء</span><b>{products.filter(product => product.is_active).length}</b></div><div><span>خيارات منخفضة المخزون</span><b>{products.flatMap(product => product.product_variants).filter(variant => variant.stock_quantity < 5).length}</b></div></div><form className="inventory-form" onSubmit={save}><div className="form-topline"><div><b>{editing ? "تعديل المنتج" : "إضافة منتج جديد"}</b><span>كل لون ومقاس له كمية مخزون مستقلة.</span></div>{editing && <button type="button" onClick={reset}><X size={16} /> إلغاء التعديل</button>}</div><div className="form-grid"><div className="form-field form-wide"><Label>اسم المنتج</Label><Input value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} /></div><div className="form-field form-wide"><Label>الوصف</Label><Input value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} placeholder="وصف مختصر للخامة والتصميم" /></div><div className="form-field"><Label>الفئة</Label><Select value={form.category} onValueChange={value => setForm(current => ({ ...current, category: value as Category }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(categories) as Category[]).map(category => <SelectItem key={category} value={category}>{categories[category]}</SelectItem>)}</SelectContent></Select></div><div className="form-field"><Label>السعر الأساسي (ج.م)</Label><Input type="number" min="0" value={form.price} onChange={event => setForm(current => ({ ...current, price: event.target.value }))} /></div><div className="form-field"><Label>سعر الخصم (اختياري)</Label><Input type="number" min="0" value={form.salePrice} onChange={event => setForm(current => ({ ...current, salePrice: event.target.value }))} /></div><div className="form-field availability-field"><Label>إظهار المنتج</Label><div><Switch checked={form.isActive} onCheckedChange={value => setForm(current => ({ ...current, isActive: value }))} /><span>{form.isActive ? "ظاهر للعملاء" : "مخفي"}</span></div></div><div className="form-field form-wide"><div className="flex items-center justify-between"><Label>المقاسات والألوان والمخزون</Label><Button type="button" size="sm" variant="outline" onClick={() => setForm(current => ({ ...current, variants: [...current.variants, blankVariant()] }))}><Plus size={14} /> إضافة خيار</Button></div><div className="space-y-2 pt-3">{form.variants.map((variant, index) => <div key={`${variant.id ?? "new"}-${index}`} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2"><Input value={variant.size} onChange={event => changeVariant(index, "size", event.target.value)} placeholder="المقاس 36–45 أو N/A" /><Input value={variant.color} onChange={event => changeVariant(index, "color", event.target.value)} placeholder="اللون" /><Input type="number" min="0" value={variant.stock_quantity} onChange={event => changeVariant(index, "stock_quantity", Number(event.target.value))} placeholder="الكمية" /><button type="button" className="rounded-md border px-2 text-destructive" onClick={() => setForm(current => { const removed = current.variants[index]; return current.variants.length === 1 ? current : { ...current, variants: current.variants.filter((_, itemIndex) => itemIndex !== index), removedVariantIds: removed?.id ? Array.from(new Set([...current.removedVariantIds, removed.id])) : current.removedVariantIds }; })}><X size={15} /></button></div>)}</div></div><div className="form-field form-wide"><Label>صور المنتج</Label>{form.existingImages.length > 0 && <><span className="field-hint">الصور الحالية ستبقى عند الحفظ. احذف الصورة صراحةً من علامة × فقط.</span><div className="admin-gallery-preview">{form.existingImages.map(image => <div key={image.id}><img src={image.public_url} alt="" /><button type="button" title="حذف الصورة" onClick={() => setForm(current => ({ ...current, existingImages: current.existingImages.filter(currentImage => currentImage.id !== image.id) }))}><X size={13} /></button></div>)}</div></>}<Input className="mt-3" type="url" value={form.imageUrl} onChange={event => setForm(current => ({ ...current, imageUrl: event.target.value }))} placeholder="رابط صورة إضافية: https://..." /><label className="upload-box mt-3"><ImageUp size={19} /><span>{form.files.length ? `${form.files.length} صورة جاهزة للرفع` : "اختَر صور JPG أو PNG أو WEBP من الجهاز"}</span><input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={event => pickFiles(event.target.files)} /></label></div></div><div className="form-actions"><Button type="button" variant="outline" onClick={reset}>إلغاء</Button><Button type="submit" disabled={saving}>{saving ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}{editing ? "حفظ التعديلات" : "إضافة إلى Supabase"}</Button></div></form><section className="inventory-list"><div className="list-heading"><div><h2>كل المنتجات</h2><span>البيانات تُقرأ مباشرة من Supabase مع RLS.</span></div></div>{loading ? <div className="admin-list-state"><Loader2 className="animate-spin" />جاري تحميل المنتجات...</div> : products.length ? <div className="product-admin-table"><div className="admin-table-head"><span>المنتج</span><span>السعر</span><span>المخزون</span><span>التوفر</span><span>إجراءات</span></div>{products.map(product => <article key={product.id} className="admin-product-row"><div className="admin-product-name"><img src={product.product_images[0]?.public_url || "https://placehold.co/160x160/f5ede2/6b1d2f?text=ATEF"} alt="" /><div><b>{product.title}</b><span>{categories[product.category]} · {product.product_variants.map(variant => `${variant.size}/${variant.color}`).join("، ")}</span></div></div><div className="admin-price"><b>{(product.sale_price ?? product.price).toLocaleString("ar-EG")}</b><span>ج.م</span></div><div className="quick-stock"><b>{product.product_variants.reduce((sum, variant) => sum + variant.stock_quantity, 0)}</b></div><div className="availability-cell"><Switch checked={product.is_active} onCheckedChange={() => void toggleActive(product)} /><span>{product.is_active ? "ظاهر" : "مخفي"}</span></div><div className="admin-actions"><button title="تعديل" onClick={() => edit(product)}><Pencil size={16} /></button><button title="إخفاء أو إظهار" onClick={() => void toggleActive(product)}><Archive size={16} /></button><button title="حذف" className="danger" onClick={() => void remove(product)}><Trash2 size={16} /></button></div></article>)}</div> : <div className="admin-list-state"><PackagePlus size={29} /><b>لا توجد منتجات في Supabase بعد</b><span>أضف منتجك الأول وسيظهر هنا بحسب سياسة المدير.</span></div>}</section></div></DashboardLayout>;
}
