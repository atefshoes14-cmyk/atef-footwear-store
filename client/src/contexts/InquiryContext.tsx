import { createContext, useContext, useMemo, useState } from "react";

export type CartItem = {
  id: string;
  title: string;
  imageUrl: string;
  price: number;
  size?: number | "N/A";
  color?: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (id: string, size?: number | "N/A", color?: string) => void;
  updateQuantity: (id: string, quantity: number, size?: number | "N/A", color?: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function itemKey(item: Pick<CartItem, "id" | "size" | "color">) {
  return `${item.id}-${item.size ?? "N/A"}-${item.color ?? ""}`;
}

export function InquiryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const value = useMemo(() => {
    const addItem = (item: Omit<CartItem, "quantity">, quantity = 1) => setItems(current => {
      const key = itemKey(item);
      const existing = current.find(entry => itemKey(entry) === key);
      return existing ? current.map(entry => itemKey(entry) === key ? { ...entry, quantity: entry.quantity + quantity } : entry) : [...current, { ...item, quantity }];
    });
    const updateQuantity = (id: string, quantity: number, size?: number | "N/A", color?: string) => setItems(current => quantity <= 0 ? current.filter(entry => itemKey(entry) !== itemKey({ id, size, color })) : current.map(entry => itemKey(entry) === itemKey({ id, size, color }) ? { ...entry, quantity } : entry));
    const removeItem = (id: string, size?: number | "N/A", color?: string) => updateQuantity(id, 0, size, color);
    return { items, count: items.reduce((sum, item) => sum + item.quantity, 0), total: items.reduce((sum, item) => sum + item.price * item.quantity, 0), addItem, removeItem, updateQuantity, clear: () => setItems([]) };
  }, [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useInquiry() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useInquiry must be used inside InquiryProvider");
  return context;
}
