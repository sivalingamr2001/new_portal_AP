import { useLocation } from "react-router-dom"
import { Bell, LogOut } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { sidebarItems } from "@/lib/config/sidebar-config"
import { Button } from "@/components/ui/button"

export const AppHeader = () => {
  const { pathname } = useLocation()
  const { logout } = useAuth()

  const currentItem = sidebarItems
    .flatMap((group) => group.items)
    .find((item) => item.to === pathname)

  return (
    <div className="flex h-12 items-center justify-between border-b px-4 bg-background">
      <div className="flex flex-col">
        {currentItem ? (
          <>
            <h1 className="text-sm font-semibold tracking-tight text-foreground">
              {currentItem.label}
            </h1>
            {currentItem.desc && (
              <p className="text-xs text-muted-foreground">
                {currentItem.desc}
              </p>
            )}
          </>
        ) : (
          <h1 className="text-sm font-semibold tracking-tight text-foreground">
            Janatics Portal
          </h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Bell className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
