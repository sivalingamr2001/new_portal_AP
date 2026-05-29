import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Bell, LogOut, User } from "lucide-react"
// 1. Import shadcn Sheet components for notifications
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
// 2. Import shadcn DropdownMenu components for the profile options
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/context/AuthContext"
import { useNavigate } from "react-router-dom"

const useUserSession = () => {
  return {
    name: "John Doe",
    email: "john.doe@janatics.com",
  }
}

export function AppHeader() {
  const {currentUser, logout} = useAuth()
  const navigate = useNavigate()

  // Handler logic placeholder for logouts
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
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-destructive" />
            </Button>
          </SheetTrigger>
          {/* side="right" ensures it slides in from the right edge */}
          <SheetContent side="right" className="w-100 sm:w-135">
            <SheetHeader>
              <SheetTitle>Notifications</SheetTitle>
              <SheetDescription>
                Stay updated with your enterprise automation logs.
              </SheetDescription>
            </SheetHeader>
            {/* Feed Box: Put your live notification elements here */}
            <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-sm text-muted-foreground">
              No new notifications at this time.
            </div>
          </SheetContent>
        </Sheet>

        <div className="h-5 w-px bg-border" />

        {/* USER DROPDOWN MENU */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {/* Button wrapper makes the entire layout block interactively hoverable and clickable */}
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

            <DropdownMenuItem className="cursor-pointer gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Profile Settings</span>
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
