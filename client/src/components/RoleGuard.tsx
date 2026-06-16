import { useAuth } from "@/context/AuthContext"
import { DEV_BYPASS_AUTH } from "@/lib/config/auth-config"
import React from "react"
import { Navigate, Outlet } from "react-router-dom"

export type UserRoleType = "hod" | "user"

interface RoleGuardProps {
  allowedRoles: UserRoleType[]
  children?: React.ReactNode
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { isAuthenticated, currentUserRole } = useAuth()

  if (DEV_BYPASS_AUTH) {
    return children ? <>{children}</> : <Outlet />
  }

  if (!isAuthenticated || !currentUserRole) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(currentUserRole)) {
    console.warn(
      `User with role '${currentUserRole}' does not have access to allowed roles: ${allowedRoles.join(", ")}`
    )
    return <Navigate to="/unauthorized" replace />
  }

  return children ? <>{children}</> : <Outlet />
}

export default RoleGuard
