import { Layers, CheckCircle, Edit3, Truck } from 'lucide-react'

interface AppSidebarProps {
  currentScreen: 'allocation' | 'approval' | 'amendment' | 'fulfillment'
  setCurrentScreen: (screen: 'allocation' | 'approval' | 'amendment' | 'fulfillment') => void
  pendingCount: number
  amendCount: number
}

export function AppSidebar({ currentScreen, setCurrentScreen, pendingCount, amendCount }: AppSidebarProps) {
  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col justify-between">
      <div>
        <div className="p-4 border-b border-border">
          <h1 className="text-lg font-bold tracking-wider text-primary">JANATICS</h1>
          <p className="text-xs text-muted-foreground">BIN Portal · Sales</p>
        </div>
        
        <div className="p-3">
          <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider px-3 mb-2">Screens</p>
          <nav className="space-y-1">
            <button 
              onClick={() => setCurrentScreen('allocation')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-all cursor-pointer ${currentScreen === 'allocation' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <div className="flex items-center gap-2.5">
                <Layers size={16} />
                <span>BIN Allocation</span>
              </div>
            </button>

            <button 
              onClick={() => setCurrentScreen('approval')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-all cursor-pointer ${currentScreen === 'approval' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle size={16} />
                <span>Approval</span>
              </div>
              {pendingCount > 0 && <span className="bg-destructive text-destructive-foreground text-[11px] font-bold px-2 py-0.5 rounded-full">{pendingCount}</span>}
            </button>

            <button 
              onClick={() => setCurrentScreen('amendment')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-all cursor-pointer ${currentScreen === 'amendment' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <div className="flex items-center gap-2.5">
                <Edit3 size={16} />
                <span>Amendment</span>
              </div>
              {amendCount > 0 && <span className="bg-destructive text-destructive-foreground text-[11px] font-bold px-2 py-0.5 rounded-full">{amendCount}</span>}
            </button>

            <button 
              onClick={() => setCurrentScreen('fulfillment')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium transition-all cursor-pointer ${currentScreen === 'fulfillment' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <Truck size={16} />
              <span>Fulfillment</span>
            </button>
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-border text-xs text-muted-foreground/60 flex justify-between items-center">
        <span>v2.4.1-Prod</span>
        <span>16 Jun 2026</span>
      </div>
    </aside>
  )
}

