import RoleGuard from "@/components/RoleGuard"
import { UserRole } from "@/lib/constants"
import { roleStringToNumeric } from "@/lib/roleMapper"
import { Navigate, type RouteObject } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

import AppLayout from "@/layout/AppLayout"
import { AuthLayout } from "@/layout/AuthLayout"
import ErrorBountry from "@/pages/ErrorBountry"
import { ProtectedRoute } from "@/pages/ProtectedRoute"

import * as Pages from "./pages"
import { withSuspense } from "./withSuspense"

const HomeRedirect = () => {
  const { currentUserRole, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const userRoleNumeric = roleStringToNumeric(currentUserRole)

  switch (userRoleNumeric) {
    case UserRole.Admin:
      return <Navigate to="/dashboard" replace />
    case UserRole.Operator:
      return <Navigate to="/operator/dashboard" replace />
    case UserRole.Hod:
      return <Navigate to="/hod/pending-approvals" replace />
    case UserRole.User:
      return <Navigate to="/my-requests" replace />
    default:
      return <Navigate to="/unauthorized" replace />
  }
}

export const routesConfig: RouteObject[] = [
  {
    element: <ProtectedRoute />,
    errorElement: <ErrorBountry />,
    children: [
      {
        element: <AppLayout />,
        errorElement: <ErrorBountry />,
        children: [
          { index: true, element: <HomeRedirect /> },
          {
            path: "/unauthorized",
            element: withSuspense(Pages.UnauthorizedPage),
          },

          // --- USER PATHS ---
          {
            element: <RoleGuard allowedRoles={[UserRole.User]} />,
            children: [
              {
                path: "/my-requests",
                element: withSuspense(Pages.MyRequestsPage),
              },
            ],
          },

          // --- HOD PATHS ---
          {
            element: <RoleGuard allowedRoles={[UserRole.Hod]} />,
            children: [
              {
                path: "/hod/pending-approvals",
                element: withSuspense(Pages.PendingApprovalsPage),
              },
              {
                path: "/hod/all-requests",
                element: withSuspense(Pages.HodAllRequestsPage),
              },
            ],
          },

          // --- OPERATOR PATHS ---
          {
            element: <RoleGuard allowedRoles={[UserRole.Operator]} />,
            children: [
              {
                path: "/operator/dashboard",
                element: withSuspense(Pages.DashboardPage),
              },
              {
                path: "/operator/approval-queue",
                element: withSuspense(Pages.ApprovalQueuePage),
              },
              {
                path: "/operator/active-access",
                element: withSuspense(Pages.ActiveAccessPage),
              },
              {
                path: "/operator/all-requests",
                element: withSuspense(Pages.OperatorAllRequestsPage),
              },
            ],
          },

          // --- ADMIN PATHS ---
          {
            element: <RoleGuard allowedRoles={[UserRole.Admin]} />,
            children: [
              {
                path: "/dashboard",
                element: withSuspense(Pages.DashboardPage),
              },
              { path: "/users", element: withSuspense(Pages.UsersPage) },
              {
                path: "/departments",
                element: withSuspense(Pages.DepartmentsPage),
              },
              {
                path: "/folder-mapping",
                element: withSuspense(Pages.FolderMappingPage),
              },
              {
                path: "/admin/audit-logs",
                element: withSuspense(Pages.AuditLogsPage),
              },
            ],
          },
        ],
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      { path: "/login", element: withSuspense(Pages.LoginPage) },
    ],
  },
]
