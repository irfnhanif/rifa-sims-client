import type { UserRole } from "./user-role"
import type { UserType } from "./user-type"

export interface User {
    id: string
    username: string
    password: string
    branch: number
    role: UserRole
    status: UserType
    addedToNotification: boolean
}

export interface UserInfo {
  username: string;
  role: UserRole;
  isExpired: boolean;
}

export interface RegisterRequest {
  username: string;
  password: string;
  branch: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}