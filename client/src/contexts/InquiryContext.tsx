import { createContext, useContext, useMemo, useState } from "react";

export type InquiryItem = {
  id: string;
  title: string;
  imageUrl: string;
  price: number;
  size?: number;
  color?: string;
};

type InquiryContextValue = {
  items: InquiryItem[];
  addItem: (item: InquiryItem) => void;
  removeItem: (id: string) => void;
  clear: () => void;
};

const InquiryContext = createContext<InquiryContextValue | null>(null);

export function InquiryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<InquiryItem[]>([]);
  const value = useMemo(
    () => ({
      items,
      addItem: (item: InquiryItem) => setItems(current => current.some(entry => entry.id === item.id) ? current : [...current, item]),
      removeItem: (id: string) => setItems(current => current.filter(item => item.id !== id)),
      clear: () => setItems([]),
    }),
    [items],
  );
  return <InquiryContext.Provider value={value}>{children}</InquiryContext.Provider>;
}

export function useInquiry() {
  const context = useContext(InquiryContext);
  if (!context) throw new Error("useInquiry must be used inside InquiryProvider");
  return context;
}
