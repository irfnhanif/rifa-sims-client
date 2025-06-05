import React, {
  createContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { LoginRequest, UserInfo } from "../types/user";
import {
  login as apiLogin,
  logout as apiLogout,
  refreshToken,
} from "../api/auth";
import { getCurrentUser, isAuthenticated, isTokenExpiringSoon } from "./jwt";

interface AuthContextType {
  user: UserInfo | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: Partial<LoginRequest>) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await apiLogout();
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRefreshToken = useCallback(async () => {
    try {
      const userInfo = await refreshToken();
      setUser(userInfo);
    } catch (error) {
      console.error("Token refresh failed:", error);
      await logout();
    }
  }, [logout]);

  useEffect(() => {
    const checkAuth = () => {
      if (isAuthenticated()) {
        const currentUser = getCurrentUser();
        setUser(currentUser);

        if (isTokenExpiringSoon()) {
          handleRefreshToken();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [handleRefreshToken]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (user && isAuthenticated()) {
      interval = setInterval(() => {
        if (isTokenExpiringSoon()) {
          handleRefreshToken();
        }
      }, 60000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user, handleRefreshToken]);

  const login = useCallback(async (credentials: Partial<LoginRequest>) => {
    setIsLoading(true);
    try {
      const userInfo = await apiLogin(credentials);
      setUser(userInfo);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user && isAuthenticated(),
    login,
    logout,
    refreshToken: handleRefreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext };
export type { AuthContextType };
