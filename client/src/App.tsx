import { Toaster } from "@/components/ui/sonner";
import StoreHeader from "@/components/StoreHeader";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CatalogProvider } from "@/contexts/CatalogContext";
import { InquiryProvider } from "@/contexts/InquiryContext";
import NotFound from "@/pages/NotFound";
import AdminDashboard from "@/pages/AdminDashboard";
import Home from "@/pages/Home";
import ProductDetails from "@/pages/ProductDetails";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return <Switch><Route path="/" component={Home} /><Route path="/products/:id" component={ProductDetails} /><Route path="/admin" component={AdminDashboard} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}

function Application() {
  const [location] = useLocation();
  return <CatalogProvider><InquiryProvider>{!location.startsWith("/admin") && <StoreHeader />}<Router /></InquiryProvider></CatalogProvider>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Application /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
