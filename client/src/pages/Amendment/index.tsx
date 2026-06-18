import { useState, useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useAmendApprovedQuantity, useCancelLine } from '@/hooks/useAllocationApi'
import type { ItemLine } from '@/layout/AppLayout'
import { AmendmentTable } from './AmendmentTable'
import { AmendmentForm } from './AmendmentForm'
import { AmendmentGuide } from './AmendmentGuide'

interface DashboardContext {
  items: ItemLine[]
  setItems: Dispatch<SetStateAction<ItemLine[]>>
  reloadAllocations: () => Promise<void>
}

export function AmendmentScreen() {
  const { items, reloadAllocations } = useOutletContext<DashboardContext>()
  const { currentUser } = useAuth()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [amendQty, setAmendQty] = useState<number>(0)
  const [reason, setReason] = useState('')
  const [cancelReason, setCancelReason] = useState('')

  // API Hooks
  const { execute: runAmendApprovedQuantity, loading: loadingAmend } = useAmendApprovedQuantity()
  const { execute: runCancelLine, loading: loadingCancel } = useCancelLine()

  const targetItem = items.find(i => i.id === selectedId)

  const triggerSelect = useCallback((item: ItemLine) => {
    setSelectedId(item.id)
    setAmendQty(item.approvedQty || item.binQty)
    setReason('')
    setCancelReason('')
  }, [])

  const prepareCancel = useCallback((item: ItemLine) => {
    setSelectedId(item.id)
    setAmendQty(item.approvedQty || item.binQty)
    setReason('')
    setCancelReason('')
  }, [])

  const processAmendment = async () => {
    if (!selectedId || !reason) return
    try {
      await runAmendApprovedQuantity({
        lineId: Number(selectedId),
        amendedQuantity: amendQty,
        amendedBy: currentUser?.username ?? 'SYSTEM',
      })
      await reloadAllocations()
      alert('Amendment request queued and dispatched back to authorization matrix!')
      setSelectedId(null)
      setReason('')
      setCancelReason('')
    } catch (error) {
      console.error("Failed to submit amendment:", error)
    }
  }

  const processCancellation = async () => {
    if (!selectedId || !cancelReason) return
    if (!confirm('Are you absolutely sure you want to cancel this allocation entry?')) return

    try {
      const lineId = Number(selectedId)
      const item = items.find(i => i.id === selectedId)
      await runCancelLine({
        lineId,
        cancelledQty: item?.approvedQty ?? item?.binQty ?? 0,
        cancelReason,
        createdBy: currentUser?.username ?? 'SYSTEM',
      })
      await reloadAllocations()
      setSelectedId(null)
      setReason('')
      setCancelReason('')
    } catch (error) {
      console.error("Failed to cancel allocation line:", error)
    }
  }

  const allowedItems = items.filter(i => i.isApproved || i.status === 'Amend Pending')

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3 bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-md font-bold text-foreground">Amendment / Cancellation</h2>
          <p className="text-xs text-muted-foreground">Select approved items to amend qty or cancel — will re-enter approval flow</p>
        </div>

        <AmendmentTable
          items={allowedItems}
          selectedId={selectedId}
          triggerSelect={triggerSelect}
          prepareCancel={prepareCancel}
        />

        {targetItem && (
          <AmendmentForm
            targetItem={targetItem}
            amendQty={amendQty}
            setAmendQty={setAmendQty}
            reason={reason}
            setReason={setReason}
            cancelReason={cancelReason}
            setCancelReason={setCancelReason}
            processAmendment={processAmendment}
            processCancellation={processCancellation}
            setSelectedId={setSelectedId}
            loadingAmend={loadingAmend}
            loadingCancel={loadingCancel}
          />
        )}
      </div>

      <AmendmentGuide />
    </div>
  )
}
