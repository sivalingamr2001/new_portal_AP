import { lazy } from "react"

// Auth
export const LoginPage = lazy(() =>
  import("@/pages/Auth/LoginPage").then((m) => ({ default: m.LoginPage }))
)
export const RootRedirect = lazy(() =>
  import("@/pages/RootRedirect").then((m) => ({ default: m.RootRedirect }))
)

export const UserProfilePage = lazy(() =>
  import("@/components/Users/UserProfilePage").then((m) => ({
    default: m.UserProfilePage,
  }))
)

// User Group
export const MyRequestsPage = lazy(() =>
  import("@/pages/Users/MyRequests").then((m) => ({ default: m.MyRequestsPage }))
)

export const RequestDetailsPage = lazy(() =>
  import("@/components/AccessRequests/Details/RequestDetailsPage").then((m) => ({
    default: m.RequestDetailsPage,
  }))
)

// HOD Group
export const PendingApprovalsPage = lazy(() =>
  import("@/pages/PendingApprovalsPage").then((m) => ({
    default: m.PendingApprovalsPage,
  }))
)
export const HodAllRequestsPage = lazy(() =>
  import("@/pages/HodAllRequestsPage").then((m) => ({
    default: m.HodAllRequestsPage,
  }))
)

// Operator Group
export const DashboardPage = lazy(() =>
  import("@/pages/Dashboard").then((m) => ({ default: m.Dashboard }))
)
export const ApprovalQueuePage = lazy(() =>
  import("@/pages/ApprovalQueuePage").then((m) => ({
    default: m.ApprovalQueuePage,
  }))
)
export const ActiveAccessPage = lazy(() =>
  import("@/pages/ActiveAccessPage").then((m) => ({
    default: m.ActiveAccessPage,
  }))
)
export const OperatorAllRequestsPage = lazy(() =>
  import("@/pages/OperatorAllRequestsPage").then((m) => ({
    default: m.OperatorAllRequestsPage,
  }))
)

// Admin Group
export const UsersPage = lazy(() =>
  import("@/pages/UsersPage").then((m) => ({ default: m.UsersPage }))
)
export const DepartmentsPage = lazy(() =>
  import("@/pages/DepartmentsPage").then((m) => ({
    default: m.DepartmentsPage,
  }))
)
export const FolderMappingPage = lazy(() =>
  import("@/pages/FolderMappingPage").then((m) => ({
    default: m.FolderMappingPage,
  }))
)
export const AuditLogsPage = lazy(() =>
  import("@/pages/AuditLogsPage").then((m) => ({ default: m.AuditLogsPage }))
)

// Fallback Utilities
export const UnauthorizedPage = lazy(() =>
  import("@/pages/UnauthorizedPage").then((m) => ({
    default: m.UnauthorizedPage,
  }))
)
