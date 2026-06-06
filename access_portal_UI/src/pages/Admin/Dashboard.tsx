import { dashboardApi } from "@/api/dashboardApi"; // Ensure this path matches your project structure
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  UserCheck,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Contract matching your backend Dto layout structures
interface RecentRequestDto {
  requestId: number
  userId: number
  status: string
  createdOn: string
  itemCount: number
}

interface DashboardDataDto {
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

export const Dashboard = () => {
  const [stats, setStats] = useState<DashboardDataDto | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadDashboardMetrics = async () => {
      try {
        setLoading(true)
        const response = await dashboardApi.getDashboard()
        setStats(response)
        setError(null)
      } catch (err: any) {
        console.error(err)
        setError(err?.message || "Failed to load system metrics.")
      } finally {
        setLoading(false)
      }
    }

    loadDashboardMetrics()
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
        <Activity className="h-4 w-4 animate-spin text-primary" />
        Loading metrics data stream...
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="p-6 text-center text-sm text-destructive">
        {error || "No response data available from the core server."}
      </div>
    )
  }

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

      {/* PERSONAL METRIC SUBSECTION BAR */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight mb-3">My Request Metrics</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-muted/40">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">My Pending Items</p>
                <div className="text-xl font-bold">{stats.myPendingItems}</div>
              </div>
              <Clock className="h-5 w-5 text-amber-500" />
            </CardContent>
          </Card>
          <Card className="bg-muted/40">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">My Approved Items</p>
                <div className="text-xl font-bold text-emerald-600">{stats.myApprovedItems}</div>
              </div>
              <UserCheck className="h-5 w-5 text-emerald-500" />
            </CardContent>
          </Card>
          <Card className="bg-muted/40">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">My Rejected Items</p>
                <div className="text-xl font-bold text-destructive">{stats.myRejectedItems}</div>
              </div>
              <XCircle className="h-5 w-5 text-destructive" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CHARTS & LIVE REQUESTS ROW */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Global Breakdown Chart View */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Global Workflow Breakdown</CardTitle>
            <CardDescription>
              Categorized lifecycle status distribution of system access requests.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-75 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted)/0.2)" }}
                    contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }}
                  />
                  <Legend />
                  <Bar dataKey="HOD" stackId="a" fill="#eab308" />
                  <Bar dataKey="IT" stackId="a" fill="#2563eb" />
                  <Bar dataKey="Active" fill="#10b981" />
                  <Bar dataKey="Revoked" stackId="b" fill="#64748b" />
                  <Bar dataKey="Expired" stackId="b" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}