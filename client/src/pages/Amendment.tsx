import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAmendApprovedQuantity, useCancelLine } from '@/hooks/useAllocationApi'
import { AmendmentModel } from '@/components/amendment/AmendmentModel'
import { AmendmentSidebar } from '@/components/amendment/AmendmentSidebar'

export interface ItemLine {
  lineId: number
  organizationId: number
  inventoryItemId: number
  b3Quantity: number // <-- REQUESTED QUANTITY
  targetDate: string
  b3ApprovedQuantity: number | null // <-- APPROVED QUANTITY
  approvalFlag: 'Y' | 'N'
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
}

interface DashboardContext {
  items: ItemLine[]
  setItems: Dispatch<SetStateAction<ItemLine[]>>
  reloadAllocations: () => Promise<void>
}

export function AmendmentScreen() {
  const { items, reloadAllocations } = useOutletContext<DashboardContext>()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [modalViewMode, setModalViewMode] = useState<'amend' | 'cancel'>('amend')
  const [amendQty, setAmendQty] = useState<number>(0)
  const [reason, setReason] = useState('')
  const [cancelReason, setCancelReason] = useState('')

  const targetItem = items.find((i) => i.lineId === selectedId)

  const triggerSelect = (item: ItemLine) => {
    setModalViewMode('amend')
    setSelectedId(item.lineId)
    setAmendQty(item.b3ApprovedQuantity !== null ? item.b3ApprovedQuantity : item.b3Quantity)
    setReason('')
    setCancelReason('')
  }

  const prepareCancel = (item: ItemLine) => {
    setModalViewMode('cancel')
    setSelectedId(item.lineId)
    setAmendQty(item.b3ApprovedQuantity !== null ? item.b3ApprovedQuantity : item.b3Quantity)
    setReason('')
    setCancelReason('')
  }

  const amendApprovedQuantityHook = useAmendApprovedQuantity()
  const cancelLineHook = useCancelLine()

  const processAmendment = async () => {
    if (!selectedId || !reason) return
    try {
      await amendApprovedQuantityHook.execute({
        lineId: selectedId,
        amendedQuantity: amendQty,
        amendedBy: 'system',
      })
      await reloadAllocations()
      alert('Amendment request queued and dispatched back to authorization matrix!')
      setSelectedId(null)
      setReason('')
      setCancelReason('')
    } catch (error) {
      console.error('Failed to submit amendment:', error)
    }
  }

  const processCancellation = async () => {
    if (!selectedId || !cancelReason) return
    if (!confirm('Are you absolutely sure you want to cancel this allocation entry?')) return

    try {
      const item = items.find((i) => i.lineId === selectedId)
      await cancelLineHook.execute({
        lineId: selectedId,
        cancelledQty: item?.b3Quantity || 0,
        cancelReason,
        createdBy: 'system',
      })
      await reloadAllocations()
      setSelectedId(null)
      setReason('')
      setCancelReason('')
    } catch (error) {
      console.error('Failed to cancel allocation line:', error)
    }
  }

  const allowedItems = items.filter((i) => i.approvalFlag === 'Y')

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-foreground bg-background">
      <div className="lg:col-span-3 bg-card border border-border rounded-xl p-6 shadow-xs transition-colors">
        <div className="mb-4">
          <h2 className="text-md font-bold">Amendment / Cancellation</h2>
          <p className="text-xs text-muted-foreground">Select approved items to amend qty or cancel — will re-enter approval flow</p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border bg-muted/20 dark:bg-muted/5">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 dark:bg-muted/20 border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                <th className="p-3 pl-4">Item Code</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Region</th>
                <th className="p-3 text-right">Appr. Qty</th>
                <th className="p-3 font-mono">Target Date</th>
                <th className="p-3 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs">
              {allowedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground font-medium">
                    No approved allocations available for amendment.
                  </td>
                </tr>
              ) : (
                allowedItems.map((item) => {
                  const hasVariance = item.b3ApprovedQuantity !== null && item.b3ApprovedQuantity !== item.b3Quantity

                  return (
                    <tr
                      key={item.lineId}
                      className={`hover:bg-muted/40 dark:hover:bg-muted/10 transition-colors ${
                        selectedId === item.lineId ? 'bg-blue-500/10 border-l-2 border-l-primary' : ''
                      }`}
                    >
                      <td className="p-3 font-bold text-primary font-mono pl-4">{item.itemCode || `ITEM-${item.inventoryItemId}`}</td>
                      <td className="p-3 font-medium">{item.customer || `CUST-${item.customerId}`}</td>
                      <td className="p-3 text-muted-foreground">{item.region || `ORG-${item.organizationId}`}</td>
                      
                      {/* DYNAMIC VISUAL QUANTITY VARIANCE ENGINE */}
                      <td className="p-3 text-right font-mono font-bold whitespace-nowrap">
                        {hasVariance ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="line-through text-red-500 text-[11px] font-medium">{item.b3Quantity}</span>
                            <span className="text-green-600 dark:text-green-400">{item.b3ApprovedQuantity}</span>
                          </div>
                        ) : (
                          <span>{item.b3ApprovedQuantity !== null ? item.b3ApprovedQuantity : item.b3Quantity}</span>
                        )}
                      </td>

                      <td className="p-3 font-mono text-muted-foreground">
                        {item.targetDate ? item.targetDate.split('T')[0] : 'N/A'}
                      </td>
                      <td className="p-3 text-right pr-4 space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => triggerSelect(item)}
                          className="bg-secondary hover:bg-secondary/80 text-secondary-foreground text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                        >
                          Amend Qty
                        </button>
                        <button
                          onClick={() => prepareCancel(item)}
                          className="bg-destructive/10 hover:bg-destructive/20 text-destructive text-[11px] font-medium px-2.5 py-1 rounded-md border border-destructive/20 transition-colors cursor-pointer"
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

      <AmendmentSidebar />

      {targetItem && (
        <AmendmentModel
          targetItem={targetItem}
          amendQty={amendQty}
          setAmendQty={setAmendQty}
          reason={reason}
          setReason={setReason}
          cancelReason={cancelReason}
          setCancelReason={setCancelReason}
          processAmendment={processAmendment}
          processCancellation={processCancellation}
          setSelectedId={(id) => setSelectedId(id)}
          initialView={modalViewMode}
        />
      )}
    </div>
  )
}
