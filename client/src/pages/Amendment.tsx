import type { AmendQuantityRequest } from "@/api/allocationApi"
import { AmendmentModel } from "@/components/amendment/AmendmentModel"
import { AmendmentSidebar } from "@/components/amendment/AmendmentSidebar"
import { useAuth } from "@/context/AuthContext"
import {
  useAmendApprovedQuantity,
  useCancelLine,
} from "@/hooks/useAllocationApi"
import type { Dispatch, SetStateAction } from "react"
import { useState } from "react"
import { useOutletContext } from "react-router-dom"

export interface ItemLine {
  lineId: number
  organizationId: number
  inventoryItemId: number
  b3Quantity: number
  targetDate: string
  b3ApprovedQuantity: number | null
  approvalFlag: "Y" | "N"
  approvedDate: string | null
  approvedBy: string | null
  closureFlag: string
  revision: number
  headerId: number
  transactionDate: string
  customerOrItemSpecific: number
  customerId: number
  territoryId: number | null
  billToCustomer: number
  shipToCustomer: number
  createdBy: string
  createdDate: string
  updatedBy: string
  updatedDate: string
  remarks: string
  itemCode?: string
  customer?: string
  region?: string
  parentLineId?: number | null
}

interface DashboardContext {
  items: ItemLine[]
  setItems: Dispatch<SetStateAction<ItemLine[]>>
  reloadAllocations: () => Promise<void>
}

export function AmendmentScreen() {
  const { currentUser } = useAuth()
  const { items, reloadAllocations } = useOutletContext<DashboardContext>()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [modalViewMode, setModalViewMode] = useState<"amend" | "cancel">("amend")
  const [amendQty, setAmendQty] = useState<number>(0)
  const [reason, setReason] = useState("")
  const [cancelReason, setCancelReason] = useState("")

  // 💡 1. Instantiated hooks correctly at the top level
  const amendHook = useAmendApprovedQuantity()
  const cancelLineHook = useCancelLine()

  const targetItem = items.find((i) => i.lineId === selectedId)

  const triggerSelect = (item: ItemLine) => {
    setModalViewMode("amend")
    setSelectedId(item.lineId)
    setAmendQty(
      item.b3ApprovedQuantity !== null
        ? item.b3ApprovedQuantity
        : item.b3Quantity
    )
    setReason("")
    setCancelReason("")
  }

  const prepareCancel = (item: ItemLine) => {
    setModalViewMode("cancel")
    setSelectedId(item.lineId)
    setAmendQty(
      item.b3ApprovedQuantity !== null
        ? item.b3ApprovedQuantity
        : item.b3Quantity
    )
    setReason("")
    setCancelReason("")
  }

  // 💡 2. Updated to execute the API request using the top-level hook instance
  const handleProcessAmendment = async () => {
    if (!targetItem) return

    const payload: AmendQuantityRequest = {
      lineId: targetItem.lineId,
      amendedQuantity: amendQty,
      amendedBy: currentUser?.username || "System",
      revision: targetItem.revision,
      reason: reason.trim()
    }

    try {
      const response = await amendHook.execute(payload)
      if (response) {
        await reloadAllocations() // Refresh global context array values
        setSelectedId(null)       // Close active dialog view modal
        setReason("")             // Reset feedback states
      }
    } catch (error) {
      console.error("Amendment failed:", error)
    }
  }

  const processCancellation = async () => {
    if (!selectedId || !cancelReason) return

    try {
      const item = items.find((i) => i.lineId === selectedId)
      await cancelLineHook.execute({
        lineId: selectedId,
        cancelledQty: item?.b3ApprovedQuantity ?? item?.b3Quantity ?? 0,
        cancelReason,
        createdBy: currentUser?.username || "System",
      })
      await reloadAllocations()
      setSelectedId(null)
      setReason("")
      setCancelReason("")
    } catch (error) {
      console.error("Failed to cancel allocation line:", error)
    }
  }

  const allowedItems = items.filter((i) => i.closureFlag === "N")

  return (
    <div className="grid grid-cols-1 gap-6 bg-background text-foreground lg:grid-cols-4">
      <div className="rounded-xl border border-border bg-card p-6 shadow-xs transition-colors lg:col-span-3">
        <div className="mb-4">
          <h2 className="text-md font-bold">Amendment / Cancellation</h2>
          <p className="text-xs text-muted-foreground">
            Select approved items to amend qty or cancel — will re-enter approval flow
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border bg-muted/20 dark:bg-muted/5">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-[11px] font-bold tracking-wider text-muted-foreground uppercase dark:bg-muted/20">
                <th className="p-3">ORG</th>
                <th className="p-3 pl-4">Item Code</th>
                <th className="p-3">Customer</th>
                <th className="p-3 text-right">Appr. Qty</th>
                <th className="p-3 font-mono">Target Date</th>
                <th className="p-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs">
              {allowedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center font-medium text-muted-foreground">
                    No approved allocations available for amendment.
                  </td>
                </tr>
              ) : (
                allowedItems.map((item) => {
                  const hasVariance =
                    item.b3ApprovedQuantity !== null &&
                    item.b3ApprovedQuantity !== item.b3Quantity

                  return (
                    <tr
                      key={item.lineId}
                      className={`transition-colors hover:bg-muted/40 dark:hover:bg-muted/10 ${selectedId === item.lineId ? "border-l-2 border-l-primary bg-blue-500/10" : ""
                        }`}
                    >
                      {/* Region/Organization Column: Displays organizationCode or customerRegion */}
                      <td className="p-3 text-muted-foreground">
                        {item.organizationCode || item.customerRegion || "N/A"}
                      </td>

                      {/* Item Column: Prioritizes itemCode, falls back to itemDescription */}
                      <td className="p-3 pl-4 text-left">
                        {/* Item Code Line */}
                        <div className="font-mono font-bold text-primary text-sm">
                          {item.itemCode || "N/A"}
                        </div>
                        {/* Item Description Line */}
                        {item.itemDescription && (
                          <div className="text-[11px] text-muted-foreground font-normal line-clamp-1 mt-0.5">
                            {item.itemDescription}
                          </div>
                        )}
                      </td>

                      {/* Customer Column: Displays descriptive customerName */}
                      <td className="p-3 font-medium">
                        {item.customerName || item.customer || "N/A"}
                      </td>


                      {/* Quantity Column */}
                      <td className="p-3 text-right font-mono font-bold whitespace-nowrap">
                        {hasVariance ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-[11px] font-medium text-red-500 line-through">
                              {item.b3Quantity}
                            </span>
                            <span className="text-green-600 dark:text-green-400">
                              {item.b3ApprovedQuantity}
                            </span>
                          </div>
                        ) : (
                          <span>
                            {item.b3ApprovedQuantity !== null
                              ? item.b3ApprovedQuantity
                              : item.b3Quantity}
                          </span>
                        )}
                      </td>

                      {/* Target Date Column */}
                      <td className="p-3 font-mono text-muted-foreground">
                        {item.targetDate ? item.targetDate.split("T")[0] : "N/A"}
                      </td>

                      {/* Actions Column */}
                      <td className="space-x-2 p-3 pr-4 text-right whitespace-nowrap">
                        {item.approvalFlag === "N" && (
                          <button
                            onClick={() => triggerSelect(item)}
                            className="cursor-pointer rounded-md bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
                          >
                            Amend Qty
                          </button>
                        )}
                        <button
                          onClick={() => prepareCancel(item)}
                          className="cursor-pointer rounded-md bg-red-600/10 px-2.5 py-1 text-[11px] font-medium text-red-600 transition-colors hover:bg-red-600 hover:text-white"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT SIDEBAR COMPONENT PANEL */}
      <div className="lg:col-span-1">
        <AmendmentSidebar />
      </div>

      {/* 💡 3. Added the modal renderer block targeting current selection flags dynamically */}
      {selectedId && targetItem && (
        <AmendmentModel
          targetItem={targetItem}
          amendQty={amendQty}
          setAmendQty={setAmendQty}
          reason={reason}
          setReason={setReason}
          cancelReason={cancelReason}
          setCancelReason={setCancelReason}
          processAmendment={handleProcessAmendment}
          processCancellation={processCancellation}
          setSelectedId={setSelectedId}
          initialView={modalViewMode}
        />
      )}
    </div>
  )
}
