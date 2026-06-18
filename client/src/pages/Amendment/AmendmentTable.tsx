import type { ItemLine } from '@/layout/AppLayout'

interface AmendmentTableProps {
  items: ItemLine[]
  selectedId: string | null
  triggerSelect: (item: ItemLine) => void
  prepareCancel: (item: ItemLine) => void
}

export function AmendmentTable({
  items,
  selectedId,
  triggerSelect,
  prepareCancel,
}: AmendmentTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-muted/20">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-muted/50 border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            <th className="p-3 pl-4">Item Code</th>
            <th className="p-3">Customer</th>
            <th className="p-3">Region</th>
            <th className="p-3 text-right">Appr. Qty</th>
            <th className="p-3 font-mono">Target Date</th>
            <th className="p-3 text-right pr-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60 text-xs">
          {items.map((item) => (
            <tr
              key={item.id}
              className={`hover:bg-muted/40 transition-colors ${
                selectedId === item.id ? 'bg-blue-500/10 border-l-2 border-l-primary' : ''
              }`}
            >
              <td className="p-3 font-bold text-primary font-mono pl-4">{item.itemCode}</td>
              <td className="p-3 text-foreground font-medium">{item.customer}</td>
              <td className="p-3 text-muted-foreground">{item.region}</td>
              <td className="p-3 text-right font-mono text-foreground">
                {item.approvedQty || item.binQty}
              </td>
              <td className="p-3 font-mono text-muted-foreground">{item.targetDate}</td>
              <td className="p-3 text-right pr-4 space-x-2">
                <button
                  onClick={() => triggerSelect(item)}
                  className="bg-secondary hover:bg-secondary/80 text-secondary-foreground text-[11px] font-medium px-2.5 py-1 rounded transition-colors cursor-pointer"
                >
                  Amend Qty
                </button>
                <button
                  onClick={() => prepareCancel(item)}
                  className="bg-destructive/10 hover:bg-destructive/20 text-destructive text-[11px] font-medium px-2.5 py-1 rounded border border-destructive/20 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
