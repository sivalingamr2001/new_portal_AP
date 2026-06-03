import accessRequestApi from "@/api/accessRequestApi"
import type { AccessNotificationDto } from "@/api/types"
import { NotificationSheet } from "@/components/NotificationSheet"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetTrigger } from "@/components/ui/sheet"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useAuth } from "@/context/AuthContext"
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr"
import { Bell, LogOut, User } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

export function AppHeader() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState<AccessNotificationDto[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isError, setIsError] = useState<boolean>(false)

  const userId = currentUser?.cmplUser?.userId || 0 

  // 2. Fetch notifications in the parent
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!userId) return
      try {
        setIsLoading(true)
        setIsError(false)
        const data = await accessRequestApi.getNotifications(userId)
        setNotifications(data || [])
      } catch (error) {
        console.error("Failed to fetch notifications:", error)
        setIsError(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()
  }, [userId])

  useEffect(() => {
    if (!userId) return

    const hubUrl = `${import.meta.env.VITE_SIGNALR_URL || "http://localhost:5067"}/hubs/notifications?userId=${userId}`
    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        withCredentials: true,
      })
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect()
      .build()

    connection.on("ReceiveNotification", (notification: AccessNotificationDto) => {
      setNotifications((prev) => [notification, ...prev])
      setIsError(false)
    })

    connection
      .start()
      .catch((error) => {
        console.error("Failed to connect to notifications hub:", error)
        setIsError(true)
      })

    return () => {
      connection.off("ReceiveNotification")
      connection.stop().catch((error) => {
        console.error("Failed to stop notifications hub:", error)
      })
    }
  }, [userId])

  const handleMarkAsRead = async (auditId: number) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.auditId === auditId ? { ...n, isRead: true } : n))
      )
      await accessRequestApi.markNotificationAsRead(auditId, userId)
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
      setNotifications((prev) =>
        prev.map((n) => (n.auditId === auditId ? { ...n, isRead: false } : n))
      )
    }
  }

  // 4. Calculate unread count to show/hide the red dot indicator
  const hasUnread = notifications.some((n) => !n.isRead)

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <header className="flex h-16 w-full shrink-0 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="h-9 w-9" />
        <div className="h-5 w-px bg-border" />
        <div className="flex items-center gap-3">
          <span className="hidden text-xs font-medium text-muted-foreground sm:inline-block">
            Access Portal
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
            >
              <Bell className="h-5 w-5" />
              {/* The red circle now conditionally updates based on live array data */}
              {hasUnread && (
                <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
              )}
            </Button>
          </SheetTrigger>
          
          {/* Pass data down to the child view layer */}
          <NotificationSheet 
            notifications={notifications}
            isLoading={isLoading}
            isError={isError}
            onMarkAsRead={handleMarkAsRead}
          />
        </Sheet>

        <div className="h-5 w-px bg-border" />

        {/* USER DROPDOWN MENU */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex h-auto items-center gap-3 rounded-lg p-1 transition-colors hover:bg-accent/50"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-accent text-accent-foreground">
                <User className="h-4 w-4" />
              </div>

              <div className="hidden flex-col text-left md:flex">
                <span className="text-sm leading-none font-semibold text-foreground">
                  {currentUser?.cmplUser?.cmplUserName || "User Name"}
                </span>
                <span className="mt-1 text-xs leading-none font-normal text-muted-foreground">
                  {currentUser?.cmplUser?.mailId || "N/A"}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="mt-1 w-56">
            <DropdownMenuLabel className="font-normal md:hidden">
              <div className="flex flex-col space-y-1">
                <p className="text-sm leading-none font-medium">{currentUser?.name || "User Name"}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {currentUser?.email || "user@example.com"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="md:hidden" />

            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="cursor-pointer gap-2"
              onClick={() => navigate("/profile")}
            >
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Profile</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export default AppHeader
