import { useState, useEffect, useCallback } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { AppSidebar } from "./AppSidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppHeader } from "./AppHeader"
import { useAllAllocations } from "@/hooks/useAllocationApi"
import { mapAllocationRowsToItemLines } from "@/lib/allocationMappers"

export interface ItemLine {
  id: string
  itemCode: string
  itemName: string
  customer: string
  region: string
  binQty: number
  requestedQty: number
  approvedQty?: number
  amendedQty?: number
  isApproved?: boolean
  targetDate: string
  status: 'Pending' | 'Approved' | 'Amend Pending' | 'Partial' | 'Fulfilled'
  oaDetails?: Array<{ oaNumber: string; date: string; qty: number; allocated: number; status: string }>
}

type Screen = "allocation" | "approval" | "amendment" | "fulfillment"

const SCREEN_PATHS: Record<Screen, string> = {
  allocation: "/allocation",
  approval: "/approval",
  amendment: "/amendment",
  fulfillment: "/fulfillment",
}

function screenFromPath(pathname: string): Screen {
  if (pathname.includes("/approval")) return "approval"
  if (pathname.includes("/amendment")) return "amendment"
  if (pathname.includes("/fulfillment")) return "fulfillment"
  return "allocation"
}

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const currentScreen = screenFromPath(location.pathname)
  const setCurrentScreen = (screen: Screen) => navigate(SCREEN_PATHS[screen])
  
  const { data: rawAllocations, execute: fetchAllocations } = useAllAllocations()
  const [items, setItems] = useState<ItemLine[]>([])

  const reloadAllocations = useCallback(async () => {
    try {
      const data = await fetchAllocations()
      setItems(mapAllocationRowsToItemLines(data))
    } catch (error) {
      console.error("Failed to load allocations:", error)
    }
  }, [fetchAllocations])

  useEffect(() => {
    if (rawAllocations) {
      setItems(mapAllocationRowsToItemLines(rawAllocations))
    }
  }, [rawAllocations])

  const pendingCount = items.filter(i => i.status === 'Pending').length
  const amendCount = items.filter(i => i.status === 'Amend Pending').length
  const approvedCount = items.filter(i => i.status === 'Approved').length

  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <AppSidebar
          currentScreen={currentScreen}
          setCurrentScreen={setCurrentScreen}
          pendingCount={pendingCount}
          amendCount={amendCount}
        />

        <SidebarInset className="flex flex-col overflow-hidden">
          <AppHeader
            currentScreen={currentScreen}
            totalItemsCount={items.length}
            pendingCount={pendingCount}
            amendCount={amendCount}
            approvedCount={approvedCount}
          />

          <main className="flex-1 overflow-y-auto">
            <div className="p-4 h-full">
              <Outlet context={{ currentScreen, items, setItems, reloadAllocations }} />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
