import { Outlet } from "react-router-dom"
import AppSidebar from "./AppSidebar"
import AppHeader from "./AppHeader"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

export default function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <AppSidebar />

        <SidebarInset className="flex flex-col overflow-hidden">
          <AppHeader />

          <main className="flex-1 overflow-y-auto p-4">
            <div className="h-[89vh] rounded-4xl bg-sidebar shadow-lg p-6">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
