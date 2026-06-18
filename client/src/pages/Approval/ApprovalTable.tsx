import type { ItemLine } from '@/layout/AppLayout'

interface ApprovalTableProps {
  items: ItemLine[]
  quantities: { [key: string]: number }
  handleQtyChange: (id: string, val: number) => void
  approveItem: (id: string) => Promise<void>
  isUserRole: boolean
  isHodRole: boolean
  isBusinessHour: () => boolean
}

export function ApprovalTable({
  items,
  quantities,
  handleQtyChange,
  approveItem,
  isUserRole,
  isHodRole,
  isBusinessHour,
}: ApprovalTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-muted/20">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-muted/50 border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            <th className="p-3 pl-4 font-mono">#</th>
            <th className="p-3">Item Code</th>
            <th className="p-3">Customer</th>
            <th className="p-3">Region</th>
            <th className="p-3 text-right">Requested Qty</th>
            <th className="p-3 text-right">Approved Qty</th>
            <th className="p-3 text-right">Amended Qty</th>
            <th className="p-3">Target Date</th>
            <th className="p-3 text-right pr-4">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60 text-xs">
          {items.map((item, index) => (
            <tr key={item.id} className="hover:bg-muted/40 transition-colors">
              <td className="p-3 pl-4 font-mono text-muted-foreground">{index + 1}</td>
              <td className="p-3 font-bold text-primary font-mono">{item.itemCode}</td>
              <td className="p-3 text-foreground font-medium">{item.customer}</td>
              <td className="p-3 text-muted-foreground">{item.region}</td>
              <td className="p-3 text-right">
                {isUserRole && !['Approved', 'Fulfilled', 'Partial'].includes(item.status) ? (
                  <input
                    type="number"
                    value={quantities[item.id] !== undefined ? quantities[item.id] : item.requestedQty}
                    onChange={(e) => handleQtyChange(item.id, Number(e.target.value))}
                    className="bg-background border border-border w-24 text-center font-mono py-1 rounded text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                ) : (
                  <span className="font-mono font-semibold text-foreground">{item.requestedQty.toLocaleString()}</span>
                )}
              </td>
              <td className="p-3 text-right">
                {isHodRole && isBusinessHour() && !['Approved', 'Fulfilled', 'Partial'].includes(item.status) ? (
                  <input
                    type="number"
                    value={quantities[item.id] !== undefined ? quantities[item.id] : item.approvedQty ?? item.requestedQty}
                    onChange={(e) => handleQtyChange(item.id, Number(e.target.value))}
                    className="bg-background border border-border w-24 text-center font-mono py-1 rounded text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                ) : ['Approved', 'Fulfilled', 'Partial'].includes(item.status) ? (
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {item.approvedQty?.toLocaleString() ?? '-'}
                  </span>
                ) : (
                  <span className="font-mono text-muted-foreground">
                    {item.approvedQty != null ? item.approvedQty.toLocaleString() : '-'}
                  </span>
                )}
              </td>
              <td className="p-3 text-right font-mono text-muted-foreground">
                {item.amendedQty != null
                  ? item.amendedQty.toLocaleString()
                  : item.status === 'Amend Pending'
                  ? item.requestedQty.toLocaleString()
                  : '-'}
              </td>
              <td className="p-3 font-mono text-muted-foreground">{item.targetDate}</td>
              <td className="p-3 text-right pr-4">
                {['Approved', 'Fulfilled', 'Partial'].includes(item.status) ? (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-semibold">
                    ✓ Approved
                  </span>
                ) : item.status === 'Amend Pending' ? (
                  <button
                    onClick={() => approveItem(item.id)}
                    className="bg-orange-600 hover:bg-orange-500 dark:bg-orange-600/90 dark:hover:bg-orange-600 text-white text-[11px] font-medium px-3 py-1 rounded transition-all cursor-pointer"
                  >
                    {isUserRole ? 'Request Qty Update' : 'Approve Amend'}
                  </button>
                ) : (
                  <button
                    onClick={() => approveItem(item.id)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-medium px-3 py-1 rounded transition-all shadow-sm cursor-pointer"
                  >
                    {isUserRole ? 'Request Qty Update' : 'Approve'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
