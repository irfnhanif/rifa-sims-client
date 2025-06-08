import type { ApiResponse } from "../types/api";
import type {
  ScanHistoryParam,
  PaginatedHistoryResponse,
  StockChangeHistoryParam,
} from "../types/stock-audit-log";
import { apiClient } from "./client";

export const fetchStockAuditLogs = async (
  params: Partial<StockChangeHistoryParam>
) => {
  const {
    itemName,
    username,
    changeTypes,
    fromDate,
    toDate,
    page = 0,
    size = 10,
    sortBy = "timestamp",
    sortDirection = "DESC",
    deleted = false,
  } = params;

  const queryParams = new URLSearchParams();

  if (itemName) queryParams.append("itemName", itemName);
  if (username) queryParams.append("username", username);
  if (changeTypes && changeTypes.length > 0) {
    changeTypes.forEach((type) => queryParams.append("changeTypes", type));
  }
  if (fromDate) queryParams.append("fromDate", fromDate);
  if (toDate) queryParams.append("toDate", toDate);
  queryParams.append("page", page.toString());
  queryParams.append("size", size.toString());
  queryParams.append("sortBy", sortBy);
  queryParams.append("sortDirection", sortDirection);
  queryParams.append("deleted", deleted.toString());

  const response = await apiClient.get(
    `/logs?${queryParams.toString()}`
  );

  const result: ApiResponse<PaginatedHistoryResponse> = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result.data?.logs || [];
};

export const fetchScanHistory = async (
  params: Partial<ScanHistoryParam> = {}
): Promise<PaginatedHistoryResponse> => {
  const {
    username = "", // cspell:disable-line
    changeTypes = ["IN", "OUT"],
    page = 0,
    size = 10,
    sortBy = "timestamp",
    sortDirection = "DESC",
    deleted = false,
  } = params;

  const queryParams = new URLSearchParams();
  queryParams.append("username", username);
  changeTypes.forEach((type) => queryParams.append("changeTypes", type));
  queryParams.append("page", page.toString());
  queryParams.append("size", size.toString());
  queryParams.append("sortBy", sortBy);
  queryParams.append("sortDirection", sortDirection);
  queryParams.append("deleted", deleted.toString());

  const response = await apiClient.get(
    `/logs?${queryParams.toString()}`
  );

  const result: ApiResponse<PaginatedHistoryResponse> = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return (
    result.data || {
      logs: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 0,
    }
  );
};

export const deleteStockAuditLog = async (id: string): Promise<string> => {
  const response = await apiClient.delete(`/logs/${id}`);

  const result: ApiResponse<void> = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result.message;
};
