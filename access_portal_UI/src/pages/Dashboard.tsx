import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Cpu,
  TrendingUp,
} from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

// Mock Telemetry Analytics Data
const performanceData = [
  { month: "Jan", efficiency: 88, load: 62 },
  { month: "Feb", efficiency: 92, load: 68 },
  { month: "Mar", efficiency: 89, load: 75 },
  { month: "Apr", efficiency: 94, load: 70 },
  { month: "May", efficiency: 95, load: 81 },
]

// Configuration object for shadcn/ui charts component theming
const chartConfig = {
  efficiency: {
    label: "Automation Efficiency",
    color: "hsl(var(--primary))",
  },
  load: {
    label: "System Load",
    color: "hsl(var(--muted-foreground))",
  },
  critical: {
    label: "Critical Faults",
    color: "hsl(var(--destructive))",
  },
  resolved: {
    label: "Resolved Events",
    color: "hsl(var(--chart-2))",
  },
}

export const Dashboard = () => {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* HEADER BAR SUMMARY */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Automation Overview
          </h1>
          <p className="text-sm text-muted-foreground">
            Real-time telemetry and resource management data for Janatics
            systems.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm">
            Export Logs <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* GRID SECTION 1: SYSTEM KPI METRIC CARDS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Overall Efficiency
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-muted-foreground">
              +1.2% from peak yesterday
            </p>
          </CardContent>
        </Card>

        {/* KPI 2 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Controllers
            </CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,482</div>
            <p className="text-xs text-muted-foreground">
              99.8% Online operational status
            </p>
          </CardContent>
        </Card>

        {/* KPI 3 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Incidents
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">8</div>
            <p className="text-xs text-muted-foreground">
              -3 unresolved issues since last hour
            </p>
          </CardContent>
        </Card>

        {/* KPI 4 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jobs Executed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42.9k</div>
            <p className="text-xs text-muted-foreground">
              Automated batch routines today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* GRID SECTION 2: CHARTS & LOG FEEDS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Analytics Line/Area Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>System Performance Timeline</CardTitle>
            <CardDescription>
              Comparing automation task efficiency metrics against
              infrastructure load.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart
                data={performanceData}
                margin={{ left: -20, right: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip
                  content={<ChartTooltipContent label="efficiency" />}
                />
                <Area
                  type="monotone"
                  dataKey="efficiency"
                  stroke="var(--color-efficiency)"
                  fill="var(--color-efficiency)"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="load"
                  stroke="var(--color-load)"
                  fill="var(--color-load)"
                  fillOpacity={0.05}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="flex gap-2 leading-none font-medium">
              Efficiency trended up by 5.2% this month{" "}
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="leading-none text-muted-foreground">
              Calculated dynamically over terminal node sensor streams.
            </div>
          </CardFooter>
        </Card>

        {/* Live Operations Incident Log Stream */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Live Automation Log</CardTitle>
            <CardDescription>
              Recent system events across industrial nodes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Event Row 1 */}
              <div className="flex items-center gap-4 border-b pb-3 last:border-0 last:pb-0">
                <span className="relative flex h-2 w-2 shrink-0 rounded-full bg-destructive" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm leading-none font-medium">
                    Pressure Overload Alert
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Node-42B • Pneumatic Valve System
                  </p>
                </div>
                <Badge variant="outline">11:24 AM</Badge>
              </div>
              {/* Event Row 2 */}
              <div className="flex items-center gap-4 border-b pb-3 last:border-0 last:pb-0">
                <span className="relative flex h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm leading-none font-medium">
                    Batch Sequence Completed
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Zone C • Packaging Array Line
                  </p>
                </div>
                <Badge variant="outline">11:15 AM</Badge>
              </div>
              {/* Event Row 3 */}
              <div className="flex items-center gap-4 border-b pb-3 last:border-0 last:pb-0">
                <span className="relative flex h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm leading-none font-medium">
                    Calibration Routine Needed
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Node-12 • Actuator Core Subunit
                  </p>
                </div>
                <Badge variant="outline">10:58 AM</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
