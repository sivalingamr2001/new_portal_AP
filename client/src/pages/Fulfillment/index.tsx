import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import type { ItemLine } from '@/layout/AppLayout'
import { FulfillmentMetrics } from './FulfillmentMetrics'
import { FulfillmentItemRow } from './FulfillmentItemRow'

interface DashboardContext {
  items: ItemLine[]
}

export function FulfillmentScreen() {
  const { items } = useOutletContext<DashboardContext>()
  const [expandedId, setExpandedId] = useState<string | null>('2')

  const activeFulfillmentItems = items.filter(i => i.isApproved || ['Fulfilled', 'Partial'].includes(i.status))

  const totalApprovedUnits = activeFulfillmentItems.reduce((acc, curr) => acc + (curr.approvedQty || curr.binQty), 0)
  const totalAllocatedOAUnits = activeFulfillmentItems.reduce((acc, curr) => {
    if (curr.oaDetails) return acc + curr.oaDetails.reduce((sum, oa) => sum + oa.allocated, 0)
    return acc + (curr.status === 'Fulfilled' ? (curr.approvedQty || curr.binQty) : 0)
  }, 0)

  const fillRate = totalApprovedUnits > 0 ? Math.round((totalAllocatedOAUnits / totalApprovedUnits) * 100) : 0

  return (
    <div className="space-y-6">
      
      {/* METRICS DASHBOARD TILES */}
      <FulfillmentMetrics
        activeItemsCount={activeFulfillmentItems.length}
        totalApprovedUnits={totalApprovedUnits}
        totalAllocatedOAUnits={totalAllocatedOAUnits}
        fillRate={fillRate}
      />

      {/* TRACKER CORE LIST */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-md font-bold text-foreground">Fulfillment Tracker</h2>
          <p className="text-xs text-muted-foreground">Review system order tracking logs matched with your approved operational components portfolio.</p>
        </div>

        <div className="space-y-2">
          {activeFulfillmentItems.map((item) => (
            <FulfillmentItemRow
              key={item.id}
              item={item}
              isExpanded={expandedId === item.id}
              setExpandedId={setExpandedId}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
