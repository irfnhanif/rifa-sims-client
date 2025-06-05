import apiConfig from "../config/api";
import type { UserInfo } from "../types/user";
import type { UserRole } from "../types/user-role";

interface JWTPayload {
  sub: string;
  role: UserRole;
  iat?: number;
  exp?: number;
  [key: string]: any; 
}

export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT format");
    }

    const payload = parts[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );

    const decoded = atob(padded);
    return JSON.parse(decoded) as JWTPayload;
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
};

export const isTokenExpired = (payload: JWTPayload): boolean => {
  if (!payload.exp) return false;

  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
};



export const isAuthenticated = (): boolean => {
  const token = apiConfig.getToken();
  if (!token) return false;

  const payload = decodeJWT(token);
  if (!payload) return false;

  return !isTokenExpired(payload);
};

export const getCurrentUser = (): UserInfo | null => {
  const token = apiConfig.getToken();
  if (!token) return null;

  const payload = decodeJWT(token);
  if (!payload) return null;

  return {
    username: payload.sub,
    role: payload.role,
    isExpired: isTokenExpired(payload),
  };
};

export const getCurrentToken = (): string | null => {
  return apiConfig.getToken();
};

export const getTokenExpiration = (): Date | null => {
  const token = apiConfig.getToken();
  if (!token) return null;

  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return null;

  return new Date(payload.exp * 1000);
};

export const isTokenExpiringSoon = (): boolean => {
  const token = apiConfig.getToken();
  if (!token) return true;

  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return true;

  const currentTime = Math.floor(Date.now() / 1000);
  const fiveMinutesFromNow = currentTime + 5 * 60;

  return payload.exp < fiveMinutesFromNow;
};
