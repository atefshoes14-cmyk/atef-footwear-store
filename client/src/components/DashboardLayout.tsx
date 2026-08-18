import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import type { AdminIdentity } from "@/lib/supabaseAdmin";
import { supabase } from "@/lib/supabase";
import { LayoutDashboard, LogOut, PanelRight, ShoppingBag, Truck } from "lucide-react";
import { useLocation } from "wouter";
import SupabaseAdminGate from "./SupabaseAdminGate";

const menuItems = [{ icon: LayoutDashboard, label: "لوحة المنتجات", path: "/admin" }, { icon: Truck, label: "طلبات العملاء", path: "/admin/orders" }, { icon: ShoppingBag, label: "متجر عاطف", path: "/" }];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <SupabaseAdminGate>{identity => <SidebarProvider dir="rtl" className="admin-shell"><DashboardLayoutContent identity={identity}>{children}</DashboardLayoutContent></SidebarProvider>}</SupabaseAdminGate>;
}

function DashboardLayoutContent({ children, identity }: { children: React.ReactNode; identity: AdminIdentity }) {
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const active = menuItems.find(item => item.path === location);
  const displayName = identity.fullName || identity.user.email || "مدير عاطف";
  return <><Sidebar side="right" collapsible="icon" className="border-l border-l-border"><SidebarHeader className="h-20 justify-center"><div className="flex items-center gap-3 px-3 group-data-[collapsible=icon]:justify-center"><span className="grid h-9 w-9 place-items-center rounded-[14px] bg-[#6B1D2F] text-lg font-extrabold text-white">ع</span><div className="group-data-[collapsible=icon]:hidden"><b className="block text-sm">ATEF SHOES</b><small className="text-[10px] text-muted-foreground">إدارة Supabase · 1969</small></div></div></SidebarHeader><SidebarContent><SidebarMenu className="px-2 py-2">{menuItems.map(item => <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={location === item.path} tooltip={item.label} onClick={() => setLocation(item.path)} className="h-11 justify-start"><item.icon className="h-4 w-4" /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarContent><SidebarFooter className="p-3"><DropdownMenu><DropdownMenuTrigger asChild><button className="flex w-full items-center gap-2 rounded-lg px-1 py-1 text-right hover:bg-accent group-data-[collapsible=icon]:justify-center"><Avatar className="h-9 w-9"><AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback></Avatar><div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><b className="block truncate text-xs">{displayName}</b><small className="block truncate text-[10px] text-muted-foreground">مسؤول المتجر</small></div></button></DropdownMenuTrigger><DropdownMenuContent align="start"><DropdownMenuItem onClick={() => void supabase.auth.signOut()} className="cursor-pointer text-destructive"><LogOut className="ml-2 h-4 w-4" />تسجيل الخروج</DropdownMenuItem></DropdownMenuContent></DropdownMenu></SidebarFooter></Sidebar><SidebarInset><header className="admin-mobile-header">{isMobile && <SidebarTrigger className="rounded-lg border bg-background" />}<div><b>{active?.label ?? "إدارة عاطف"}</b><small>نظام إدارة المنتجات والطلبات</small></div><PanelRight className="mr-auto text-[#6B1D2F]" size={19} /></header><main className="min-h-screen flex-1 p-4 md:p-6">{children}</main></SidebarInset></>;
}
