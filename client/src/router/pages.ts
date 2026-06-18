import { lazy } from "react"

// Auth
export const LoginPage = lazy(() =>
  import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage }))
)
export const RootRedirect = lazy(() =>
  import("@/pages/RootRedirect").then((m) => ({ default: m.RootRedirect }))
)

export const DashboardPage = lazy(() =>
  import("@/pages/Dashboard").then((m) => ({ default: m.default }))
)

export const AllocationPage = lazy(() =>
  import("@/pages/Allocation").then((m) => ({ default: m.AllocationScreen }))
)

export const ApprovalPage = lazy(() =>
  import("@/pages/Approval").then((m) => ({ default: m.ApprovalScreen }))
)

export const AmendmentPage = lazy(() =>
  import("@/pages/Amendment").then((m) => ({ default: m.AmendmentScreen }))
)

export const FulfillmentPage = lazy(() =>
  import("@/pages/Fulfillment").then((m) => ({ default: m.FulfillmentScreen }))
)

export const EditAllocationPage = lazy(() =>
  import("@/pages/EditAllocationScreen").then((m) => ({ default: m.EditAllocationScreen }))
)

// Fallback Utilities
export const UnauthorizedPage = lazy(() =>
  import("@/pages/UnauthorizedPage").then((m) => ({
    default: m.UnauthorizedPage,
  }))
)
