import { Outlet } from "react-router-dom"
import AppSidebar from "./AppSidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppHeader } from "./AppHeader"

export default function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <AppSidebar />

        <SidebarInset className="flex flex-col overflow-hidden">
          <AppHeader />

          <main className="flex-1 overflow-y-auto">
            <div className="p-2">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
