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

export interface StockChangeHistoryParam {
  itemName: string
  username: string;
  changeTypes: StockChangeType[];
  fromDate: string
  toDate: string
  page: number;
  size: number;
  sortBy: string;
  sortDirection: "ASC" | "DESC";
  deleted: boolean;
}

export interface ScanHistoryParam {
  username: string;
  changeTypes: StockChangeType[];
  page: number;
  size: number;
  sortBy: string;
  sortDirection: "ASC" | "DESC";
  deleted: boolean
}

export interface PaginatedHistoryResponse {
  logs: StockAuditLog[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}