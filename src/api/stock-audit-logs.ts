import type { ApiResponse } from "../types/api";
import type { ScanHistoryParam, StockAuditLog } from "../types/stock-audit-log";
import { apiClient } from "./client";

export const fetchScanHistory = async (
  params: Partial<ScanHistoryParam> = {}
): Promise<StockAuditLog[]> => {
  const {
    username = "rifaowner", // cspell:disable-line
    changeTypes = ["IN", "OUT"],
    page = 0,
    size = 10,
    sortBy = "timestamp",
    sortDirection = "DESC",
  } = params;

  const queryParams = new URLSearchParams();
  queryParams.append("username", username);
  changeTypes.forEach((type) => queryParams.append("changeTypes", type));
  queryParams.append("page", page.toString());
  queryParams.append("size", size.toString());
  queryParams.append("sortBy", sortBy);
  queryParams.append("sortDirection", sortDirection);

  const response = await apiClient.get(
    `/logs?${queryParams.toString()}`
  );
  
  const result: ApiResponse<StockAuditLog[]> = await response.json()

  if (!response.ok) {
    throw new Error(result.message)
  }

  return result.data || []
};
