import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { HelpCircle } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { cancelAllocationLineApi, amendAllocationLineApi } from '@/api/allocationApi'

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

export function AmendmentScreen() {
  const { items, reloadAllocations } = useOutletContext<DashboardContext>()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [amendQty, setAmendQty] = useState<number>(0)
  const [reason, setReason] = useState('')

  const targetItem = items.find(i => i.id === selectedId)

  const triggerSelect = (item: ItemLine) => {
    setSelectedId(item.id)
    setAmendQty(item.approvedQty || item.binQty)
    setReason('')
  }

  const processAmendment = async () => {
    if (!selectedId || !reason) return
    try {
      await amendAllocationLineApi({
        lineId: Number(selectedId),
        newQty: amendQty,
        reason
      })
      await reloadAllocations()
      alert('Amendment request queued and dispatched back to authorization matrix!')
      setSelectedId(null)
    } catch (error) {
      console.error("Failed to submit amendment:", error)
    }
  }

  const processCancellation = async (id: string) => {
    if (confirm('Are you absolutely sure you want to completely erase this allocation payload entry?')) {
      try {
        const lineId = Number(id)
        const item = items.find(i => i.id === id)
        await cancelAllocationLineApi({
          lineId,
          cancelledQty: item?.binQty || 0,
          reason: "Cancelled via BIN Portal UI",
          cancelledBy: "1" // Default System User ID as string
        })
        await reloadAllocations()
        if (selectedId === id) setSelectedId(null)
      } catch (error) {
        console.error("Failed to cancel allocation line:", error)
      }
    }
  }

  const allowedItems = items.filter(i => i.status === 'Approved' || i.status === 'Amend Pending')

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3 bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-md font-bold text-foreground">Amendment / Cancellation</h2>
          <p className="text-xs text-muted-foreground">Select approved items to amend qty or cancel — will re-enter approval flow</p>
        </div>

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
              {allowedItems.map((item) => (
                <tr key={item.id} className={`hover:bg-muted/40 transition-colors ${selectedId === item.id ? 'bg-blue-500/10 border-l-2 border-l-primary' : ''}`}>
                  <td className="p-3 font-bold text-primary font-mono pl-4">{item.itemCode}</td>
                  <td className="p-3 text-foreground font-medium">{item.customer}</td>
                  <td className="p-3 text-muted-foreground">{item.region}</td>
                  <td className="p-3 text-right font-mono text-foreground">{item.approvedQty || item.binQty}</td>
                  <td className="p-3 font-mono text-muted-foreground">{item.targetDate}</td>
                  <td className="p-3 text-right pr-4 space-x-2">
                    <button 
                      onClick={() => triggerSelect(item)}
                      className="bg-secondary hover:bg-secondary/80 text-secondary-foreground text-[11px] font-medium px-2.5 py-1 rounded transition-colors cursor-pointer"
                    >
                      Amend Qty
                    </button>
                    <button 
                      onClick={() => processCancellation(item.id)}
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

        {targetItem && (
          <div className="mt-6 bg-muted/40 border border-border p-4 rounded-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Configure Amendment: {targetItem.itemCode}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">New Quantity</label>
                <input 
                  type="number"
                  value={amendQty}
                  onChange={(e) => setAmendQty(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Reason *</label>
                <select 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-background border border-border rounded px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="">Select reason...</option>
                  <option value="Production schedule change">Production schedule change</option>
                  <option value="Client order revision">Client order revision</option>
                  <option value="Logistics/Supply delay">Logistics/Supply delay</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={processAmendment}
                  disabled={!reason}
                  className="flex-1 bg-orange-600 hover:bg-orange-500 disabled:bg-muted disabled:text-muted-foreground text-white text-xs font-semibold px-4 py-1.5 rounded transition-all h-9 cursor-pointer"
                >
                  Submit Amend
                </button>
                <button 
                  onClick={() => setSelectedId(null)}
                  className="bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs px-3 py-1.5 rounded cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PROCESS GUIDE PANEL */}
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm text-xs space-y-3">
          <h3 className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1">
            <HelpCircle size={13} className="text-primary" /> Amendment Process
          </h3>
          <ol className="space-y-2 list-decimal list-inside text-muted-foreground">
            <li>Select approved item lines from the table matrix viewports.</li>
            <li>Choose <span className="text-foreground font-semibold">"Amend Qty"</span> or <span className="text-foreground font-semibold">"Cancel"</span> contextually.</li>
            <li>Enter your updated structural quantities alongside targeted operational rationale fields.</li>
            <li>Submit details — system routing triggers auto-re-evaluation pipelines instantly.</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

