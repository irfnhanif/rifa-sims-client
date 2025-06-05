import type { ApiResponse } from "../types/api";
import type { LoginRequest, UserInfo } from "../types/user";
import { apiClient } from "./client";
import apiConfig from "../config/api";
import { decodeJWT, isTokenExpired } from "../helper/jwt";

export const login = async (data: Partial<LoginRequest>): Promise<UserInfo> => {
  const response = await apiClient.post("/login", data);

  const result: ApiResponse<string> = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Login failed");
  }

  if (!result.data) {
    throw new Error("No JWT token sent by server");
  }

  const token = result.data;

  const payload = decodeJWT(token);
  if (!payload) {
    throw new Error("Invalid JWT token received");
  }

  if (!payload.sub || !payload.role) {
    throw new Error("JWT token missing required user information");
  }

  const expired = isTokenExpired(payload);
  if (expired) {
    throw new Error("Received expired JWT token");
  }

  apiConfig.setToken(token);

  return {
    username: payload.sub,
    role: payload.role,
    isExpired: false,
  };
};

export const logout = async (): Promise<void> => {
  try {
    await apiClient.post("/logout");
  } catch (error) {
    console.warn("Logout request failed:", error);
  } finally {
    apiConfig.clearToken();
  }
};

export const refreshToken = async (): Promise<UserInfo> => {
  const response = await apiClient.post("/refresh-token");

  const result: ApiResponse<string> = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Token refresh failed");
  }

  if (!result.data) {
    throw new Error("No JWT token received from refresh");
  }

  const token = result.data;

  const payload = decodeJWT(token);
  if (!payload) {
    throw new Error("Invalid refreshed JWT token");
  }

  apiConfig.setToken(token);

  return {
    username: payload.sub,
    role: payload.role,
    isExpired: isTokenExpired(payload),
  };
};
