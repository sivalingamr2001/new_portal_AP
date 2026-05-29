import type { UserRoleType } from "@/components/RoleGuard"
import {
  FileText,
  CheckSquare,
  LayoutDashboard,
  ShieldCheck,
  Clock,
  Users,
  Building2,
  FolderTree,
} from "lucide-react"

export interface SidebarGroupItem {
  label: string
  to: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRoleType[]
}

export interface SidebarGroup {
  title: string
  items: SidebarGroupItem[]
}

export const sidebarItems: SidebarGroup[] = [
  {
    title: "User",
    items: [
      {
        label: "My Requests",
        to: "/my-requests",
        icon: FileText,
        roles: [4], // UserRole.User
      },
    ],
  },
  {
    title: "HOD",
    items: [
      {
        label: "Pending Approvals",
        to: "/hod/pending-approvals",
        icon: CheckSquare,
        roles: [3], // UserRole.Hod
      },
      {
        label: "All Requests",
        to: "/hod/all-requests",
        icon: FileText,
        roles: [3], // UserRole.Hod
      },
    ],
  },
  {
    title: "Operator",
    items: [
      {
        label: "Dashboard",
        to: "/dashboard",
        icon: LayoutDashboard,
        roles: [2], // UserRole.It / Operator
      },
      {
        label: "Approval Queue",
        to: "/operator/approval-queue",
        icon: ShieldCheck,
        roles: [2], // UserRole.It / Operator
      },
      {
        label: "Active Access",
        to: "/operator/active-access",
        icon: Clock,
        roles: [2], // UserRole.It / Operator
      },
      {
        label: "All Requests",
        to: "/operator/all-requests",
        icon: FileText,
        roles: [2], // UserRole.It / Operator
      },
    ],
  },
  {
    title: "Admin",
    items: [
      {
        label: "Dashboard",
        to: "/dashboard",
        icon: LayoutDashboard,
        roles: [1], // UserRole.Admin
      },
      {
        label: "Employee",
        to: "/users",
        icon: Users,
        roles: [1], // UserRole.Admin
      },
      {
        label: "Departments",
        to: "/departments",
        icon: Building2,
        roles: [1], // UserRole.Admin
      },
      {
        label: "Folder Mapping",
        to: "/folder-mapping",
        icon: FolderTree,
        roles: [1], // UserRole.Admin
      },
      {
        label: "Audit Logs",
        to: "/admin/audit-logs",
        icon: FileText,
        roles: [1], // UserRole.Admin
      },
    ],
  },
]
