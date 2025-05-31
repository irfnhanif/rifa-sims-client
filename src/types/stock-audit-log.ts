import type { StockChangeType } from "./stock-change-type";

export interface StockAuditLog {
  id: string;
  itemName: string;
  itemBarcode: string;
  username: string;
  type: StockChangeType;
  oldStock: number;
  newStock: number;
  reason: string;
  timestamp: string;
}
