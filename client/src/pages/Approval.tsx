import React, { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { Search, Check, ChevronRight, ChevronDown } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useApproveLine } from '@/hooks/useAllocationApi'

interface ItemLine {
  lineId: number
  headerId: number
  organizationId: number
  inventoryItemId: number
  b3Quantity: number
  targetDate: string
  b3ApprovedQuantity: number | null
  approvalFlag: string
  approvedDate: string | null
  approvedBy: string | null
  closureFlag: string
  revision: number
  transactionDate: string
  customerOrItemSpecific: number
  customerId: number
  territoryId: number | null
  billToCustomer: number
  shipToCustomer: number
  createdBy: string
  createdDate: string
  updatedBy: string
  updatedDate: string
  remarks: string
  status?: 'Pending' | 'Approved' | 'Amend Pending' | 'Partial' | 'Fulfilled'
}

interface DashboardContext {
  items: ItemLine[]
  setItems: Dispatch<SetStateAction<ItemLine[]>>
  reloadAllocations: () => Promise<void>
}

export function ApprovalScreen() {
  const { items, reloadAllocations } = useOutletContext<DashboardContext>()
  const { currentUserRole, currentUser } = useAuth()
  const isHodRole = currentUserRole === 'hod'

  const [filter, setFilter] = useState<'All' | 'Pending' | 'Amendment' | 'Approved'>('All')
  const [search, setSearch] = useState('')
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({})
  const [expandedHeaders, setExpandedHeaders] = useState<{ [key: number]: boolean }>({})

  // Track selected line IDs for explicit batch routing execution workflows
  const [selectedLineIds, setSelectedLineIds] = useState<number[]>([])

  const isBusinessHour = () => {
    const now = new Date()
    const hour = now.getHours()
    const day = now.getDay()
    return day >= 1 && day <= 5 && hour >= 9 && hour < 18
  }

  useEffect(() => {
    setQuantities(
      items.reduce((acc, curr) => ({
        ...acc,
        [curr.lineId]: curr.b3ApprovedQuantity ?? curr.b3Quantity,
      }), {})
    )
  }, [items])

  const handleQtyChange = (lineId: number, val: number) => {
    setQuantities({ ...quantities, [lineId]: val })
  }

  const toggleHeader = (headerId: number) => {
    setExpandedHeaders(prev => ({ ...prev, [headerId]: !prev[headerId] }))
  }

  const approveLineHook = useApproveLine()

  const getItemStatus = (item: ItemLine): string => {
    if (item.status) return item.status
    if (item.approvalFlag === 'Y') return 'Approved'
    if (item.approvalFlag === 'A') return 'Amend Pending'
    return 'Pending'
  }

  const approveItem = async (lineId: number) => {
    if (!isHodRole) {
      alert('Access Denied: Only HOD can authorize line allocations.')
      return
    }
    try {
      const targetItem = items.find(i => i.lineId === lineId)
      const approvedQty = quantities[lineId] !== undefined ? quantities[lineId] : targetItem?.b3Quantity || 0

      await approveLineHook.execute({
        lineId,
        approvedQuantity: approvedQty,
        approvedBy: currentUser?.username ?? 'system',
      })

      // Clean selection tracking list state reference cleanly
      setSelectedLineIds(prev => prev.filter(id => id !== lineId))
      await reloadAllocations()
    } catch (error) {
      console.error("Failed to authorize item:", error)
    }
  }

  const handleBatchExecutionAction = async () => {
    if (!isHodRole) return

    // Choose lines based on user checkboxes or fall back to all pending items if none are selected
    const targetedLineIds = selectedLineIds.length > 0
      ? selectedLineIds
      : items.filter(item => getItemStatus(item) === 'Pending').map(i => i.lineId)

    if (targetedLineIds.length === 0) return

    try {
      await Promise.all(targetedLineIds.map(lineId => {
        const itemRef = items.find(i => i.lineId === lineId)
        const approvedQty = quantities[lineId] !== undefined ? quantities[lineId] : itemRef?.b3Quantity || 0
        return approveLineHook.execute({
          lineId,
          approvedQuantity: approvedQty,
          approvedBy: currentUser?.username ?? 'system',
        })
      }))

      setSelectedLineIds([])
      await reloadAllocations()
      alert('All requested records authorized successfully inside allocation logs.')
    } catch (error) {
      console.error("Batch processing operation failure:", error)
    }
  }

  const filteredItems = items.filter(item => {
    const currentStatus = getItemStatus(item)
    if (filter === 'Pending' && currentStatus !== 'Pending') return false
    if (filter === 'Amendment' && currentStatus !== 'Amend Pending') return false
    if (filter === 'Approved' && item.approvalFlag !== 'Y') return false

    if (search) {
      const term = search.toLowerCase()
      return (
        item.inventoryItemId.toString().includes(term) ||
        item.customerId.toString().includes(term) ||
        item.headerId.toString().includes(term)
      )
    }
    return true
  })

  const groupedByHeader = filteredItems.reduce<{ [key: number]: ItemLine[] }>((groups, item) => {
    if (!groups[item.headerId]) {
      groups[item.headerId] = []
    }
    groups[item.headerId].push(item)
    return groups
  }, {})

  const uniqueHeaderIds = Object.keys(groupedByHeader).map(Number)
  const totalGlobalPendingItems = items.filter(i => getItemStatus(i) === 'Pending').length

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      {/* Search and Filters Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-md font-bold text-foreground">BIN Approval Panel (HOD)</h2>
          <p className="text-xs text-muted-foreground">Authorize item counts completely inside operational windows.</p>
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
              placeholder="Search ID numbers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-background border border-border pl-8 pr-3 py-1.5 rounded-lg text-xs text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-primary w-44"
            />
          </div>

          {isHodRole && (
            <button
              onClick={handleBatchExecutionAction}
              disabled={totalGlobalPendingItems === 0}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-emerald-600/90 dark:hover:bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Check size={14} />
              {selectedLineIds.length > 0
                ? `Approve Selected (${selectedLineIds.length})`
                : `Approve All Pending (${totalGlobalPendingItems})`
              }
            </button>
          )}
        </div>
      </div>

      {/* Main Structured Multi-Level Grid */}
      <div className="overflow-x-auto rounded-lg border border-border bg-muted/20">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              <th className="p-3 pl-4 w-10"></th>
              <th className="p-3 w-12 text-center">Select</th>
              <th className="p-3 font-mono">Header</th>
              <th className="p-3">ORG</th>
              <th className="p-3">Customer</th>
              <th className="p-3 text-right">Total Items</th>
              <th className="p-3 text-right">Total Quantity</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {uniqueHeaderIds.map((headerId) => {
              const headerLines = groupedByHeader[headerId] || []
              const isExpanded = !!expandedHeaders[headerId]
              const pendingLines = headerLines.filter(item => getItemStatus(item) === 'Pending')
              const totalRequestedQty = headerLines.reduce((sum, item) => sum + item.b3Quantity, 0)
              const firstItem = headerLines[0]

              const isAllLinesSelected = pendingLines.length > 0 && pendingLines.every(item => selectedLineIds.includes(item.lineId))
              const isSomeLinesSelected = pendingLines.some(item => selectedLineIds.includes(item.lineId)) && !isAllLinesSelected

              const handleHeaderCheckboxChange = () => {
                if (isAllLinesSelected) {
                  const pendingIds = pendingLines.map(i => i.lineId)
                  setSelectedLineIds(prev => prev.filter(id => !pendingIds.includes(id)))
                } else {
                  const pendingIds = pendingLines.map(i => i.lineId)
                  setSelectedLineIds(prev => [...new Set([...prev, ...pendingIds])])
                }
              }

              return (
                <React.Fragment key={headerId}>
                  {/* Accordion Toggle Row Target */}
                  <tr className="bg-background hover:bg-muted/40 transition-colors border-b border-border/20 font-semibold select-none">
                    <td
                      onClick={() => toggleHeader(headerId)}
                      className="p-3 pl-4 text-muted-foreground text-center cursor-pointer"
                    >
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </td>

                    <td className="p-3 text-center">
                      {pendingLines.length > 0 ? (
                        <input
                          type="checkbox"
                          checked={isAllLinesSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = isSomeLinesSelected
                          }}
                          onChange={handleHeaderCheckboxChange}
                          className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer accent-primary"
                        />
                      ) : (
                        <input type="checkbox" disabled className="opacity-30 h-3.5 w-3.5 cursor-not-allowed" />
                      )}
                    </td>

                    <td onClick={() => toggleHeader(headerId)} className="p-3 font-bold text-primary font-mono text-xs cursor-pointer">
                      Header #{headerId}
                    </td>
                    <td onClick={() => toggleHeader(headerId)} className="p-3 text-foreground font-mono font-medium cursor-pointer">
                      {firstItem?.organizationId ?? '-'}
                    </td>
                    <td onClick={() => toggleHeader(headerId)} className="p-3 text-muted-foreground font-mono font-medium cursor-pointer">
                      {firstItem?.customerId ?? '-'}
                    </td>
                    <td onClick={() => toggleHeader(headerId)} className="p-3 text-right font-mono text-muted-foreground font-normal cursor-pointer">
                      {headerLines.length} lines
                    </td>
                    <td onClick={() => toggleHeader(headerId)} className="p-3 text-right font-mono font-bold text-foreground cursor-pointer">
                      {totalRequestedQty.toLocaleString()}
                    </td>
                  </tr>

                  {/* Sub-item Details Section */}
                  {isExpanded && (
                    <tr className="border-b border-border/40 last:border-0 bg-muted/20">
                      <td colSpan={7} className="p-0">
                        <div className="border-b border-border/40">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-muted/40 border-b border-border/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                <th className="p-2.5 pl-6 w-12 text-center">Select</th>
                                <th className="p-2.5 font-mono w-24">Line ID</th>
                                <th className="p-2.5 font-mono">Inventory Item ID</th>
                                <th className="p-2.5">Ship To Customer</th>
                                <th className="p-2.5 text-right w-32">Requested Qty</th>
                                <th className="p-2.5 text-right w-32">Approved Qty</th>
                                <th className="p-2.5 w-32">Target Date</th>
                                <th className="p-2.5 text-right pr-6 w-44">Action</th>
                              </tr>
                            </thead>
                            <tbody className="text-xs">
                              {headerLines.map((item) => {
                                const currentStatus = getItemStatus(item)
                                const isFinalized = ['Approved', 'Fulfilled', 'Partial'].includes(currentStatus)
                                const isLineChecked = selectedLineIds.includes(item.lineId)

                                const handleLineCheckboxChange = () => {
                                  if (isLineChecked) {
                                    setSelectedLineIds(prev => prev.filter(id => id !== item.lineId))
                                  } else {
                                    setSelectedLineIds(prev => [...prev, item.lineId])
                                  }
                                }

                                return (
                                  <tr key={item.lineId} className="bg-white hover:bg-slate-100 transition-colors">
                                    <td className="p-2.5 text-center">
                                      {!isFinalized ? (
                                        <input
                                          type="checkbox"
                                          checked={isLineChecked}
                                          onChange={handleLineCheckboxChange}
                                          className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer accent-primary"
                                        />
                                      ) : (
                                        <input type="checkbox" disabled className="opacity-20 h-3.5 w-3.5 cursor-not-allowed" />
                                      )}
                                    </td>

                                    <td className="p-2.5 font-mono text-slate-700 pl-3">{item.lineId}</td>
                                    <td className="p-2.5 font-mono font-bold text-slate-900">{item.inventoryItemId}</td>
                                    <td className="p-2.5 text-slate-600">{item.shipToCustomer}</td>

                                    <td className="p-2.5 text-right font-mono font-semibold text-slate-900">
                                      {item.b3Quantity.toLocaleString()}
                                    </td>

                                    <td className="p-2.5 text-right">
                                      {isBusinessHour() && !isFinalized ? (
                                        <input
                                          type="number"
                                          value={quantities[item.lineId] !== undefined ? quantities[item.lineId] : item.b3ApprovedQuantity ?? item.b3Quantity}
                                          onChange={(e) => handleQtyChange(item.lineId, Number(e.target.value))}
                                          className="bg-white border border-slate-300 w-24 text-center font-mono py-0.5 rounded text-xs text-slate-900 focus:border-primary focus:outline-none"
                                        />
                                      ) : isFinalized ? (
                                        <span className="font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                          {item.b3ApprovedQuantity?.toLocaleString() ?? '-'}
                                        </span>
                                      ) : (
                                        <span className="font-mono text-slate-600">
                                          {item.b3ApprovedQuantity != null ? item.b3ApprovedQuantity.toLocaleString() : '-'}
                                        </span>
                                      )}
                                    </td>

                                    <td className="p-2.5 font-mono text-slate-600">
                                      {new Date(item.targetDate).toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' })}
                                    </td>

                                    <td className="p-2.5 text-right pr-6">
                                      {isFinalized ? (
                                        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded font-semibold inline-block">
                                          ✓ Approved
                                        </span>
                                      ) : (
                                        <button
                                          onClick={() => approveItem(item.lineId)}
                                          className="bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-medium px-2.5 py-0.5 rounded transition-all shadow-sm cursor-pointer"
                                        >
                                          Approve
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}