import React from "react";
import { useAuth } from "../helper/use-auth";
import NotFoundPage from "../pages/NotFoundPage";
import type { UserRole } from "../types/user-role";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user } = useAuth();

  const hasPermission =
    user?.roles?.some((role) => allowedRoles.includes(role)) ?? false;

  if (!hasPermission) {
    return <NotFoundPage />;
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;
