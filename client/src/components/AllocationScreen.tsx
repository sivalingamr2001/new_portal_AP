/**
 * AllocationScreen
 *
 * Drop-in replacement for the original AllocationScreen component.
 * Uses real API data via useAllocationForm hook.
 *
 * Usage (in the portal root — same as before, no props needed):
 *   {currentScreen === 'allocation' && <AllocationScreen />}
 */

import React from "react"
import { AllocationForm } from "./components/AllocationForm"
import { AllocationSidebar } from "./components/AllocationSidebar"
import { useAllocationForm } from "./hooks/useAllocationForm"

export function AllocationScreen() {
  const hook = useAllocationForm()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main form — takes 3 of 4 columns */}
      <div className="lg:col-span-3">
        <AllocationForm hook={hook} />
      </div>

      {/* Sidebar — summary + recents */}
      <div className="lg:col-span-1">
        <AllocationSidebar
          summary={hook.summary}
          loading={hook.loading.summary}
        />
      </div>
    </div>
  )
}
