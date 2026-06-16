import { useAuth } from "@/context/AuthContext"
import { DEV_BYPASS_AUTH } from "@/lib/config/auth-config"
import { Navigate, type RouteObject } from "react-router-dom"

import AppLayout from "@/layout/AppLayout"
import { AuthLayout } from "@/layout/AuthLayout"
import ErrorBountry from "@/pages/ErrorBountry"
import { ProtectedRoute } from "@/pages/ProtectedRoute"

import * as Pages from "./pages"
import { withSuspense } from "./withSuspense"

const HomeRedirect = () => {
  const { isAuthenticated } = useAuth()

  if (!DEV_BYPASS_AUTH && !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to="/allocation" replace />
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
            element: DEV_BYPASS_AUTH ? (
              <Navigate to="/allocation" replace />
            ) : (
              withSuspense(Pages.UnauthorizedPage)
            ),
          },
          {
            path: "/dashboard",
            element: withSuspense(Pages.DashboardPage),
          },
          {
            path: "/allocation",
            element: withSuspense(Pages.AllocationPage),
          },
          {
            path: "/approval",
            element: withSuspense(Pages.ApprovalPage),
          },
          {
            path: "/amendment",
            element: withSuspense(Pages.AmendmentPage),
          },
          {
            path: "/fulfillment",
            element: withSuspense(Pages.FulfillmentPage),
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
