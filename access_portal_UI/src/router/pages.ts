import { lazy } from "react"

// Auth
export const LoginPage = lazy(() =>
  import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage }))
)
export const RootRedirect = lazy(() =>
  import("@/pages/RootRedirect").then((m) => ({ default: m.RootRedirect }))
)

// User Group

// Operator Group
export const DashboardPage = lazy(() =>
  import("@/pages/Dashboard").then((m) => ({ default: m.Dashboard }))
)

// Admin Group


// Fallback Utilities
export const UnauthorizedPage = lazy(() =>
  import("@/pages/UnauthorizedPage").then((m) => ({
    default: m.UnauthorizedPage,
  }))
)
