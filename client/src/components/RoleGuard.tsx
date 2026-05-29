import { useAuth } from "@/context/AuthContext"
import { UserRole } from "@/lib/constants"
import { roleStringToNumeric } from "@/lib/roleMapper"
import React from "react"
import { Navigate, Outlet } from "react-router-dom"

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole]

interface RoleGuardProps {
  allowedRoles: UserRoleType[]
  children?: React.ReactNode
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { isAuthenticated, currentUserRole } = useAuth()

  // 1. If not authenticated or role is missing, redirect to login instantly
  if (!isAuthenticated || !currentUserRole) {
    return <Navigate to="/login" replace />
  }

  // 2. Map the string role (e.g., "User", "Operator") to its numeric enum value
  const activeRole: any = roleStringToNumeric(currentUserRole)

  // 3. Perform type-safe array inclusion validation using the resolved number
  if (!allowedRoles.includes(activeRole)) {
    console.warn(
      `User with role '${currentUserRole}' (${activeRole}) does not have access to allowed roles: ${allowedRoles.join(", ")}`
    )
    return <Navigate to="/unauthorized" replace />
  }

  return children ? <>{children}</> : <Outlet />
}

export default RoleGuard
