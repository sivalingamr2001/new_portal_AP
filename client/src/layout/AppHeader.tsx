import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/theme-provider'

interface AppHeaderProps {
  currentScreen: 'allocation' | 'approval' | 'amendment' | 'fulfillment'
  totalItemsCount: number
  pendingCount: number
  amendCount: number
  approvedCount: number
}

export function AppHeader({ currentScreen, totalItemsCount, pendingCount, amendCount, approvedCount }: AppHeaderProps) {
  const { theme, setTheme } = useTheme()

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-6 z-10">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="capitalize font-semibold text-foreground">{currentScreen === 'allocation' ? 'BIN Allocation' : currentScreen}</span>
        <span>/</span>
        <span className="text-xs">
          {currentScreen === 'allocation' && 'Create forecast entries'}
          {currentScreen === 'approval' && 'Approve item quantities'}
          {currentScreen === 'amendment' && 'Amend or cancel items'}
          {currentScreen === 'fulfillment' && 'Track OA allocation'}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex bg-muted border border-border rounded-md p-1 gap-1 text-xs">
          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-semibold">{totalItemsCount} Items</span>
          <span className="px-2 py-0.5 text-amber-600 dark:text-amber-400 font-medium">{pendingCount} Pending</span>
          <span className="px-2 py-0.5 text-orange-600 dark:text-orange-400 font-medium">{amendCount} Amend</span>
          <span className="px-2 py-0.5 text-emerald-600 dark:text-emerald-400 font-medium">{approvedCount} Approved</span>
        </div>

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-1.5 rounded-md hover:bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Toggle Theme (Press 'd')"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  )
}

