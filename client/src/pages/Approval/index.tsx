import { useEffect, useState, useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useApproveLine, useReviseQuantity, useBulkApproveLines } from '@/hooks/useAllocationApi'
import type { ItemLine } from '@/layout/AppLayout'
import { ApprovalHeader } from './ApprovalHeader'
import { ApprovalTable } from './ApprovalTable'

interface DashboardContext {
  items: ItemLine[]
  setItems: Dispatch<SetStateAction<ItemLine[]>>
  reloadAllocations: () => Promise<void>
}

export function ApprovalScreen() {
  const { items, reloadAllocations } = useOutletContext<DashboardContext>()
  const { currentUserRole, currentUser } = useAuth()
  const isUserRole = currentUserRole === 'user'
  const isHodRole = currentUserRole === 'hod'

  const [filter, setFilter] = useState<'All' | 'Pending' | 'Amendment' | 'Approved'>('All')
  const [search, setSearch] = useState('')
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({})

  // API Hooks
  const { execute: runApproveLine } = useApproveLine()
  const { execute: runReviseQuantity } = useReviseQuantity()
  const { execute: runBulkApprove, loading: bulkLoading } = useBulkApproveLines()

  const isBusinessHour = () => {
    const now = new Date()
    const hour = now.getHours()
    const day = now.getDay()
    return day >= 1 && day <= 5 && hour >= 9 && hour < 18
  }

  useEffect(() => {
    setQuantities(
      items.reduce((acc, curr) => ({
        ...acc,
        [curr.id]: currentUserRole === 'hod' ? curr.approvedQty ?? curr.requestedQty : curr.requestedQty,
      }), {})
    )
  }, [items, currentUserRole])

  const handleQtyChange = useCallback((id: string, val: number) => {
    setQuantities(prev => ({ ...prev, [id]: val }))
  }, [])

  const approveItem = async (id: string) => {
    try {
      const lineId = Number(id)
      const approvedQty = quantities[id] !== undefined ? quantities[id] : items.find(i => i.id === id)?.requestedQty || 0

      if (currentUserRole === 'user') {
        await runReviseQuantity({
          originalLineId: lineId,
          newB3Quantity: approvedQty,
        })
        alert('Your quantity update request has been submitted for approval.')
      } else {
        await runApproveLine({
          lineId,
          approvedQuantity: approvedQty,
          approvedBy: currentUser?.username ?? 'SYSTEM',
        })
      }

      await reloadAllocations()
    } catch (error) {
      console.error("Failed to submit request:", error)
    }
  }

  const approveAll = async () => {
    const pendingItems = items.filter(item => item.status === 'Pending')
    if (pendingItems.length === 0) return

    if (currentUserRole === 'user') {
      alert('Batch approval is not available for user role. Submit individual quantity requests instead.')
      return
    }

    try {
      const payloads = pendingItems.map(item => {
        const approvedQty = quantities[item.id] !== undefined ? quantities[item.id] : item.requestedQty
        return {
          lineId: Number(item.id),
          approvedQuantity: approvedQty,
          approvedBy: currentUser?.username ?? 'SYSTEM',
        }
      })
      await runBulkApprove(payloads)

      await reloadAllocations()
      alert('All pending line-items successfully authorized inside production routing systems!')
    } catch (error) {
      console.error("Failed to approve all items:", error)
    }
  }

  const filteredItems = items.filter(item => {
    if (filter === 'Pending' && item.status !== 'Pending') return false
    if (filter === 'Amendment' && item.status !== 'Amend Pending') return false
    if (filter === 'Approved' && item.isApproved !== true) return false

    if (search) {
      const term = search.toLowerCase()
      return item.itemCode.toLowerCase().includes(term) || item.customer.toLowerCase().includes(term)
    }
    return true
  })

  const pendingCount = items.filter(i => i.status === 'Pending').length

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <ApprovalHeader
        filter={filter}
        setFilter={setFilter}
        search={search}
        setSearch={setSearch}
        approveAll={approveAll}
        isUserRole={isUserRole}
        pendingCount={pendingCount}
        loading={bulkLoading}
      />

      <ApprovalTable
        items={filteredItems}
        quantities={quantities}
        handleQtyChange={handleQtyChange}
        approveItem={approveItem}
        isUserRole={isUserRole}
        isHodRole={isHodRole}
        isBusinessHour={isBusinessHour}
      />
    </div>
  )
}
