import React from "react"
import { Layers, AlertTriangle, Check, TrendingUp } from "lucide-react"
import type { AllocationSummary } from "@/api/allocationApi"

interface Props {
  summary: AllocationSummary[]
  loading: boolean
}

function MetricRow({
  label,
  value,
  colorClass,
  Icon,
}: {
  label: string
  value: number | string
  colorClass: string
  Icon: React.ElementType
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs">
      <span className={`flex items-center gap-1.5 ${colorClass}`}>
        <Icon size={12} />
        {label}
      </span>
      <span className={`font-mono font-bold ${colorClass}`}>{value}</span>
    </div>
  )
}

export function AllocationSidebar({ summary, loading }: Props) {
  // Aggregate totals from summary
  const totalLines = summary.reduce((acc, h) => acc + h.totalLines, 0)
  const pendingLines = summary.reduce((acc, h) => acc + h.pendingLines, 0)
  const approvedLines = summary.reduce((acc, h) => acc + h.approvedLines, 0)
  const totalQty = summary.reduce((acc, h) => acc + h.totalRequestedQty, 0)

  // Last 5 headers for recents
  const recents = [...summary]
    .sort(
      (a, b) =>
        new Date(b.transactionDate).getTime() -
        new Date(a.transactionDate).getTime()
    )
    .slice(0, 6)

  return (
    <div className="space-y-4">
      {/* KPI card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-xl">
        <h3 className="mb-3 text-xs font-bold tracking-wider text-slate-400 uppercase">
          Portfolio Summary
        </h3>
        {loading ? (
          <div className="py-4 text-center text-xs text-slate-500">
            Loading…
          </div>
        ) : (
          <div className="space-y-2">
            <MetricRow
              label="Total Lines"
              value={totalLines}
              colorClass="text-slate-400"
              Icon={Layers}
            />
            <MetricRow
              label="Pending Approval"
              value={pendingLines}
              colorClass="text-amber-400"
              Icon={AlertTriangle}
            />
            <MetricRow
              label="Approved"
              value={approvedLines}
              colorClass="text-emerald-400"
              Icon={Check}
            />
            <MetricRow
              label="Total Requested Qty"
              value={totalQty.toLocaleString()}
              colorClass="text-blue-400"
              Icon={TrendingUp}
            />
          </div>
        )}
      </div>

      {/* Recent headers */}
      <div className="flex max-h-[360px] flex-col rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-xl">
        <h3 className="mb-2 flex-shrink-0 text-xs font-bold tracking-wider text-slate-400 uppercase">
          Recent Allocations
        </h3>
        <div className="flex-1 space-y-1.5 overflow-y-auto pr-0.5">
          {loading && (
            <div className="py-4 text-center text-xs text-slate-500">
              Loading…
            </div>
          )}
          {!loading && recents.length === 0 && (
            <div className="py-3 text-center text-xs text-slate-600 italic">
              No allocations yet.
            </div>
          )}
          {!loading &&
            recents.map((h) => (
              <div
                key={h.headerId}
                className="flex items-start justify-between gap-2 rounded-md border border-slate-800 bg-slate-950 p-2.5 text-[11px]"
              >
                <div className="min-w-0">
                  <div className="truncate font-mono font-bold text-blue-400">
                    #{h.headerId}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {new Date(h.transactionDate).toLocaleDateString()}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {h.totalLines} line{h.totalLines !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="font-mono text-[11px] text-slate-300">
                    {h.totalRequestedQty.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-slate-500">units</div>
                  {h.pendingLines > 0 && (
                    <span className="mt-0.5 inline-block rounded border border-amber-900/30 bg-amber-950 px-1.5 py-0.5 text-[9px] font-bold text-amber-400">
                      {h.pendingLines} pending
                    </span>
                  )}
                  {h.pendingLines === 0 && h.approvedLines > 0 && (
                    <span className="mt-0.5 inline-block rounded border border-emerald-900/30 bg-emerald-950 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                      ✓ Approved
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
