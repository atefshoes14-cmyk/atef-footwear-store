import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Archive, Check, ChevronDown, CircleAlert, ImageUp, Loader2, PackagePlus, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { ChangeEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

const inventorySizes = [38, 39, 40, 41, 42, 43, 44, 45];
const inventoryColors = ["أسود", "أبيض", "بني", "بيج", "أزرق", "رمادي"];
type Category = "men" | "women" | "kids" | "offers";
type InventoryForm = { title: string; category: Category; price: string; sizes: number[]; colors: string[]; stockQuantity: string; availability: boolean; imageUrls: string[]; imageKeys: string[]; files: File[] };
const blankForm: InventoryForm = { title: "", category: "men", price: "", sizes: [], colors: [], stockQuantity: "0", availability: true, imageUrls: [], imageKeys: [], files: [] };
const categoryLabel: Record<Category, string> = { men: "رجالي", women: "نسائي", kids: "أطفال", offers: "العروض" };

function toDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
}

export default function AdminDashboard() {
  const { loading, user } = useAuth();
  if (loading) return <div className="admin-gate">جاري التحقق من الجلسة...</div>;
  if (!user) return <DashboardLayout><div /></DashboardLayout>;
  if (user.role !== "admin") return <main className="admin-gate"><CircleAlert size={36} /><h1>هذه الصفحة مخصّصة لمدير عاطف</h1><p>تم تسجيل الدخول، لكن حسابك لا يملك صلاحية إدارة المخزون.</p><Link href="/">العودة إلى المتجر</Link></main>;
  return <DashboardLayout><InventoryManager /></DashboardLayout>;
}

function InventoryManager() {
  const utils = trpc.useUtils();
  const productsQuery = trpc.products.adminList.useQuery();
  const [form, setForm] = useState<InventoryForm>(blankForm);
  const [editingId, setEditingId] = useState<string>();
  const [isOpen, setIsOpen] = useState(true);
  const upload = trpc.products.uploadImage.useMutation();
  const create = trpc.products.create.useMutation({ onSuccess: () => utils.products.adminList.invalidate() });
  const update = trpc.products.update.useMutation({ onSuccess: () => utils.products.adminList.invalidate() });
  const archive = trpc.products.archive.useMutation({ onSuccess: () => utils.products.adminList.invalidate() });
  const remove = trpc.products.delete.useMutation({ onSuccess: () => utils.products.adminList.invalidate() });
  const busy = upload.isPending || create.isPending || update.isPending;
  const totalStock = useMemo(() => productsQuery.data?.filter(product => !product.isArchived).reduce((sum, product) => sum + product.stockQuantity, 0) ?? 0, [productsQuery.data]);

  const reset = () => { setForm(blankForm); setEditingId(undefined); setIsOpen(false); };
  const toggleArray = <T,>(field: "sizes" | "colors", value: T) => setForm(current => ({ ...current, [field]: (current[field] as T[]).includes(value) ? (current[field] as T[]).filter(item => item !== value) : [...(current[field] as T[]), value] }));
  const pickFile = (event: ChangeEvent<HTMLInputElement>) => { const files = Array.from(event.target.files ?? []); if (!files.length) return; if (files.some(file => file.size > 6 * 1024 * 1024)) { toast.error("الحد الأقصى لحجم كل صورة هو 6 ميجابايت."); return; } setForm(current => ({ ...current, files: [...current.files, ...files].slice(0, 8) })); };
  const removeSavedImage = (index: number) => setForm(current => ({ ...current, imageUrls: current.imageUrls.filter((_, itemIndex) => itemIndex !== index), imageKeys: current.imageKeys.filter((_, itemIndex) => itemIndex !== index) }));
  const removeQueuedFile = (index: number) => setForm(current => ({ ...current, files: current.files.filter((_, itemIndex) => itemIndex !== index) }));
  const edit = (product: NonNullable<typeof productsQuery.data>[number]) => { setEditingId(product.id); setForm({ title: product.title, category: product.category, price: String(product.price), sizes: product.sizes, colors: product.colors, stockQuantity: String(product.stockQuantity), availability: product.availability, imageUrls: product.imageUrls.length ? product.imageUrls : [product.imageUrl], imageKeys: product.imageKeys ?? (product.imageKey ? [product.imageKey] : []), files: [] }); setIsOpen(true); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.sizes.length || !form.colors.length || (!form.files.length && !form.imageUrls.length)) { toast.error("أكمل الاسم والمقاسات والألوان والصورة قبل الحفظ."); return; }
    try {
      const uploads = await Promise.all(form.files.map(async file => upload.mutateAsync({ filename: file.name, contentType: file.type as "image/jpeg" | "image/png" | "image/webp", base64Data: await toDataUrl(file) })));
      const imageUrls = [...form.imageUrls, ...uploads.map(result => result.url)];
      const imageKeys = [...form.imageKeys, ...uploads.map(result => result.key)];
      const data = { title: form.title.trim(), category: form.category, price: Number(form.price), sizes: form.sizes, colors: form.colors, stockQuantity: Number(form.stockQuantity), availability: form.availability, imageUrl: imageUrls[0], imageKey: imageKeys[0] ?? null, imageUrls, imageKeys };
      if (editingId) { await update.mutateAsync({ id: editingId, ...data }); toast.success("تم تحديث الحذاء والمخزون."); } else { await create.mutateAsync(data); toast.success("تمت إضافة الحذاء إلى المتجر."); }
      reset();
    } catch (error) { toast.error(error instanceof Error ? error.message : "تعذّر حفظ المنتج."); }
  };
  const quickStock = async (id: string, stockQuantity: number) => { try { await update.mutateAsync({ id, stockQuantity: Math.max(0, stockQuantity) }); } catch { toast.error("تعذّر تحديث الكمية."); } };
  const toggleAvailability = async (id: string, availability: boolean) => { try { await update.mutateAsync({ id, availability }); } catch { toast.error("تعذّر تحديث التوفر."); } };

  return <section className="inventory-page">
    <div className="inventory-heading"><div><span className="eyebrow">Atef / عاطف</span><h1>المخزون والمنتجات</h1><p>أضف المنتجات، حدّث الكمية، وأبقِ واجهة المتجر دقيقة دائماً.</p></div><Button onClick={() => setIsOpen(current => !current)}><PackagePlus size={17} /> {isOpen ? "إخفاء النموذج" : "إضافة حذاء"}</Button></div>
    <div className="inventory-stats"><div><span>منتجات مسجلة</span><b>{productsQuery.data?.length ?? 0}</b></div><div><span>قطع متوفرة</span><b>{totalStock.toLocaleString("ar-EG")}</b></div><div><span>منتجات مخفية</span><b>{productsQuery.data?.filter(product => product.isArchived).length ?? 0}</b></div></div>
    {isOpen && <form className="inventory-form" onSubmit={submit}><div className="form-topline"><div><b>{editingId ? "تعديل الحذاء" : "إضافة حذاء جديد"}</b><span>{editingId ? "عدّل الحقول التي تريدها ثم احفظ التغييرات." : "تُرفع الصور إلى التخزين الآمن عند الحفظ."}</span></div>{editingId && <button type="button" onClick={reset}><X size={16} /> إلغاء التعديل</button>}</div><div className="form-grid"><div className="form-field form-wide"><Label htmlFor="title">اسم الحذاء</Label><Input id="title" value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} placeholder="مثال: سنيكرز عاطف كلاسيك" /></div><div className="form-field"><Label>الفئة</Label><Select value={form.category} onValueChange={value => setForm(current => ({ ...current, category: value as Category }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(categoryLabel) as Category[]).map(value => <SelectItem key={value} value={value}>{categoryLabel[value]}</SelectItem>)}</SelectContent></Select></div><div className="form-field"><Label htmlFor="price">السعر (ج.م)</Label><Input id="price" inputMode="numeric" type="number" min="0" value={form.price} onChange={event => setForm(current => ({ ...current, price: event.target.value }))} placeholder="1250" /></div><div className="form-field"><Label htmlFor="stock">عدد القطع</Label><Input id="stock" inputMode="numeric" type="number" min="0" value={form.stockQuantity} onChange={event => setForm(current => ({ ...current, stockQuantity: event.target.value }))} /></div><div className="form-field availability-field"><Label>إتاحة العرض</Label><div><Switch checked={form.availability} onCheckedChange={value => setForm(current => ({ ...current, availability: value }))} /><span>{form.availability ? "متاح للعملاء" : "مخفي من المتجر"}</span></div></div><div className="form-field form-wide"><Label>المقاسات المتاحة</Label><div className="admin-choice-grid">{inventorySizes.map(value => <button type="button" key={value} className={cn(form.sizes.includes(value) && "selected")} onClick={() => toggleArray("sizes", value)}>{value}{form.sizes.includes(value) && <Check size={12} />}</button>)}</div></div><div className="form-field form-wide"><Label>الألوان</Label><div className="admin-color-grid">{inventoryColors.map(value => <button type="button" key={value} className={cn(form.colors.includes(value) && "selected")} onClick={() => toggleArray("colors", value)}><i className={`swatch swatch-${value}`} />{value}</button>)}</div></div><div className="form-field form-wide"><Label>صور الحذاء</Label><label className="upload-box"><ImageUp size={19} /><span>{form.files.length ? `${form.files.length} صورة جديدة جاهزة للرفع` : form.imageUrls.length ? `${form.imageUrls.length} صورة محفوظة في المعرض` : "اختر حتى 8 صور JPG أو PNG أو WEBP (حد 6 ميجابايت للصورة)"}</span><input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={pickFile} /></label>{(form.imageUrls.length > 0 || form.files.length > 0) && <div className="admin-gallery-preview">{form.imageUrls.map((url, index) => <div key={url}><img src={url} alt="" /><button type="button" aria-label="حذف صورة محفوظة" onClick={() => removeSavedImage(index)}><X size={13} /></button></div>)}{form.files.map((file, index) => <div className="queued-image" key={`${file.name}-${index}`}><ImageUp size={15} /><span>{file.name}</span><button type="button" aria-label="حذف صورة جديدة" onClick={() => removeQueuedFile(index)}><X size={13} /></button></div>)}</div>}</div></div><div className="form-actions"><Button type="button" variant="outline" onClick={reset}>إلغاء</Button><Button type="submit" disabled={busy}>{busy ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}{editingId ? "حفظ التعديلات" : "إضافة إلى المخزون"}</Button></div></form>}
    <section className="inventory-list"><div className="list-heading"><div><h2>كل المنتجات</h2><span>تحكم سريع في السعر والكمية والتوفر.</span></div><ChevronDown size={19} /></div>{productsQuery.isLoading ? <div className="admin-list-state">جاري تحميل المخزون...</div> : productsQuery.isError ? <div className="admin-list-state">تعذّر تحميل المنتجات.</div> : productsQuery.data?.length ? <div className="product-admin-table"><div className="admin-table-head"><span>المنتج</span><span>السعر</span><span>المخزون</span><span>التوفر</span><span>إجراءات</span></div>{productsQuery.data.map(product => <article key={product.id} className={cn("admin-product-row", product.isArchived && "archived")}><div className="admin-product-name"><img src={product.imageUrl} alt="" /><div><b>{product.title}</b><span>{categoryLabel[product.category]} · {product.sizes.join("، ")}</span></div>{product.isArchived && <Badge>مؤرشف</Badge>}</div><div className="admin-price"><b>{product.price.toLocaleString("ar-EG")}</b><span>ج.م</span></div><div className="quick-stock"><button onClick={() => quickStock(product.id, product.stockQuantity + 1)} aria-label="زيادة المخزون"><Plus size={14} /></button><b>{product.stockQuantity}</b><button onClick={() => quickStock(product.id, product.stockQuantity - 1)} disabled={product.stockQuantity === 0} aria-label="تقليل المخزون">−</button></div><div className="availability-cell"><Switch checked={product.availability && !product.isArchived} disabled={product.isArchived} onCheckedChange={value => toggleAvailability(product.id, value)} /><span>{product.availability && !product.isArchived ? "ظاهر" : "مخفي"}</span></div><div className="admin-actions"><button title="تعديل" onClick={() => edit(product)}><Pencil size={16} /></button><button title="أرشفة" disabled={product.isArchived} onClick={async () => { if (window.confirm(`أرشفة «${product.title}»؟`)) { try { await archive.mutateAsync({ id: product.id }); toast.success("تمت أرشفة المنتج."); } catch { toast.error("تعذّرت أرشفة المنتج."); } } }}><Archive size={16} /></button><button title="حذف" className="danger" onClick={async () => { if (window.confirm(`حذف «${product.title}» نهائياً؟`)) { try { await remove.mutateAsync({ id: product.id }); toast.success("تم حذف المنتج."); } catch { toast.error("تعذّر حذف المنتج."); } } }}><Trash2 size={16} /></button></div></article>)}</div> : <div className="admin-list-state"><PackagePlus size={29} /><b>لا توجد أحذية بعد</b><span>أضف منتجك الأول وسيظهر تلقائياً في متجر عاطف.</span></div>}</section>
  </section>;
}
