export type EditableVariant = { id?: string; size: string; color: string; stock_quantity: number };

type VariantPayload = { size: string; color: string; stock_quantity: number };
type NormalizedVariant = VariantPayload & { id: string | undefined };

export function prepareVariantChanges(variants: EditableVariant[], removedVariantIds: string[]) {
  const normalized: NormalizedVariant[] = variants
    .map(item => ({ id: item.id, size: item.size.trim() || "N/A", color: item.color.trim(), stock_quantity: Number(item.stock_quantity) }))
    .filter(item => Boolean(item.color) && item.stock_quantity >= 0);

  return {
    updates: normalized.filter((item): item is VariantPayload & { id: string } => Boolean(item.id)),
    inserts: normalized.filter(item => !item.id).map(({ size, color, stock_quantity }) => ({ size, color, stock_quantity })),
    removals: Array.from(new Set(removedVariantIds)),
  };
}
