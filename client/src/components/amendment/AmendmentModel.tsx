import type { ItemLine } from "@/pages/Amendment"
import { useState, useEffect } from "react"

interface AmendmentModelProps {
  targetItem: ItemLine
  amendQty: number
  setAmendQty: (qty: number) => void
  reason: string
  setReason: (reason: string) => void
  cancelReason: string
  setCancelReason: (reason: string) => void
  processAmendment: () => Promise<void>
  processCancellation: () => Promise<void>
  setSelectedId: (id: number | null) => void
  initialView: "amend" | "cancel"
}

export function AmendmentModel({
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
  initialView,
}: AmendmentModelProps) {
  const [activeTab, setActiveTab] = useState<"amend" | "cancel">(initialView)

  // 💡 Local states to track if the dropdown itself is set to "Other"
  const [isAmendOther, setIsAmendOther] = useState(false)
  const [isCancelOther, setIsCancelOther] = useState(false)

  useEffect(() => {
    setActiveTab(initialView)
    const initialQty =
      targetItem.b3ApprovedQuantity !== null
        ? targetItem.b3ApprovedQuantity
        : targetItem.b3Quantity
    setAmendQty(initialQty)
  }, [
    initialView,
    targetItem.lineId,
    setAmendQty,
    targetItem.b3ApprovedQuantity,
    targetItem.b3Quantity,
  ])

  const modalHasVariance =
    targetItem.b3ApprovedQuantity !== null &&
    targetItem.b3ApprovedQuantity !== targetItem.b3Quantity

  return (
    <div className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-black/40 p-4 backdrop-blur-xs duration-100 fade-in">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-xl transition-all">
        {/* LIGHT/DARK COMPACT ADAPTIVE HEADER */}
        <div className="flex h-14 items-center justify-between gap-4 border-b border-border bg-muted/20 p-2.5 px-4 transition-colors dark:bg-muted/10">
          <div className="min-w-0 truncate">
            <h3 className="truncate text-xs font-bold">
              Amendment / Cancellation Matrix
            </h3>
            <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
              {targetItem.itemCode || `ITEM-${targetItem.inventoryItemId}`} —{" "}
              {targetItem.customer || `CUST-${targetItem.customerId}`}
            </p>
          </div>
        </div>

        {/* FORM CONFIGURATION VIEWS */}
        <div className="space-y-4 p-5">
          {activeTab === "amend" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Current Approved Qty
                  </label>
                  <div className="flex h-8.5 items-center rounded-lg border border-border bg-muted/40 px-3 py-2 font-mono text-xs">
                    {modalHasVariance ? (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-red-500 line-through">
                          {targetItem.b3Quantity}
                        </span>
                        <span className="font-bold text-green-600 dark:text-green-400">
                          {targetItem.b3ApprovedQuantity}
                        </span>
                      </div>
                    ) : (
                      <span>
                        {targetItem.b3ApprovedQuantity !== null
                          ? targetItem.b3ApprovedQuantity
                          : targetItem.b3Quantity}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    New Quantity
                  </label>
                  <input
                    type="number"
                    value={amendQty}
                    min={0}
                    onChange={(e) => setAmendQty(Number(e.target.value))}
                    className="h-8.5 w-full rounded-lg border border-border bg-background px-3 py-1.5 font-mono text-xs transition-colors focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Submitting will create a new revision row instead of updating the current line.
              </p>

              {/* 💡 AMEND REASON SECTION */}
              <div className="space-y-2">
                <label className="mb-1 block text-xs text-muted-foreground">
                  Reason *
                </label>
                <select
                  value={isAmendOther ? "Other" : reason}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === "Other") {
                      setIsAmendOther(true)
                      setReason("") // Reset parent reason to empty text so user must type something
                    } else {
                      setIsAmendOther(false)
                      setReason(val)
                    }
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-primary focus:outline-none"
                >
                  <option value="">Select reason...</option>
                  <option value="Production schedule revised">Production schedule revised</option>
                  <option value="Customer request reduction">Customer request reduction</option>
                  <option value="Forecast correction">Forecast correction</option>
                  <option value="Raw material constraint">Raw material constraint</option>
                  <option value="Order cancellation by customer">Order cancellation by customer</option>
                  <option value="Quality hold">Quality hold</option>
                  <option value="Other">Other</option>
                </select>

                {/* 💡 Conditional Input Box for Amend */}
                {isAmendOther && (
                  <input
                    type="text"
                    placeholder="Please specify your reason..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="h-8.5 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs transition-all focus:border-primary focus:outline-none animate-in fade-in slide-in-from-top-1 duration-150"
                  />
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={processAmendment}
                  disabled={!reason.trim() || amendQty <= 0}
                  className="h-9 flex-1 cursor-pointer rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-orange-500 disabled:bg-muted disabled:text-muted-foreground dark:disabled:bg-neutral-800"
                >
                  Submit Amend
                </button>
                <button
                  onClick={() => setSelectedId(null)}
                  className="h-9 cursor-pointer rounded-lg bg-secondary px-4 py-2 text-xs text-secondary-foreground hover:bg-secondary/80"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* 💡 CANCELLATION REASON SECTION */
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="mb-1 block text-xs text-muted-foreground">
                  Reason *
                </label>
                <select
                  value={isCancelOther ? "Other" : cancelReason}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === "Other") {
                      setIsCancelOther(true)
                      setCancelReason("")
                    } else {
                      setIsCancelOther(false)
                      setCancelReason(val)
                    }
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-primary focus:outline-none"
                >
                  <option value="">Select cancellation reason...</option>
                  <option value="Production schedule revised">Production schedule revised</option>
                  <option value="Customer request reduction">Customer request reduction</option>
                  <option value="Forecast correction">Forecast correction</option>
                  <option value="Raw material constraint">Raw material constraint</option>
                  <option value="Order cancellation by customer">Order cancellation by customer</option>
                  <option value="Quality hold">Quality hold</option>
                  <option value="Other">Other</option>
                </select>

                {/* 💡 Conditional Input Box for Cancellation */}
                {isCancelOther && (
                  <input
                    type="text"
                    placeholder="Please specify your cancellation reason..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="h-8.5 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs transition-all focus:border-primary focus:outline-none animate-in fade-in slide-in-from-top-1 duration-150"
                  />
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={processCancellation}
                  disabled={!cancelReason.trim()}
                  className="h-9 flex-1 cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-red-500 disabled:bg-muted disabled:text-muted-foreground dark:disabled:bg-neutral-800"
                >
                  Submit Cancellation
                </button>
                <button
                  onClick={() => setSelectedId(null)}
                  className="h-9 cursor-pointer rounded-lg bg-secondary px-4 py-2 text-xs text-secondary-foreground hover:bg-secondary/80"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
