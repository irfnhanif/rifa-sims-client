import type { Item } from "./item";
import type { StockChangeType } from "./stock-change-type";

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

export interface ScanStockChangeRequest {
  changeType: StockChangeType;
  amount: number;
}

export interface BarcodeScanResponse {
  itemStockId: string;
  itemName: string;
  currentStock: number;
  wholesalePrice: number
}

export interface RecommendedBarcodeScanResponse {
  itemStockId: string;
  itemName: string;
  currentStock: number;
  wholesalePrice: number;
  recommendationScore: number;
}
