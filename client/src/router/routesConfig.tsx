import RoleGuard from "@/components/RoleGuard"
import { useAuth } from "@/context/AuthContext"
import { Navigate, type RouteObject } from "react-router-dom"

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

  switch (currentUserRole) {
    case "hod":
      return <Navigate to="/dashboard" replace />
    case "user":
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
          {
            element: <RoleGuard allowedRoles={["user"]} />,
            children: [
              {
                path: "/my-requests",
                element: withSuspense(Pages.MyRequestsPage),
              },
            ],
          },
          {
            element: <RoleGuard allowedRoles={["hod"]} />,
            children: [
              {
                path: "/dashboard",
                element: withSuspense(Pages.DashboardPage),
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
