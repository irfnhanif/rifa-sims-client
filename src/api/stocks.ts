import type { ApiResponse } from "../types/api";
import type { ItemStock } from "../types/item-stock";
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

