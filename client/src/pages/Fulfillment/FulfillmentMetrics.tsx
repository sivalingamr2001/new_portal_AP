interface FulfillmentMetricsProps {
  activeItemsCount: number
  totalApprovedUnits: number
  totalAllocatedOAUnits: number
  fillRate: number
}

export function FulfillmentMetrics({
  activeItemsCount,
  totalApprovedUnits,
  totalAllocatedOAUnits,
  fillRate,
}: FulfillmentMetricsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="text-xs text-muted-foreground font-medium">Approved Lines</div>
        <div className="text-xl font-bold font-mono mt-1 text-foreground">
          {activeItemsCount}{' '}
          <span className="text-xs text-muted-foreground/65 font-normal">active lines</span>
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="text-xs text-muted-foreground font-medium">Approved Qty</div>
        <div className="text-xl font-bold font-mono mt-1 text-primary">
          {totalApprovedUnits.toLocaleString()}{' '}
          <span className="text-xs text-muted-foreground/65 font-normal">units</span>
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="text-xs text-muted-foreground font-medium">Allocated (OA)</div>
        <div className="text-xl font-bold font-mono mt-1 text-emerald-600 dark:text-emerald-400">
          {totalAllocatedOAUnits.toLocaleString()}{' '}
          <span className="text-xs text-muted-foreground/65 font-normal">({fillRate}% fill rate)</span>
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="text-xs text-muted-foreground font-medium">Unallocated</div>
        <div className="text-xl font-bold font-mono mt-1 text-amber-600 dark:text-amber-400">
          {(totalApprovedUnits - totalAllocatedOAUnits).toLocaleString()}{' '}
          <span className="text-xs text-muted-foreground/65 font-normal">remaining</span>
        </div>
      </div>
    </div>
  )
}
