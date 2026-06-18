import { Search, Check, Loader2 } from 'lucide-react'

interface ApprovalHeaderProps {
  filter: 'All' | 'Pending' | 'Amendment' | 'Approved'
  setFilter: (filter: 'All' | 'Pending' | 'Amendment' | 'Approved') => void
  search: string
  setSearch: (search: string) => void
  approveAll: () => Promise<void>
  isUserRole: boolean
  pendingCount: number
  loading: boolean
}

export function ApprovalHeader({
  filter,
  setFilter,
  search,
  setSearch,
  approveAll,
  isUserRole,
  pendingCount,
  loading,
}: ApprovalHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h2 className="text-md font-bold text-foreground">BIN Approval</h2>
        <p className="text-xs text-muted-foreground">Approve item quantities — locked once approved.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex bg-muted border border-border rounded-lg p-0.5 text-xs">
          {(['All', 'Pending', 'Amendment', 'Approved'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                filter === t
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 text-muted-foreground" size={14} />
          <input
            type="text"
            placeholder="Search data records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-background border border-border pl-8 pr-3 py-1.5 rounded-lg text-xs text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-primary w-48"
          />
        </div>

        <button
          onClick={approveAll}
          disabled={loading || (pendingCount === 0 && !isUserRole)}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 dark:bg-emerald-600/90 dark:hover:bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Check size={14} />
          )}
          {isUserRole ? 'Request Qty Update' : `Approve All (${pendingCount})`}
        </button>
      </div>
    </div>
  )
}
