import { useAuth } from '@/context/AuthContext'
import { Layers, CheckCircle, Edit3, Truck } from 'lucide-react'

// 1. Define strict types for the roles
type UserRole = 'user' | 'hod'
type ScreenType = 'allocation' | 'approval' | 'amendment' | 'fulfillment'

interface AppSidebarProps {
  currentScreen: ScreenType
  setCurrentScreen: (screen: ScreenType) => void
  pendingCount: number
  amendCount: number
  role: UserRole // 2. Added role prop
}

export function AppSidebar({ currentScreen, setCurrentScreen, pendingCount, amendCount, role }: AppSidebarProps) {
  const { currentUser } = useAuth()
  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col justify-between h-screen">
      <div>
        {/* LOGO HEADER */}
        <div className="p-4 border-b border-border">
          <h1 className="text-lg font-black tracking-wider text-primary">JANATICS</h1>
          <p className="text-[11px] text-muted-foreground font-medium">BIN Portal · Sales System</p>
        </div>

        {/* NAVIGATION MENUS */}
        <div className="p-3">
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider px-3 mb-2">Screens</p>
          <nav className="space-y-1">

            {/* VISIBLE TO USER ONLY */}
            {role === 'user' && (
              <button
                onClick={() => setCurrentScreen('fulfillment')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${currentScreen === 'fulfillment'
                  ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  }`}
              >
                <Truck size={16} />
                <span>Fulfillment</span>
              </button>
            )}

            {/* VISIBLE TO USER ONLY */}
            {role === 'user' && (
              <>
                <button
                  onClick={() => setCurrentScreen('allocation')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${currentScreen === 'allocation'
                    ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
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
            {role === 'hod' && (
              <>
                <button
                  onClick={() => setCurrentScreen('approval')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${currentScreen === 'approval'
                    ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle size={16} />
                    <span>Approval</span>
                  </div>
                  {pendingCount > 0 && (
                    <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-md min-w-[20px] text-center shadow-sm animate-pulse">
                      {pendingCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setCurrentScreen('amendment')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${currentScreen === 'amendment'
                    ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Edit3 size={16} />
                    <span>Amendment</span>
                  </div>
                  {amendCount > 0 && (
                    <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md min-w-[20px] text-center shadow-sm">
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
      <div className="p-4 border-t border-border bg-gradient-to-b from-transparent to-muted/30 space-y-4">
        {/* USER PROFILE SECTION */}
        <div className="flex items-center gap-3 p-2 rounded-xl bg-background/50 border border-border/60 shadow-sm backdrop-blur-sm">
          {/* Avatar Circle with Initials */}
          <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shadow-inner">
            {currentUser?.username?.slice(0, 2).toUpperCase() || "US"}
          </div>

          {/* Identity Meta */}
          <div className="flex-1 min-w-0 flex flex-col">
            <span className="text-xs font-semibold text-foreground truncate">
              {currentUser?.username || "Guest User"}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-medium tracking-wide uppercase text-muted-foreground/80">
                {role}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
