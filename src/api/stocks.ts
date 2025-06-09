import type { ApiResponse } from "../types/api";
import type {
  BarcodeScanResponse,
  ItemStock,
  RecommendedBarcodeScanResponse,
  ScanStockChangeRequest,
} from "../types/item-stock";
import { apiClient } from "./client";

export const fetchItemStocks = async (
  page: number,
  size: number,
  name?: string
): Promise<ItemStock[]> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  if (name && name.trim()) {
    params.append("name", name.trim().toLowerCase());
  }

  const response = await apiClient.get("/item-stocks", params);

  const result: ApiResponse<ItemStock[]> = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  if (!result.success) {
    throw new Error(result.message || "Failed to fetch items");
  }

  return result.data || [];
};

export const fetchItemStocksCurrentStockLessThanThreshold = async (
  page: number,
  size: number,
  name?: string
): Promise<ItemStock[]> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  if (name && name.trim()) {
    params.append("name", name.trim().toLowerCase());
  }

  const response = await apiClient.get("/item-stocks/near-empty", params);

  const result: ApiResponse<ItemStock[]> = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  if (!result.success) {
    throw new Error(result.message || "Failed to fetch items");
  }

  return result.data || [];
};

export const fetchItemStockById = async (id: string): Promise<ItemStock> => {
  const response = await apiClient.get(`/item-stocks/${id}`);

  const result: ApiResponse<ItemStock> = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  if (!result.data) {
    throw new Error("No data returned");
  }

  return result.data;
};

export const updateItemStock = async (id: string, data: Partial<ItemStock>) => {
  const response = await apiClient.put(`/item-stocks/${id}`, data);

  const result: ApiResponse<ItemStock> = await response.json();

  if (!response.ok || !result.success) {
    const error = new Error(result.message || "Failed to update item");
    (error as any).errors = result.errors;
    (error as any).status = response.status;
    throw error;
  }

  if (!result.data) {
    throw new Error("No data returned from server");
  }

  return result.data;
};

export const fetchItemStockByBarcode = async (
  barcode: string
): Promise<BarcodeScanResponse[]> => {
  const response = await apiClient.get(`/item-stocks/barcode/${barcode}`);

  const result: ApiResponse<BarcodeScanResponse[]> = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result.data || [];
};

export const fetchRecommendedItemStockByBarcode = async (
  barcode: string
): Promise<RecommendedBarcodeScanResponse[]> => {
  const response = await apiClient.get(`/item-stocks/barcode/${barcode}/recommendation`);

  const result: ApiResponse<RecommendedBarcodeScanResponse[]> = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result.data || [];
};

export const scanUpdateItemStock = async (id: string, data: Partial<ScanStockChangeRequest>) => {
  const response = await apiClient.patch(`/item-stocks/${id}/scan`, data)

  const result:ApiResponse<ItemStock> = await response.json()

  if (!response.ok || !result.success) {
    const error = new Error(result.message || "Failed to update item");
    (error as any).errors = result.errors;
    (error as any).status = response.status;
    throw error;
  }

  if (!result.data) {
    throw new Error("No data returned from server");
  }

  return result.data;
}
