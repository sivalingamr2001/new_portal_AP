import { notificationsApi, updateAxiosUserCache } from "@/api"
import type { NotificationDto } from "@/api/types"
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
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr"
import { Bell, LogOut, User } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

export function AppHeader() {
  const { currentUser, logout } = useAuth() // currentUser matches PortalUserDetails structure
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState<NotificationDto[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isError, setIsError] = useState<boolean>(false)

  const userId = currentUser?.user?.id || 0

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!userId) return
      try {
        setIsLoading(true)
        setIsError(false)
        const data = await notificationsApi.getNotifications()
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

    let isMounted = true
    let connection: HubConnection | null = null

    const initializeNotifications = async () => {
      // 1. Fetch initial historical notifications
      try {
        setIsLoading(true)
        setIsError(false)
        const data = await notificationsApi.getNotifications()
        if (isMounted) {
          setNotifications(data || [])
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error)
        if (isMounted) setIsError(true)
      } finally {
        if (isMounted) setIsLoading(false)
      }

      // Guard against immediate unmounts before starting negotiation
      if (!isMounted) return

      // 2. Resolve target Hub Base Endpoint URL safely
      const hubBaseUrl = (
        import.meta.env.VITE_SIGNALR_URL ||
        import.meta.env.VITE_BASE_API_URL ||
        "http://localhost:5067"
      )
        .replace(/\/api\/?$/, "")
        .replace(/\/hubs\/notifications\/?$/, "")

      const hubUrl = `${hubBaseUrl}/hubs/notifications?userId=${userId}`

      // 3. Construct Hub Connection with strict transport specifications
      connection = new HubConnectionBuilder()
        .withUrl(hubUrl, {
          withCredentials: true,
          // CRITICAL FIX: Explicitly skip negotiation if using pure WebSockets,
          // or let it negotiate without thread blocking collisions
          skipNegotiation: false,
        })
        .configureLogging(LogLevel.Warning) // Suppress noisy info logs during negotiation
        .withAutomaticReconnect()
        .build()

      connection.on("ReceiveNotification", (notification: NotificationDto) => {
        if (isMounted) {
          setNotifications((prev) => [notification, ...prev])
          setIsError(false)
        }
      })

      // 4. Start Live Stream Connection with explicit Abort Handling guards
      try {
        if (connection.state === HubConnectionState.Disconnected) {
          await connection.start()
        }
      } catch (error: unknown) {
        // Catch and completely ignore expected abort handshakes
        if (!isMounted) return

        const errMsg = String(error)
        if (
          errMsg.includes("stopped during negotiation") ||
          errMsg.includes("AbortError")
        ) {
          return
        }

        console.error("Failed to connect to notifications hub:", error)
        if (isMounted) setIsError(true)
      }
    }

    initializeNotifications()

    // Clean-up context wrapper routine
    return () => {
      isMounted = false
      if (connection) {
        connection.off("ReceiveNotification")
        // Only call stop if it's not already dead or disconnecting
        if (connection.state === HubConnectionState.Connected) {
          connection.stop().catch(() => {
            /* Silent discard */
          })
        }
      }
    }
  }, [userId]) // Depend STRICTLY on userId stability

  const handleMarkAsRead = async (auditId: number) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.auditId === auditId ? { ...n, isRead: true } : n))
      )
      await notificationsApi.markRead(auditId)
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
      setNotifications((prev) =>
        prev.map((n) => (n.auditId === auditId ? { ...n, isRead: false } : n))
      )
    }
  }

  const hasUnread = notifications.some((n) => !n.isRead)

  const handleLogout = () => {
    logout()
    updateAxiosUserCache()
    navigate("/login")
  }

  return (
    <header className="flex h-16 w-full shrink-0 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="h-9 w-9" />
        <div className="h-5 w-px bg-border" />
        <div className="flex items-center gap-3">
          <span className="hidden text-md font-medium text-muted-foreground sm:inline-block">
            {"Folder Access Portal"}
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
              {hasUnread && (
                <span className="absolute top-1 right-2 h-2 w-2 animate-pulse rounded-full bg-destructive" />
              )}
            </Button>
          </SheetTrigger>

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
                  {currentUser?.user?.name || "User Name"}
                </span>
                <span className="mt-1 text-xs leading-none font-normal text-muted-foreground">
                  {currentUser?.user?.email || "N/A"}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="mt-1 w-56">
            <DropdownMenuLabel className="font-normal md:hidden">
              <div className="flex flex-col space-y-1">
                <p className="text-sm leading-none font-medium">
                  {currentUser?.user?.name || "User Name"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {currentUser?.user?.email || "user@example.com"}
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
