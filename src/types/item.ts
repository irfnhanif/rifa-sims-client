import type { StockAuditLog } from "./stock-audit-log";

export interface Item {
  id: string;
  name: string;
  barcode: string;
  description: string;
}

export interface ItemDetailResponse {
  item: Item;
  stockAuditLog: StockAuditLog[];
}

export interface CreateItemRequest {
  name: string;
  barcode: string;
  description: string;
  currentStock: number;
  threshold: number;
}
