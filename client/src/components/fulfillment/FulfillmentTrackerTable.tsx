import React, { useState } from "react"
import type { GroupedAllocationHeader } from "@/components/fulfillment/hooks/useFullfilement"

interface TableProps {
    headers: GroupedAllocationHeader[]
    onEditClick: (headerId: number) => void
}

export const FulfillmentTrackerTable: React.FC<TableProps> = ({
    headers,
    onEditClick,
}) => {
    const [openHeaderId, setOpenHeaderId] = useState<number | null>(null)

    const toggleRow = (id: number) => {
        setOpenHeaderId(openHeaderId === id ? null : id)
    }

    return (
        <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Table Header Layout */}
            <div className="grid grid-cols-12 border-b border-slate-200 bg-slate-50/70 px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <div className="col-span-2">Allocation ID</div>
                <div className="col-span-3">Bill-To Customer</div>
                <div className="col-span-1">Region</div>
                <div className="col-span-2 text-center">Fill Rate Metric</div>
                <div className="col-span-1 text-right">Requested</div>
                <div className="col-span-1 text-right">Approved</div>
                <div className="col-span-1 text-center">Status</div>
                <div className="col-span-1 text-right">Actions</div>
            </div>

            {/* Structured Rows mapping data elements */}
            <div className="divide-y divide-slate-100">
                {headers.map((h) => {
                    const isExpanded = openHeaderId === h.headerId;
                    const fillRate = h.totalRequested > 0 ? Math.round((h.totalApproved / h.totalRequested) * 100) : 0;

                    const samplingLine = h.lines[0];
                    const customerDisplay = samplingLine?.customerName || `Open Pool`;
                    const locationDisplay = samplingLine?.customerRegion || `--`;
                    const hasUnapprovedLines = h.lines.some((line) => line.approvalFlag === "N");

                    // Color calculation helper for the fill rate indicators
                    const fillRateColor = fillRate >= 90 ? 'bg-emerald-500' : fillRate >= 50 ? 'bg-amber-500' : 'bg-rose-500';

                    return (
                        <div key={h.headerId} className="w-full bg-white">
                            {/* Row Trigger Frame */}
                            <div
                                onClick={() => toggleRow(h.headerId)}
                                className={`grid cursor-pointer grid-cols-12 items-center px-6 py-4 transition-all hover:bg-slate-50/50 ${isExpanded ? 'bg-blue-50/30' : ''
                                    }`}
                            >
                                {/* Allocation ID */}
                                <div className="col-span-2 flex items-center gap-3">
                                    <span className={`text-[10px] text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                                        ▶
                                    </span>
                                    <span className="font-mono text-sm font-bold text-slate-900">
                                        #{h.headerId}
                                    </span>
                                </div>

                                {/* Customer Info */}
                                <div className="col-span-3 pr-4" title={customerDisplay}>
                                    <div className="truncate text-sm font-semibold text-slate-800">{customerDisplay}</div>
                                    <div className="text-xs text-slate-400 font-normal">Created: {h.createdOn ? new Date(h.createdOn).toLocaleDateString() : "—"}</div>
                                </div>

                                {/* Region */}
                                <div className="col-span-1 text-sm font-medium text-slate-600">
                                    {locationDisplay}
                                </div>

                                {/* Fill Rate Display */}
                                <div className="col-span-2 px-4">
                                    <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-700">
                                        <span>{fillRate}% Filled</span>
                                    </div>
                                    <div className="h-1.5 w-full rounded-full bg-slate-100">
                                        <div
                                            className={`h-full rounded-full transition-all duration-300 ${fillRateColor}`}
                                            style={{ width: `${Math.min(100, fillRate)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Requested Qty */}
                                <div className="col-span-1 text-right text-sm font-semibold text-slate-900">
                                    {h.totalRequested.toLocaleString()}
                                </div>

                                {/* Approved Qty */}
                                <div className="col-span-1 text-right text-sm font-bold text-emerald-600">
                                    {h.totalApproved.toLocaleString()}
                                </div>

                                {/* Main Status Tag */}
                                <div className="col-span-1 text-center">
                                    <span
                                        className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold tracking-wide ${h.status === "Fulfilled"
                                            ? "bg-emerald-50 text-emerald-700"
                                            : h.status === "Partial"
                                                ? "bg-amber-50 text-amber-700"
                                                : "bg-rose-50 text-rose-700"
                                            }`}
                                    >
                                        {h.status}
                                    </span>
                                </div>

                                {/* Action CTA Block */}
                                <div className="col-span-1 text-right">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEditClick(h.headerId);
                                        }}
                                        className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 active:bg-blue-800"
                                    >
                                        Review
                                    </button>
                                    {!hasUnapprovedLines && (
                                        <span className="text-xs font-medium text-slate-400 inline-flex items-center gap-1">
                                            <span className="text-emerald-500">✓</span> Approved
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Collapsible Child Line Item Cards View */}
                            {isExpanded && (
                                <div className="border-t border-b border-slate-200/60 bg-slate-50/40 px-8 py-4">
                                    <div className="rounded-lg border border-slate-200 bg-white shadow-xs">
                                        {/* Nested Subheader Row */}
                                        <div className="grid grid-cols-12 border-b border-slate-100 bg-slate-50/50 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            <div className="col-span-2">Line ID</div>
                                            <div className="col-span-4">Item Details</div>
                                            <div className="col-span-1 text-center">Plant</div>
                                            <div className="col-span-2 text-center">Target Date</div>
                                            <div className="col-span-1 text-right">Requested</div>
                                            <div className="col-span-1 text-right">Approved</div>
                                            <div className="col-span-1 text-right">Line Status</div>
                                        </div>

                                        {/* Nested Sub-rows mappings */}
                                        <div className="divide-y divide-slate-100">
                                            {h.lines.map((line) => {
                                                const isCancelledLine = line.closureFlag === "Y";
                                                return (
                                                    <div
                                                        key={line.lineId}
                                                        className={`grid grid-cols-12 items-center px-4 py-3 text-xs font-medium ${isCancelledLine ? "bg-rose-50/50 text-rose-900" : "text-slate-600 hover:bg-slate-50/30"}`}
                                                    >
                                                        <div className="col-span-2 font-mono font-bold text-indigo-600">
                                                            Line #{line.lineId}
                                                        </div>
                                                        <div className="col-span-4 pr-4">
                                                            <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-slate-800">
                                                                {line.itemCode?.trim()}
                                                            </span>
                                                            <span
                                                                className="mt-0.5 block truncate text-[11px] text-slate-400 font-normal"
                                                                title={line.itemDescription ?? undefined}
                                                            >
                                                                {line.itemDescription}
                                                            </span>
                                                        </div>
                                                        <div className="col-span-1 text-center font-mono text-slate-500">
                                                            {line.organizationCode || `ID: ${line.organizationId}`}
                                                        </div>
                                                        <div className="col-span-2 text-center text-slate-500 font-normal">
                                                            {line.targetDate ? new Date(line.targetDate).toLocaleDateString() : "—"}
                                                        </div>
                                                        <div className="col-span-1 text-right font-semibold whitespace-nowrap">
                                                            {line.oldRequestedQty !== null && line.oldRequestedQty !== undefined && line.oldRequestedQty !== line.b3Quantity ? (
                                                                <div className="flex items-center justify-end gap-1.5">
                                                                    {/* Old Quantity - Red Strikethrough */}
                                                                    <span className="text-xs text-red-500 line-through">
                                                                        {line.oldRequestedQty.toLocaleString()}
                                                                    </span>
                                                                    {/* Decorative separator arrow */}
                                                                    <span className="text-[10px] text-slate-400 font-normal">→</span>
                                                                    {/* New Quantity - Solid Emerald Green */}
                                                                    <span className="text-emerald-600 dark:text-emerald-400">
                                                                        {line.b3Quantity?.toLocaleString() || 0}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                /* Standard display fallback if there is no previous revision history amount */
                                                                <span className="text-slate-900 dark:text-slate-100">
                                                                    {line.b3Quantity?.toLocaleString() || 0}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className={`col-span-1 text-right font-bold ${isCancelledLine ? "text-rose-700" : "text-emerald-600"}`}>
                                                            {line.b3ApprovedQuantity !== null && line.b3ApprovedQuantity !== undefined
                                                                ? line.b3ApprovedQuantity.toLocaleString()
                                                                : "0"}
                                                        </div>
                                                        <div className="col-span-1 text-right">
                                                            <span
                                                                className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${line.closureFlag === "Y"
                                                                    ? "bg-rose-50 text-rose-700"
                                                                    : line.approvalFlag === "Y"
                                                                        ? "bg-emerald-50 text-emerald-700"
                                                                        : "bg-amber-50 text-amber-700"
                                                                    }`}
                                                            >
                                                                {line.closureFlag === "Y"
                                                                    ? "Canceled"
                                                                    : line.approvalFlag === "Y"
                                                                        ? "Approved"
                                                                        : "Amended"
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    )
}
