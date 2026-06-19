import { useAuth } from "@/context/AuthContext"
import { Layers, CheckCircle, Edit3, Truck } from "lucide-react"

// 1. Define strict types for the roles
type UserRole = "user" | "hod"
type ScreenType = "allocation" | "approval" | "amendment" | "fulfillment"

interface AppSidebarProps {
  currentScreen: ScreenType
  setCurrentScreen: (screen: ScreenType) => void
  pendingCount: number
  amendCount: number
  role: UserRole // 2. Added role prop
}

export function AppSidebar({
  currentScreen,
  setCurrentScreen,
  pendingCount,
  amendCount,
  role,
}: AppSidebarProps) {
  const { currentUser } = useAuth()
  return (
    <aside className="flex h-screen w-64 flex-col justify-between border-r border-border bg-card">
      <div>
        {/* LOGO HEADER */}
        <div className="border-b border-border p-1.5">
          <h1 className="text-lg font-black tracking-wider text-primary">
            JANATICS
          </h1>
          <p className="text-[11px] font-medium text-muted-foreground">
            BIN Portal · Allocation System
          </p>
        </div>

        {/* NAVIGATION MENUS */}
        <div className="p-3">
          <p className="mb-2 px-3 text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">
            Screens
          </p>
          <nav className="space-y-1">
            {/* VISIBLE TO USER ONLY */}
            {role === "user" && (
              <button
                onClick={() => setCurrentScreen("fulfillment")}
                className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  currentScreen === "fulfillment"
                    ? "bg-primary font-semibold text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                <Truck size={16} />
                <span>Fulfillment</span>
              </button>
            )}

            {/* VISIBLE TO USER ONLY */}
            {role === "user" && (
              <>
                <button
                  onClick={() => setCurrentScreen("allocation")}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    currentScreen === "allocation"
                      ? "bg-primary font-semibold text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Layers size={16} />
                    <span>BIN Allocation</span>
                  </div>
                </button>
              </>
            )}

            {/* VISIBLE TO HOD ONLY */}
            {role === "hod" && (
              <>
                <button
                  onClick={() => setCurrentScreen("approval")}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    currentScreen === "approval"
                      ? "bg-primary font-semibold text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle size={16} />
                    <span>Approval</span>
                  </div>
                  {pendingCount > 0 && (
                    <span className="text-destructive-foreground min-w-[20px] animate-pulse rounded-md bg-destructive px-2 py-0.5 text-center text-[10px] font-bold shadow-sm">
                      {pendingCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setCurrentScreen("amendment")}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    currentScreen === "amendment"
                      ? "bg-primary font-semibold text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Edit3 size={16} />
                    <span>Amendment</span>
                  </div>
                  {amendCount > 0 && (
                    <span className="min-w-[20px] rounded-md bg-amber-500 px-2 py-0.5 text-center text-[10px] font-bold text-white shadow-sm">
                      {amendCount}
                    </span>
                  )}
                </button>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* FOOTER: HIGH QUALITY SYSTEM DESKTOP PANEL */}
      <div className="space-y-4 border-t border-border bg-gradient-to-b from-transparent to-muted/30 p-4">
        {/* USER PROFILE SECTION */}
        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/50 p-2 shadow-sm backdrop-blur-sm">
          {/* Avatar Circle with Initials */}
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-xs font-bold text-primary shadow-inner">
            {currentUser?.username?.slice(0, 2).toUpperCase() || "US"}
          </div>

          {/* Identity Meta */}
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-xs font-semibold text-foreground">
              {currentUser?.username || "Guest User"}
            </span>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-[10px] font-medium tracking-wide text-muted-foreground/80 uppercase">
                {role}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
