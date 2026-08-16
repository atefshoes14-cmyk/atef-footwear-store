import { createContext, useContext, useMemo, useState } from "react";

export type CatalogCategory = "men" | "women" | "kids" | "offers" | undefined;

type CatalogContextValue = {
  search: string;
  setSearch: (value: string) => void;
  category: CatalogCategory;
  setCategory: (value: CatalogCategory) => void;
  resetCatalog: () => void;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CatalogCategory>();
  const value = useMemo(
    () => ({ search, setSearch, category, setCategory, resetCatalog: () => { setSearch(""); setCategory(undefined); } }),
    [search, category],
  );
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) throw new Error("useCatalog must be used inside CatalogProvider");
  return context;
}
