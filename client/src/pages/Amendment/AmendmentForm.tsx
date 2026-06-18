import { Loader2 } from 'lucide-react'
import type { ItemLine } from '@/layout/AppLayout'

interface AmendmentFormProps {
  targetItem: ItemLine
  amendQty: number
  setAmendQty: (qty: number) => void
  reason: string
  setReason: (reason: string) => void
  cancelReason: string
  setCancelReason: (reason: string) => void
  processAmendment: () => Promise<void>
  processCancellation: () => Promise<void>
  setSelectedId: (id: string | null) => void
  loadingAmend: boolean
  loadingCancel: boolean
}

export function AmendmentForm({
  targetItem,
  amendQty,
  setAmendQty,
  reason,
  setReason,
  cancelReason,
  setCancelReason,
  processAmendment,
  processCancellation,
  setSelectedId,
  loadingAmend,
  loadingCancel,
}: AmendmentFormProps) {
  return (
    <div className="mt-6 bg-muted/40 border border-border p-4 rounded-xl space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
        Configure Amendment / Cancellation: {targetItem.itemCode}
      </h3>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* AMENDMENT SECTION */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <p className="text-xs font-semibold text-foreground">Amend Quantity</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Current Approved Qty</label>
              <div className="bg-background border border-border rounded px-3 py-2 text-xs font-mono text-foreground">
                {targetItem.approvedQty || targetItem.binQty}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">New Quantity</label>
              <input
                type="number"
                value={amendQty}
                min={0}
                onChange={(e) => setAmendQty(Number(e.target.value))}
                className="w-full bg-background border border-border rounded px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Reason *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-background border border-border rounded px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
            >
              <option value="">Select reason...</option>
              <option value="Production schedule change">Production schedule change</option>
              <option value="Client order revision">Client order revision</option>
              <option value="Logistics/Supply delay">Logistics/Supply delay</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={processAmendment}
              disabled={loadingAmend || !reason || amendQty <= 0}
              className="flex-1 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground text-white text-xs font-semibold px-4 py-1.5 rounded transition-all h-9 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loadingAmend && <Loader2 size={12} className="animate-spin" />}
              Submit Amend
            </button>
            <button
              onClick={() => setSelectedId(null)}
              className="bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs px-3 py-1.5 rounded cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        {/* CANCELLATION SECTION */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <p className="text-xs font-semibold text-foreground">Cancel Allocation</p>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Reason *</label>
            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full bg-background border border-border rounded px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
            >
              <option value="">Select cancellation reason...</option>
              <option value="Customer changed delivery schedule">Customer changed delivery schedule</option>
              <option value="Production plan revised">Production plan revised</option>
              <option value="Raw material delay">Raw material delay</option>
              <option value="Quality hold">Quality hold</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={processCancellation}
              disabled={loadingCancel || !cancelReason}
              className="flex-1 bg-destructive/90 hover:bg-destructive text-white text-xs font-semibold px-4 py-1.5 rounded transition-all h-9 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground"
            >
              {loadingCancel && <Loader2 size={12} className="animate-spin" />}
              Confirm Cancellation
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
