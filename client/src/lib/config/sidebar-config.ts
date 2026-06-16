import type { UserRoleType } from "@/components/RoleGuard"
import { ClipboardList, FileText } from "lucide-react"

export interface SidebarGroupItem {
  label: string
  desc?: string
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
        label: "Dashboard",
        desc: "View your dashboard and access key features",
        to: "/dashboard",
        icon: FileText,
        roles: ["hod"],
      },
      {
        label: "Bin Allocation",
        desc: "Create forecast entries",
        to: "/my-requests",
        icon: ClipboardList,
        roles: ["user", "hod"],
      },
    ],
  },
]
