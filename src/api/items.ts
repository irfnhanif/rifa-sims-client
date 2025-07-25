import type { ApiResponse } from "../types/api";
import type { CreateItemRequest, Item, ItemDetailResponse } from "../types/item";
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

export const fetchItemById = async (id: string): Promise<Item> => {
  const response = await apiClient.get(`/items/${id}`);

  const result: ApiResponse<Item> = await response.json()

  if (!response.ok) {
    throw new Error(result.message)
  }

  if (!result.data) {
    throw new Error("No data returned")
  }

  return result.data;
}

export const fetchItemDetailById = async (
  id: string,
  fromDate?: string,
  toDate?: string
): Promise<ItemDetailResponse> => {
  const params = new URLSearchParams();

  if (fromDate) {
    params.append("fromDate", fromDate);
  }

  if (toDate) {
    params.append("toDate", toDate);
  }

  const response = await apiClient.get(
    `/items/${id}/detail`,
    params.toString() ? params : undefined
  );

  const result: ApiResponse<ItemDetailResponse> = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  if (!result.data) {
    throw new Error("No data returned");
  }

  return result.data;
};

export const createItem = async (itemData: CreateItemRequest): Promise<Item> => {
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

export const updateItem = async (id: string, data: Partial<Item>): Promise<Item> => {
  const response = await apiClient.put(`/items/${id}`, data)

  const result: ApiResponse<Item> = await response.json()

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

export const deleteItem = async (id: string) => {
  const response = await apiClient.delete(`/items/${id}`);

  const result: ApiResponse<void> = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result.message;
};
