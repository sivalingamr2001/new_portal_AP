import { useState } from 'react'
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'

interface ItemLine {
  id: string
  itemCode: string
  itemName: string
  customer: string
  region: string
  binQty: number
  approvedQty?: number
  targetDate: string
  status: 'Pending' | 'Approved' | 'Amend Pending' | 'Partial' | 'Fulfilled'
  oaDetails?: Array<{ oaNumber: string; date: string; qty: number; allocated: number; status: string }>
}

interface DashboardContext {
  items: ItemLine[]
}

export function FulfillmentScreen() {
  const { items } = useOutletContext<DashboardContext>()
  const [expandedId, setExpandedId] = useState<string | null>('2')

  const activeFulfillmentItems = items.filter(i => ['Approved', 'Fulfilled', 'Partial'].includes(i.status))

  const totalApprovedUnits = activeFulfillmentItems.reduce((acc, curr) => acc + (curr.approvedQty || curr.binQty), 0)
  const totalAllocatedOAUnits = activeFulfillmentItems.reduce((acc, curr) => {
    if (curr.oaDetails) return acc + curr.oaDetails.reduce((sum, oa) => sum + oa.allocated, 0)
    return acc + (curr.status === 'Fulfilled' ? (curr.approvedQty || curr.binQty) : 0)
  }, 0)

  const fillRate = totalApprovedUnits > 0 ? Math.round((totalAllocatedOAUnits / totalApprovedUnits) * 100) : 0

  return (
    <div className="space-y-6">
      
      {/* METRICS DASHBOARD TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="text-xs text-muted-foreground font-medium">Approved Lines</div>
          <div className="text-xl font-bold font-mono mt-1 text-foreground">{activeFulfillmentItems.length} <span className="text-xs text-muted-foreground/65 font-normal">active lines</span></div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="text-xs text-muted-foreground font-medium">Approved Qty</div>
          <div className="text-xl font-bold font-mono mt-1 text-primary">{totalApprovedUnits.toLocaleString()} <span className="text-xs text-muted-foreground/65 font-normal">units</span></div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="text-xs text-muted-foreground font-medium">Allocated (OA)</div>
          <div className="text-xl font-bold font-mono mt-1 text-emerald-600 dark:text-emerald-400">{totalAllocatedOAUnits.toLocaleString()} <span className="text-xs text-muted-foreground/65 font-normal">({fillRate}% fill rate)</span></div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="text-xs text-muted-foreground font-medium">Unallocated</div>
          <div className="text-xl font-bold font-mono mt-1 text-amber-600 dark:text-amber-400">{(totalApprovedUnits - totalAllocatedOAUnits).toLocaleString()} <span className="text-xs text-muted-foreground/65 font-normal">remaining</span></div>
        </div>
      </div>

      {/* TRACKER CORE LIST */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-md font-bold text-foreground">Fulfillment Tracker</h2>
          <p className="text-xs text-muted-foreground">Review system order tracking logs matched with your approved operational components portfolio.</p>
        </div>

        <div className="space-y-2">
          {activeFulfillmentItems.map((item) => {
            const isExpanded = expandedId === item.id
            const targetQty = item.approvedQty || item.binQty
            const allocatedQty = item.oaDetails ? item.oaDetails.reduce((s, o) => s + o.allocated, 0) : (item.status === 'Fulfilled' ? targetQty : 0)
            const progressionPct = Math.min(100, Math.round((allocatedQty / targetQty) * 100))
            
            return (
              <div key={item.id} className="border border-border bg-muted/20 rounded-lg overflow-hidden">
                {/* HEAD LINE VIEW */}
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="p-3.5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                    <div>
                      <div className="font-mono font-bold text-primary text-xs">{item.itemCode}</div>
                      <div className="text-[11px] text-muted-foreground">{item.customer} · <span className="text-muted-foreground/80">{item.region}</span></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground">Appr. Qty</div>
                      <div className="text-xs font-mono font-semibold text-foreground">{targetQty.toLocaleString()}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground">Allocated</div>
                      <div className="text-xs font-mono font-semibold text-foreground">{allocatedQty.toLocaleString()}</div>
                    </div>

                    <div className="w-24 hidden sm:block">
                      <div className="flex justify-between text-[9px] text-muted-foreground font-mono mb-1">
                        <span>Progress</span>
                        <span>{progressionPct}%</span>
                      </div>
                      <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${progressionPct}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        progressionPct === 100 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                        progressionPct > 0 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' : 'bg-muted text-muted-foreground border border-border'
                      }`}>
                        {progressionPct === 100 ? 'Fulfilled' : progressionPct > 0 ? 'Partial' : 'Open'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* NESTED DETAILS SUB VIEW */}
                {isExpanded && (
                  <div className="bg-muted/40 border-t border-border p-4 font-sans">
                    <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Linked Order Acknowledgements (OA)</h4>
                    {item.oaDetails && item.oaDetails.length > 0 ? (
                      <div className="space-y-1.5">
                        <div className="grid grid-cols-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2">
                          <span>OA Number</span>
                          <span>OA Date</span>
                          <span className="text-right">OA Qty</span>
                          <span className="text-right">Allocated Status</span>
                        </div>
                        {item.oaDetails.map((oa, oIdx) => (
                          <div key={oIdx} className="grid grid-cols-4 items-center text-xs bg-background p-2 rounded border border-border font-mono">
                            <span className="text-primary font-semibold">{oa.oaNumber}</span>
                            <span className="text-muted-foreground text-[11px]">{oa.date}</span>
                            <span className="text-right text-foreground">{oa.qty}</span>
                            <span className="text-right text-emerald-600 dark:text-emerald-400 text-[11px] font-sans font-semibold">✓ {oa.status}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground/85 italic py-2 flex items-center gap-1.5">
                        <AlertTriangle size={13} /> No Order Acknowledgement documentation linked to this item track logs yet.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
