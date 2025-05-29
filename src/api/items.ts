import type { ApiResponse } from "../types/api";
import type { CreateItemRequest, Item } from "../types/item";
import { apiClient } from "./client";

export const createItem = async (
    itemData: CreateItemRequest
) => {
    const response = await apiClient.post("/items", itemData);
    
    const result: ApiResponse<Item> = await response.json()

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
}