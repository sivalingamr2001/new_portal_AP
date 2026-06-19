import { LogOut } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

interface AppHeaderProps {
  currentScreen: "allocation" | "approval" | "amendment" | "fulfillment"
}

export function AppHeader({ currentScreen }: AppHeaderProps) {
  const { logout } = useAuth()

  const handleLogout = () => {
    try {
      logout()
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <header className="z-10 flex h-14 items-center justify-between border-b border-border bg-card/80 px-4 sm:px-6 backdrop-blur-sm">
      {/* Left side: Responsive Breadcrumbs */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground min-w-0 pr-4">
        <span className="font-semibold text-foreground capitalize truncate">
          {currentScreen === "allocation" ? "BIN Allocation" : currentScreen}
        </span>
        <span className="hidden sm:inline">/</span>
        <span className="text-xs truncate hidden sm:inline">
          {currentScreen === "allocation" && "Create forecast entries"}
          {currentScreen === "approval" && "Approve item quantities"}
          {currentScreen === "amendment" && "Amend or cancel items"}
          {currentScreen === "fulfillment" && "Track OA allocation"}
        </span>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center shrink-0">
        <button
          onClick={handleLogout}
          className="cursor-pointer rounded-md border border-destructive/20 p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          title="Logout"
        >
          <LogOut className="h-4 w-4 text-destructive" />
        </button>
      </div>
    </header>
  )
}
