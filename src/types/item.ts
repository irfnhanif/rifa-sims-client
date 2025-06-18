import type { StockAuditLog } from "./stock-audit-log";

export interface Item {
  id: string;
  name: string;
  barcode: string;
  description: string;
  wholesalePrice: number;
  profitPercentage: number;
  retailPrice: number;
}

export interface ItemDetailResponse {
  item: Item;
  stockAuditLogs: StockAuditLog[];
}

export interface CreateItemRequest {
  name: string;
  barcode: string;
  description: string;
  currentStock: number;
  threshold: number;
  wholesalePrice: number;
  profitPercentage: number;
  retailPrice: number;
}
