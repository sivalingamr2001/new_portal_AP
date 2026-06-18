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
    <div className="flex justify-between items-center text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-800">
      <span className={`flex items-center gap-1.5 ${colorClass}`}>
        <Icon size={12} />
        {label}
      </span>
      <span className={`font-bold font-mono ${colorClass}`}>{value}</span>
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
    .sort((a, b) =>
      new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
    )
    .slice(0, 6)

  return (
    <div className="space-y-4">
      {/* KPI card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Portfolio Summary
        </h3>
        {loading ? (
          <div className="text-xs text-slate-500 text-center py-4">Loading…</div>
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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl max-h-[360px] flex flex-col">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex-shrink-0">
          Recent Allocations
        </h3>
        <div className="space-y-1.5 overflow-y-auto pr-0.5 flex-1">
          {loading && (
            <div className="text-xs text-slate-500 text-center py-4">Loading…</div>
          )}
          {!loading && recents.length === 0 && (
            <div className="text-xs text-slate-600 italic py-3 text-center">
              No allocations yet.
            </div>
          )}
          {!loading &&
            recents.map((h) => (
              <div
                key={h.headerId}
                className="bg-slate-950 border border-slate-800 p-2.5 rounded-md text-[11px] flex justify-between items-start gap-2"
              >
                <div className="min-w-0">
                  <div className="font-bold text-blue-400 font-mono truncate">
                    #{h.headerId}
                  </div>
                  <div className="text-slate-400 text-[10px]">
                    {new Date(h.transactionDate).toLocaleDateString()}
                  </div>
                  <div className="text-slate-500 text-[10px]">
                    {h.totalLines} line{h.totalLines !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-mono text-slate-300 text-[11px]">
                    {h.totalRequestedQty.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-slate-500">units</div>
                  {h.pendingLines > 0 && (
                    <span className="text-[9px] bg-amber-950 text-amber-400 border border-amber-900/30 px-1.5 py-0.5 rounded font-bold mt-0.5 inline-block">
                      {h.pendingLines} pending
                    </span>
                  )}
                  {h.pendingLines === 0 && h.approvedLines > 0 && (
                    <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-900/30 px-1.5 py-0.5 rounded font-bold mt-0.5 inline-block">
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
