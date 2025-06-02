import type { ApiResponse } from "../types/api";
import type { ScanHistoryParam, PaginatedHistoryResponse } from "../types/stock-audit-log";
import { apiClient } from "./client";

export const fetchScanHistory = async (
  params: Partial<ScanHistoryParam> = {}
): Promise<PaginatedHistoryResponse> => {
  const {
    username = "rifaowner", // cspell:disable-line
    changeTypes = ["IN", "OUT"],
    page = 0,
    size = 10,
    sortBy = "timestamp",
    sortDirection = "DESC",
    deleted = false
  } = params;

  const queryParams = new URLSearchParams();
  queryParams.append("username", username);
  changeTypes.forEach((type) => queryParams.append("changeTypes", type));
  queryParams.append("page", page.toString());
  queryParams.append("size", size.toString());
  queryParams.append("sortBy", sortBy);
  queryParams.append("sortDirection", sortDirection)
  queryParams.append("deleted", deleted.toString());

  const response = await apiClient.get(`/logs?${queryParams.toString()}`);

  const result: ApiResponse<PaginatedHistoryResponse> = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  if (!result.data) {
    throw new Error("No data returned by server")
  }

  return result.data;
};

export const deleteStockAuditLog = async (id: string) => {
  const response = await apiClient.delete(`/logs/${id}`);

  const result: ApiResponse<void> = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result.message;
};
