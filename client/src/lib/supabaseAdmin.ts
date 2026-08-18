import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type AdminIdentity = { user: User; fullName: string | null; role: "admin" };

export async function getSupabaseAdminIdentity(): Promise<AdminIdentity | null> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return null;

  const { data: profile, error: profileError } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle();
  if (profileError || !profile || profile.role !== "admin") return null;
  return { user, fullName: profile.full_name, role: "admin" };
}
