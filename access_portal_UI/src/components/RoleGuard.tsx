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

  if (!isAuthenticated || !currentUserRole) {
    return <Navigate to="/login" replace />
  }

  const activeRole: any = roleStringToNumeric(currentUserRole)

  if (!allowedRoles.includes(activeRole)) {
    console.warn(
      `User with role '${currentUserRole}' (${activeRole}) does not have access to allowed roles: ${allowedRoles.join(", ")}`
    )
    return <Navigate to="/unauthorized" replace />
  }

  return children ? <>{children}</> : <Outlet />
}

export default RoleGuard
