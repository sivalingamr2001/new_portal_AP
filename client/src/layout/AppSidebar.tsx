import { LiveSystemClock } from '@/components/LiveSystemClock'
import { Layers, CheckCircle, Edit3, Truck } from 'lucide-react'

interface AppSidebarProps {
  currentScreen: 'allocation' | 'approval' | 'amendment' | 'fulfillment'
  setCurrentScreen: (screen: 'allocation' | 'approval' | 'amendment' | 'fulfillment') => void
  pendingCount: number
  amendCount: number
}

export function AppSidebar({ currentScreen, setCurrentScreen, pendingCount, amendCount }: AppSidebarProps) {
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
            <button
              onClick={() => setCurrentScreen('allocation')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                currentScreen === 'allocation' 
                  ? 'bg-primary text-primary-foreground shadow-sm font-semibold' 
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers size={16} />
                <span>BIN Allocation</span>
              </div>
            </button>

            <button
              onClick={() => setCurrentScreen('approval')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                currentScreen === 'approval' 
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
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                currentScreen === 'amendment' 
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

            <button
              onClick={() => setCurrentScreen('fulfillment')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                currentScreen === 'fulfillment' 
                  ? 'bg-primary text-primary-foreground shadow-sm font-semibold' 
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              }`}
            >
              <Truck size={16} />
              <span>Fulfillment</span>
            </button>
          </nav>
        </div>
      </div>

      {/* FOOTER: HIGH QUALITY SYSTEM DESKTOP PANEL */}
      <div className="p-4 border-t border-border bg-muted/20 space-y-3">
        {/* Isolated Widget Layer to give clock breathing room */}
        <div className="w-full bg-background border border-border/80 shadow-inner rounded-xl p-2.5 flex items-center justify-center">
          <LiveSystemClock />
        </div>
        
        {/* Metadata Release Version Tag */}
        <div className="flex items-center justify-between text-[10px] tracking-wider text-muted-foreground/50 font-mono px-0.5">
          <span>SYSTEM RUNNING</span>
          <span className="bg-muted px-1.5 py-0.5 rounded text-muted-foreground/70 font-semibold border border-border/40">v0.0.1</span>
        </div>
      </div>
    </aside>
  )
}
