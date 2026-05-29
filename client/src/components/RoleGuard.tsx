import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/constants";
import React from "react";
import { Navigate, Outlet } from "react-router-dom";

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

interface RoleGuardProps {
  allowedRoles: UserRoleType[];
  children?: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { isAuthenticated, currentUserRole } = useAuth();

  // 1. If not authenticated or role is missing, redirect to login instantly
  if (!isAuthenticated || !currentUserRole) {
    return <Navigate to="/login" replace />;
  }

  // 2. Map the string role (e.g., "User") to its numeric enum value (e.g., 4)
  // We use keyof typeof UserRole to safely look up the key dynamically
  const roleKey = currentUserRole as keyof typeof UserRole;
  const activeRole = UserRole[roleKey];

  // 3. Fallback check if the string coming from the API doesn't match any key in your constants
  if (activeRole === undefined) {
    console.error(`Role '${currentUserRole}' matches no valid application boundaries.`);
    return <Navigate to="/unauthorized" replace />;
  }

  // 4. Perform type-safe array inclusion validation using the resolved number
  if (!allowedRoles.includes(activeRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

export default RoleGuard;
