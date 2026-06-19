import type { Dispatch, SetStateAction } from "react"
import { useOutletContext } from "react-router-dom"
import { AllocationScreen } from "@/pages/Allocation"
import { ApprovalScreen } from "@/pages/Approval"
import { AmendmentScreen } from "@/pages/Amendment"
import { FulfillmentScreen } from "@/pages/Fulfillment"
import type { ItemLine } from "@/layout/AppLayout"

interface DashboardContext {
  currentScreen: "allocation" | "approval" | "amendment" | "fulfillment"
  items: ItemLine[]
  setItems: Dispatch<SetStateAction<ItemLine[]>>
  reloadAllocations: () => Promise<void>
}

export default function Dashboard() {
  const { currentScreen } = useOutletContext<DashboardContext>()

  return (
    <div className="h-full w-full animate-in duration-200 zoom-in-95 fade-in">
      {currentScreen === "allocation" && <AllocationScreen />}
      {currentScreen === "approval" && <ApprovalScreen />}
      {currentScreen === "amendment" && <AmendmentScreen />}
      {currentScreen === "fulfillment" && <FulfillmentScreen />}
    </div>
  )
}
