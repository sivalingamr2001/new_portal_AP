import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { Search, Check } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { approveAllocationLineApi } from '@/api/allocationApi'

interface ItemLine {
  id: string
  itemCode: string
  itemName: string
  customer: string
  region: string
  binQty: number
  approvedQty?: number
  targetDate: string
  status: 'Pending' | 'Approved' | 'Amend Pending' | 'Partial' | 'Fulfilled'
  oaDetails?: Array<{ oaNumber: string; date: string; qty: number; allocated: number; status: string }>
}

interface DashboardContext {
  items: ItemLine[]
  setItems: Dispatch<SetStateAction<ItemLine[]>>
  reloadAllocations: () => Promise<void>
}

export function ApprovalScreen() {
  const { items, reloadAllocations } = useOutletContext<DashboardContext>()
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Amendment' | 'Approved'>('All')
  const [search, setSearch] = useState('')
  const [quantities, setQuantities] = useState<{ [key: string]: number }>(
    items.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.approvedQty || curr.binQty }), {})
  )

  const handleQtyChange = (id: string, val: number) => {
    setQuantities({ ...quantities, [id]: val })
  }

  const approveItem = async (id: string) => {
    try {
      const lineId = Number(id)
      const approvedQty = quantities[id] !== undefined ? quantities[id] : items.find(i => i.id === id)?.binQty || 0
      
      await approveAllocationLineApi({
        lineId,
        approverId: 1, // Default System Approver
        approvedQty,
        decision: "Approve",
        remarks: "Approved via BIN Portal UI"
      })
      
      await reloadAllocations()
    } catch (error) {
      console.error("Failed to approve item:", error)
    }
  }

  const approveAll = async () => {
    const pendingItems = items.filter(item => item.status === 'Pending' || item.status === 'Amend Pending')
    if (pendingItems.length === 0) return

    try {
      await Promise.all(pendingItems.map(item => {
        const approvedQty = quantities[item.id] !== undefined ? quantities[item.id] : item.binQty
        return approveAllocationLineApi({
          lineId: Number(item.id),
          approverId: 1,
          approvedQty,
          decision: "Approve",
          remarks: "Batch approved via BIN Portal UI"
        })
      }))
      
      await reloadAllocations()
      alert('All pending line-items successfully authorized inside production routing systems!')
    } catch (error) {
      console.error("Failed to approve all items:", error)
    }
  }

  const filteredItems = items.filter(item => {
    if (filter === 'Pending' && item.status !== 'Pending') return false
    if (filter === 'Amendment' && item.status !== 'Amend Pending') return false
    if (filter === 'Approved' && !['Approved', 'Fulfilled', 'Partial'].includes(item.status)) return false
    
    if (search) {
      const term = search.toLowerCase()
      return item.itemCode.toLowerCase().includes(term) || item.customer.toLowerCase().includes(term)
    }
    return true
  })

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
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
                className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${filter === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
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
            className="bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-600/90 dark:hover:bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Check size={14} /> Approve All ({items.filter(i => i.status === 'Pending').length})
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-muted/20">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              <th className="p-3 pl-4 font-mono">#</th>
              <th className="p-3">Item Code</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Region</th>
              <th className="p-3 text-right">BIN Qty</th>
              <th className="p-3 text-center">Approved Qty</th>
              <th className="p-3">Target Date</th>
              <th className="p-3 text-right pr-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-xs">
            {filteredItems.map((item, index) => (
              <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                <td className="p-3 pl-4 font-mono text-muted-foreground">{index + 1}</td>
                <td className="p-3 font-bold text-primary font-mono">{item.itemCode}</td>
                <td className="p-3 text-foreground font-medium">{item.customer}</td>
                <td className="p-3 text-muted-foreground">{item.region}</td>
                <td className="p-3 text-right font-mono font-semibold text-foreground">{item.binQty.toLocaleString()}</td>
                <td className="p-3 text-center">
                  {['Approved', 'Fulfilled', 'Partial'].includes(item.status) ? (
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {item.approvedQty?.toLocaleString()}
                    </span>
                  ) : (
                    <input 
                      type="number"
                      value={quantities[item.id] !== undefined ? quantities[item.id] : item.binQty}
                      onChange={(e) => handleQtyChange(item.id, Number(e.target.value))}
                      className="bg-background border border-border w-24 text-center font-mono py-1 rounded text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  )}
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
                      Approve Amend
                    </button>
                  ) : (
                    <button 
                      onClick={() => approveItem(item.id)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-medium px-3 py-1 rounded transition-all shadow-sm cursor-pointer"
                    >
                      Approve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

