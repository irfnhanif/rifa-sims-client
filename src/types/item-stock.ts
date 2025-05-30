import type { Item } from "./item";

export interface ItemStock {
  id: string;
  item: Item;
  currentStock: number;
  threshold: number;
}

export interface EditStockChangeRequest {
  currentStock: number;
  threshold: number;
  reason: string;
}

export const StockChangeType = {
  IN: "IN",
  OUT: "OUT",
  MANUAL_EDIT: "MANUAL_EDIT",
  CREATE: "CREATE",
  DELETE: "DELETE",
} as const;

export type StockChangeType = typeof StockChangeType[keyof typeof StockChangeType];

export interface ScanStockChangeRequest {
  changeType: StockChangeType;
  amount: number;
}
