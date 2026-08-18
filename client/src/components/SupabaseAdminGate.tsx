import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabaseAdminIdentity, type AdminIdentity } from "@/lib/supabaseAdmin";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import "../supabaseAdmin.css";

type Props = { children: (identity: AdminIdentity) => React.ReactNode };

export default function SupabaseAdminGate({ children }: Props) {
  const [identity, setIdentity] = useState<AdminIdentity | null>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function refreshIdentity() {
    setIdentity(undefined);
    setIdentity(await getSupabaseAdminIdentity());
  }

  useEffect(() => {
    void refreshIdentity();
    const { data: listener } = supabase.auth.onAuthStateChange(() => { void refreshIdentity(); });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) return toast.error("تعذّر تسجيل الدخول. تحقّق من البريد الإلكتروني وكلمة المرور.");
    const nextIdentity = await getSupabaseAdminIdentity();
    if (!nextIdentity) {
      await supabase.auth.signOut();
      return toast.error("هذا الحساب لا يملك صلاحية مدير المتجر.");
    }
    setIdentity(nextIdentity);
    toast.success("مرحباً بك في إدارة عاطف.");
  }

  if (identity === undefined) return <div className="admin-list-state min-h-screen" dir="rtl"><Loader2 className="animate-spin" />جاري التحقق من الصلاحية...</div>;
  if (identity) return <>{children(identity)}</>;
  return <div className="admin-auth" dir="rtl"><form onSubmit={signIn}><span className="admin-auth-mark">ع</span><h1>دخول إدارة عاطف</h1><p>الدخول مخصص للمسؤولين المسجلين في Supabase فقط.</p><div className="admin-login-field"><label htmlFor="supabaseEmail">البريد الإلكتروني</label><Input id="supabaseEmail" required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="admin@example.com" autoComplete="email" /></div><div className="admin-login-field"><label htmlFor="supabasePassword">كلمة المرور</label><Input id="supabasePassword" required type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="كلمة المرور" autoComplete="current-password" /></div><Button type="submit" disabled={submitting}>{submitting ? <Loader2 size={17} className="animate-spin" /> : "تسجيل الدخول"}</Button></form></div>;
}
