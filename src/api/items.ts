import type { ApiResponse } from "../types/api";
import type { CreateItemRequest, Item } from "../types/item";
import { apiClient } from "./client";

export const fetchItems = async (
  page: number,
  size: number,
  name?: string
): Promise<Item[]> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  if (name && name.trim()) {
    params.append("name", name.trim().toLowerCase());
  }

  const response = await apiClient.get("/items", params);

  const result: ApiResponse<Item[]> = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  if (!result.success) {
    throw new Error(result.message || "Failed to fetch items");
  }

  return result.data || [];
};

export const createItem = async (itemData: CreateItemRequest) => {
  const response = await apiClient.post("/items", itemData);

  const result: ApiResponse<Item> = await response.json();

  if (!response.ok || !result.success) {
    const error = new Error(result.message || "Failed to create item");
    (error as any).errors = result.errors;
    (error as any).status = response.status;
    throw error;
  }

  if (!result.data) {
    throw new Error("No data returned from server");
  }

  return result.data;
};

export const deleteItem = async (id: string) => {
  const response = await apiClient.delete(`/items/${id}`);

  const result: ApiResponse<void> = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result.message;
};
