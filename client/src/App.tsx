import { Toaster } from "@/components/ui/sonner";
import StoreHeader from "@/components/StoreHeader";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CatalogProvider } from "@/contexts/CatalogContext";
import { InquiryProvider } from "@/contexts/InquiryContext";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminOrders from "@/pages/AdminOrders";
import Checkout from "@/pages/Checkout";
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";
import ProductDetails from "@/pages/ProductDetails";
import { supabaseConfigMissing } from "@/lib/supabase";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return <Switch><Route path="/" component={Home} /><Route path="/products/:id" component={ProductDetails} /><Route path="/checkout" component={Checkout} /><Route path="/admin" component={AdminDashboard} /><Route path="/admin/orders" component={AdminOrders} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}

function Application() {
  const [location] = useLocation();
  return <CatalogProvider><InquiryProvider>{!location.startsWith("/admin") && <StoreHeader />}<Router /></InquiryProvider></CatalogProvider>;
}

function SupabaseConfigurationNotice() {
  return <main className="grid min-h-screen place-items-center bg-[#f8f1e7] p-5" dir="rtl"><section className="w-full max-w-xl rounded-3xl border border-[#e6d8cc] bg-[#fffaf5] p-7 text-right shadow-[0_20px_55px_rgba(107,29,47,.12)] sm:p-10"><span className="inline-flex rounded-full bg-[#6b1d2f] px-3 py-1 text-xs font-bold text-white">ATEF SHOES · إعداد النشر</span><h1 className="mt-5 text-2xl font-black text-[#6b1d2f]">يلزم استكمال إعداد Supabase في Vercel</h1><p className="mt-3 leading-8 text-[#725a53]">تم نشر الواجهة، لكن متغيرات الاتصال العامة بقاعدة البيانات غير متوفرة في نسخة الإنتاج. أضف المتغيرين التاليين إلى إعدادات المشروع في Vercel، ثم أعد النشر.</p><div className="mt-5 rounded-2xl bg-[#f5e7d7] p-4 font-mono text-sm leading-7 text-[#6b1d2f]" dir="ltr">VITE_SUPABASE_URL<br />VITE_SUPABASE_PUBLISHABLE_KEY</div><p className="mt-5 text-sm leading-7 text-[#725a53]">لا تضف مفتاح Supabase من نوع Service Role إلى متغيرات تبدأ بـ <code>VITE_</code>.</p></section></main>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster />{supabaseConfigMissing ? <SupabaseConfigurationNotice /> : <Application />}</TooltipProvider></ThemeProvider></ErrorBoundary>;
}
