import type { ApiResponse } from "../types/api";
import type { EditUserRequest, User, UserWithTokenResponse } from "../types/user";
import { apiClient } from "./client";

export const fetchUsers = async (
  page: number,
  size: number,
  name?: string
): Promise<User[]> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  if (name && name.trim()) {
    params.append("name", name.trim().toLowerCase());
  }

  const response = await apiClient.get("/users", params);

  const result: ApiResponse<User[]> = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  if (!result.success) {
    throw new Error(result.message || "Failed to fetch users");
  }

  return result.data || [];
};

export const fetchUserByUsername = async (username: string): Promise<User> => {
  const response = await apiClient.get(`/users/username/${username}`);

  const result: ApiResponse<User> = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  if (!result.data) {
    throw new Error("No user data returned");
  }

  return result.data;
};

export const updateUser = async (
  id: string,
  data: Partial<EditUserRequest>
): Promise<UserWithTokenResponse> => {
  const response = await apiClient.put(`/users/${id}`, data);

  const result: ApiResponse<UserWithTokenResponse> = await response.json();

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

export const acceptUser = async (id: string): Promise<string> => {
  const response = await apiClient.patch(`/users/${id}/accept`);

  const result: ApiResponse<string> = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  if (!result.data) {
    throw new Error("No data returned from server");
  }

  return result.data;
};

export const rejectUser = async (id: string): Promise<string> => {
  const response = await apiClient.patch(`/users/${id}/reject`);

  const result: ApiResponse<string> = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  if (!result.data) {
    throw new Error("No data returned from server");
  }

  return result.data;
};

export const deleteUser = async (id: string) => {
  const response = await apiClient.delete(`/users/${id}`);

  const result: ApiResponse<void> = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result.message;
};
