import type { Dispatch, SetStateAction } from 'react'
import { useOutletContext } from 'react-router-dom'
import { AllocationScreen } from '@/pages/Allocation'
import { ApprovalScreen } from '@/pages/Approval'
import { AmendmentScreen } from '@/pages/Amendment'
import { FulfillmentScreen } from '@/pages/Fulfillment'
import type { ItemLine } from '@/layout/AppLayout'

interface DashboardContext {
  currentScreen: 'allocation' | 'approval' | 'amendment' | 'fulfillment'
  items: ItemLine[]
  setItems: Dispatch<SetStateAction<ItemLine[]>>
  reloadAllocations: () => Promise<void>
}

export default function Dashboard() {
  const { currentScreen } = useOutletContext<DashboardContext>()

  return (
    <div className="h-full w-full animate-in fade-in zoom-in-95 duration-200">
      {currentScreen === 'allocation' && <AllocationScreen />}
      {currentScreen === 'approval' && <ApprovalScreen />}
      {currentScreen === 'amendment' && <AmendmentScreen />}
      {currentScreen === 'fulfillment' && <FulfillmentScreen />}
    </div>
  )
}
