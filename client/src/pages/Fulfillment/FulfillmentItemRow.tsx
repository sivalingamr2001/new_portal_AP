import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import type { ItemLine } from '@/layout/AppLayout'

interface FulfillmentItemRowProps {
  item: ItemLine
  isExpanded: boolean
  setExpandedId: (id: string | null) => void
}

export function FulfillmentItemRow({
  item,
  isExpanded,
  setExpandedId,
}: FulfillmentItemRowProps) {
  const targetQty = item.approvedQty || item.binQty
  const allocatedQty = item.oaDetails
    ? item.oaDetails.reduce((s, o) => s + o.allocated, 0)
    : item.status === 'Fulfilled'
    ? targetQty
    : 0
  const progressionPct = Math.min(100, Math.round((allocatedQty / targetQty) * 100))

  return (
    <div className="border border-border bg-muted/20 rounded-lg overflow-hidden">
      {/* HEAD LINE VIEW */}
      <div
        onClick={() => setExpandedId(isExpanded ? null : item.id)}
        className="p-3.5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronUp size={16} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={16} className="text-muted-foreground" />
          )}
          <div>
            <div className="font-mono font-bold text-primary text-xs">{item.itemCode}</div>
            <div className="text-[11px] text-muted-foreground">
              {item.customer} · <span className="text-muted-foreground/80">{item.region}</span>
            </div>
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
              <div
                className="bg-emerald-500 h-full rounded-full"
                style={{ width: `${progressionPct}%` }}
              ></div>
            </div>
          </div>

          <div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                progressionPct === 100
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : progressionPct > 0
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  : 'bg-muted text-muted-foreground border border-border'
              }`}
            >
              {progressionPct === 100 ? 'Fulfilled' : progressionPct > 0 ? 'Partial' : 'Open'}
            </span>
          </div>
        </div>
      </div>

      {/* NESTED DETAILS SUB VIEW */}
      {isExpanded && (
        <div className="bg-muted/40 border-t border-border p-4 font-sans">
          <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Linked Order Acknowledgements (OA)
          </h4>
          {item.oaDetails && item.oaDetails.length > 0 ? (
            <div className="space-y-1.5">
              <div className="grid grid-cols-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2">
                <span>OA Number</span>
                <span>OA Date</span>
                <span className="text-right">OA Qty</span>
                <span className="text-right">Allocated Status</span>
              </div>
              {item.oaDetails.map((oa, oIdx) => (
                <div
                  key={oIdx}
                  className="grid grid-cols-4 items-center text-xs bg-background p-2 rounded border border-border font-mono"
                >
                  <span className="text-primary font-semibold">{oa.oaNumber}</span>
                  <span className="text-muted-foreground text-[11px]">{oa.date}</span>
                  <span className="text-right text-foreground">{oa.qty}</span>
                  <span className="text-right text-emerald-600 dark:text-emerald-400 text-[11px] font-sans font-semibold">
                    ✓ {oa.status}
                  </span>
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
}
