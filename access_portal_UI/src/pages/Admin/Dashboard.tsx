import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FileText,
  UserCheck,
  XCircle,
} from "lucide-react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// 1. Explicitly defining interface contracts to match your backend Records
interface RecentRequestDto {
  requestId: number
  userId: number
  status: string
  createdOn: string
  itemCount: number
}

interface DashboardProps {
  data: {
    totalRequests: number
    pendingWithHod: number
    pendingWithIt: number
    approvedActive: number
    hodRejected: number
    itRejected: number
    revoked: number
    expired: number
    expiringSoon: number
    myPendingItems: number
    myApprovedItems: number
    myRejectedItems: number
    recentRequests: RecentRequestDto[]
  }
}

export const Dashboard = ({ data }: DashboardProps) => {
  // Safe fallbacks to prevent errors if the API response is undefined
  const stats = data || {
    totalRequests: 0,
    pendingWithHod: 0,
    pendingWithIt: 0,
    approvedActive: 0,
    hodRejected: 0,
    itRejected: 0,
    revoked: 0,
    expired: 0,
    expiringSoon: 0,
    myPendingItems: 0,
    myApprovedItems: 0,
    myRejectedItems: 0,
    recentRequests: [],
  }

  // Formatting backend metrics dynamically for the bar chart visualization
  const chartData = [
    {
      name: "Pending",
      HOD: stats.pendingWithHod,
      IT: stats.pendingWithIt,
    },
    {
      name: "Approved",
      Active: stats.approvedActive,
    },
    {
      name: "Rejected",
      HOD: stats.hodRejected,
      IT: stats.itRejected,
    },
    {
      name: "Closed",
      Revoked: stats.revoked,
      Expired: stats.expired,
    },
  ]

  // Dynamic color configuration mapper for Request Badge UI components
  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
      case "approvedactive":
        return "default"
      case "pendingwithhod":
      case "pendingwithit":
      case "pending":
        return "secondary"
      case "hodrejected":
      case "itrejected":
      case "rejected":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* HEADER BAR SUMMARY */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Access Request Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Real-time metric monitoring for system access items, HOD actions, and IT workflows.
          </p>
        </div>
      </div>

      {/* METRIC OVERVIEW CARDS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total System Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests}</div>
            <p className="text-xs text-muted-foreground">Aggregated across all system pipelines</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats.pendingWithHod + stats.pendingWithIt}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingWithHod} with HOD • {stats.pendingWithIt} with IT
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clearances</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.approvedActive}</div>
            <p className="text-xs text-muted-foreground">Currently operational permissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Expirations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.expiringSoon}</div>
            <p className="text-xs text-muted-foreground">{stats.expired} expired elements tracked</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
