import React, { useEffect, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import { Search, Check, ChevronRight, ChevronDown, Eye } from "lucide-react"
import { useOutletContext } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import ReviewAllocationModal from "@/components/fulfillment/ReviewAllocationModal"
import { useApproveLine } from "@/hooks/useAllocationApi"

interface ItemLine {
  lineId: number
  headerId: number
  organizationId: number
  organizationCode?: string
  inventoryItemId: number
  itemCode?: string
  itemDescription?: string
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
  customerName?: string
  customerRegion?: string
  billToCustomer: number
  shipToCustomer: number
  createdBy: string
  createdDate: string
  updatedBy: string
  updatedDate: string
  remarks: string
  status?: "Pending" | "Approved" | "Amend Pending" | "Partial" | "Fulfilled"
}

interface DashboardContext {
  items: ItemLine[]
  setItems: Dispatch<SetStateAction<ItemLine[]>>
  reloadAllocations: () => Promise<void>
}

export function ApprovalScreen() {
  const { items, reloadAllocations } = useOutletContext<DashboardContext>()
  const { currentUserRole, currentUser } = useAuth()
  const isHodRole = currentUserRole === "hod"

  const [filter, setFilter] = useState<
    "All" | "Pending" | "Amendment" | "Approved"
  >("All")
  const [search, setSearch] = useState("")
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({})
  const [expandedHeaders, setExpandedHeaders] = useState<{
    [key: number]: boolean
  }>({})

  const [selectedLineIds, setSelectedLineIds] = useState<number[]>([])
  const [reviewHeaderId, setReviewHeaderId] = useState<number | null>(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

  const isBusinessHour = () => {
    const now = new Date()
    const hour = now.getHours()
    const day = now.getDay()
    return day >= 1 && day <= 5 && hour >= 9 && hour < 18
  }

  useEffect(() => {
    setQuantities(
      items.reduce(
        (acc, curr) => ({
          ...acc,
          [curr.lineId]: curr.b3ApprovedQuantity ?? curr.b3Quantity,
        }),
        {}
      )
    )
  }, [items])

  const handleQtyChange = (lineId: number, val: number) => {
    setQuantities({ ...quantities, [lineId]: val })
  }

  const toggleHeader = (headerId: number) => {
    setExpandedHeaders((prev) => ({ ...prev, [headerId]: !prev[headerId] }))
  }

  const approveLineHook = useApproveLine()

  const getItemStatus = (item: ItemLine): string => {
    if (item.closureFlag === "Y") return "Cancelled"
    if (item.status) return item.status
    if (item.approvalFlag === "Y") return "Approved"
    if (item.approvalFlag === "A") return "Amend Pending"
    return "Pending"
  }

  const approveItem = async (lineId: number) => {
    if (!isHodRole) {
      alert("Access Denied: Only HOD can authorize line allocations.")
      return
    }
    try {
      const targetItem = items.find((i) => i.lineId === lineId)
      const approvedQty =
        quantities[lineId] !== undefined
          ? quantities[lineId]
          : targetItem?.b3Quantity || 0

      await approveLineHook.execute({
        lineId,
        approvedQuantity: approvedQty,
        approvedBy: currentUser?.username ?? "system",
      })

      setSelectedLineIds((prev) => prev.filter((id) => id !== lineId))
      await reloadAllocations()
    } catch (error) {
      console.error("Failed to authorize item:", error)
    }
  }

  const handleBatchExecutionAction = async () => {
    if (!isHodRole) return

    const targetedLineIds =
      selectedLineIds.length > 0
        ? selectedLineIds
        : items
          .filter((item) => getItemStatus(item) === "Pending")
          .map((i) => i.lineId)

    if (targetedLineIds.length === 0) return

    try {
      await Promise.all(
        targetedLineIds.map((lineId) => {
          const itemRef = items.find((i) => i.lineId === lineId)
          const approvedQty =
            quantities[lineId] !== undefined
              ? quantities[lineId]
              : itemRef?.b3Quantity || 0
          return approveLineHook.execute({
            lineId,
            approvedQuantity: approvedQty,
            approvedBy: currentUser?.username ?? "system",
          })
        })
      )

      setSelectedLineIds([])
      await reloadAllocations()
      alert(
        "All requested records authorized successfully inside allocation logs."
      )
    } catch (error) {
      console.error("Batch processing operation failure:", error)
    }
  }

  const filteredItems = items.filter((item) => {
    const currentStatus = getItemStatus(item)
    if (filter === "Pending" && currentStatus !== "Pending") return false
    if (filter === "Amendment" && currentStatus !== "Amend Pending")
      return false
    if (filter === "Approved" && item.approvalFlag !== "Y") return false

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

  const groupedByHeader = filteredItems.reduce<{ [key: number]: ItemLine[] }>(
    (groups, item) => {
      if (!groups[item.headerId]) {
        groups[item.headerId] = []
      }
      groups[item.headerId].push(item)
      return groups
    },
    {}
  )

  const uniqueHeaderIds = Object.keys(groupedByHeader).map(Number)
  const totalGlobalPendingItems = items.filter(
    (i) => getItemStatus(i) === "Pending"
  ).length

  const openHeaderReview = (headerId: number) => {
    const headerLines = groupedByHeader[headerId] || []
    if (headerLines.length === 0) return
    setReviewHeaderId(headerId)
    setIsReviewModalOpen(true)
  }

  const closeHeaderReview = () => {
    setIsReviewModalOpen(false)
    setReviewHeaderId(null)
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      {/* Search and Filters Header Toolbar */}
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-md font-bold text-foreground">
            BIN Approval Panel (HOD)
          </h2>
          <p className="text-xs text-muted-foreground">
            Authorize item counts completely inside operational windows.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-border bg-muted p-0.5 text-xs">
            {(["All", "Pending", "Amendment", "Approved"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`cursor-pointer rounded-md px-3 py-1 font-medium transition-all ${filter === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search
              className="absolute top-2.5 left-2.5 text-muted-foreground"
              size={14}
            />
            <input
              type="text"
              placeholder="Search ID numbers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-44 rounded-lg border border-border bg-background py-1.5 pr-3 pl-8 text-xs text-foreground placeholder-muted-foreground/60 focus:border-primary focus:outline-none"
            />
          </div>

          {isHodRole && (
            <button
              onClick={handleBatchExecutionAction}
              disabled={totalGlobalPendingItems === 0}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-emerald-600/90 dark:hover:bg-emerald-600"
            >
              <Check size={14} />
              {selectedLineIds.length > 0
                ? `Approve Selected (${selectedLineIds.length})`
                : `Approve All Pending (${totalGlobalPendingItems})`}
            </button>
          )}
        </div>
      </div>

      {/* ===== MAIN TABLE: Fixed Layout with Proper Column Widths ===== */}
      <div className="overflow-x-auto rounded-lg border border-border bg-muted/20">
        <table className="w-full border-collapse text-left" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '40px' }} />
            <col style={{ width: '52px' }} />
            <col style={{ width: '110px' }} />
            <col style={{ width: '80px' }} />
            <col style={{ width: '200px' }} />
            <col style={{ width: '100px' }} />
            <col style={{ width: '120px' }} />
            <col style={{ width: '130px' }} />
          </colgroup>
          <thead>
            <tr className="border-b border-border bg-muted/50 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
              <th className="p-3 pl-4 text-center"></th>
              <th className="p-3 text-center">Select</th>
              <th className="p-3 font-mono">Header</th>
              <th className="p-3">ORG</th>
              <th className="p-3">Customer</th>
              <th className="p-3 text-right">Total Items</th>
              <th className="p-3 text-right">Total Qty</th>
              <th className="p-3 text-right">Requested On</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {uniqueHeaderIds.map((headerId) => {
              const headerLines = groupedByHeader[headerId] || []
              const isExpanded = !!expandedHeaders[headerId]
              const pendingLines = headerLines.filter(
                (item) => getItemStatus(item) === "Pending"
              )
              const totalRequestedQty = headerLines.reduce(
                (sum, item) => sum + item.b3Quantity,
                0
              )
              const firstItem: any = headerLines[0]

              const isAllLinesSelected =
                pendingLines.length > 0 &&
                pendingLines.every((item) =>
                  selectedLineIds.includes(item.lineId)
                )
              const isSomeLinesSelected =
                pendingLines.some((item) =>
                  selectedLineIds.includes(item.lineId)
                ) && !isAllLinesSelected

              const handleHeaderCheckboxChange = () => {
                if (isAllLinesSelected) {
                  const pendingIds = pendingLines.map((i) => i.lineId)
                  setSelectedLineIds((prev) =>
                    prev.filter((id) => !pendingIds.includes(id))
                  )
                } else {
                  const pendingIds = pendingLines.map((i) => i.lineId)
                  setSelectedLineIds((prev) => [
                    ...new Set([...prev, ...pendingIds]),
                  ])
                }
              }

              return (
                <React.Fragment key={headerId}>
                  {/* ===== HEADER ROW ===== */}
                  <tr className="border-b border-border/20 bg-background font-semibold transition-colors select-none hover:bg-muted/40">
                    <td
                      onClick={() => toggleHeader(headerId)}
                      className="cursor-pointer p-3 pl-4 text-center text-muted-foreground"
                    >
                      {isExpanded ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
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
                          className="h-3.5 w-3.5 cursor-pointer rounded border-gray-300 text-primary accent-primary focus:ring-primary"
                        />
                      ) : (
                        <input
                          type="checkbox"
                          disabled
                          className="h-3.5 w-3.5 cursor-not-allowed opacity-30"
                        />
                      )}
                    </td>

                    <td
                      onClick={() => toggleHeader(headerId)}
                      className="cursor-pointer p-3 font-mono text-xs font-bold text-primary"
                    >
                      <span className="truncate block">Header #{headerId}</span>
                    </td>
                    <td
                      onClick={() => toggleHeader(headerId)}
                      className="cursor-pointer p-3 font-mono font-medium text-foreground"
                    >
                      <span className="truncate block">{firstItem?.organizationCode ?? "-"}</span>
                    </td>
                    <td
                      onClick={() => toggleHeader(headerId)}
                      className="cursor-pointer p-3"
                    >
                      <div className="space-y-0.5 text-xs overflow-hidden">
                        <div className="font-medium text-slate-900 truncate">
                          {firstItem?.customerName || `Customer #${firstItem?.customerId ?? "-"}`}
                        </div>
                        <div className="text-slate-500 truncate">
                          {firstItem?.customerRegion ? `${firstItem.customerRegion}` : "-"}
                        </div>
                      </div>
                    </td>
                    <td
                      onClick={() => toggleHeader(headerId)}
                      className="cursor-pointer p-3 text-right font-mono font-normal text-muted-foreground"
                    >
                      {headerLines.length} lines
                    </td>
                    <td
                      onClick={() => toggleHeader(headerId)}
                      className="cursor-pointer p-3 text-right font-mono font-bold text-foreground"
                    >
                      {totalRequestedQty.toLocaleString()}
                    </td>
                    <td
                      onClick={() => toggleHeader(headerId)}
                      className="cursor-pointer p-3 text-right font-mono font-normal text-muted-foreground"
                    >
                      {firstItem.transactionDate
                        ? new Date(firstItem.transactionDate).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        })
                        : "-"}
                    </td>
                  </tr>

                  {/* ===== EXPANDED SUB-TABLE ===== */}
                  {isExpanded && (
                    <tr className="border-b border-border/40 bg-muted/20 last:border-0">
                      <td colSpan={8} className="p-0">
                        <div className="border-b border-border/40">
                          <table className="w-full min-w-full border-collapse text-left" style={{ tableLayout: 'fixed' }}>
                            <colgroup>
                              <col style={{ width: '52px' }} />
                              <col style={{ width: '90px' }} />
                              <col style={{ width: '120px' }} />
                              <col style={{ width: 'auto' }} />
                              <col style={{ width: '110px' }} />
                              <col style={{ width: '110px' }} />
                              <col style={{ width: '110px' }} />
                              <col style={{ width: '150px' }} />
                            </colgroup>
                            <thead>
                              <tr className="border-b border-border/40 bg-muted/40 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                <th className="p-2.5 pl-6 text-center">Select</th>
                                <th className="p-2.5 font-mono">Line ID</th>
                                <th className="p-2.5 font-mono">Item Code</th>
                                <th className="p-2.5">Description</th>
                                <th className="p-2.5 text-right">Requested Qty</th>
                                <th className="p-2.5 text-right">Approved Qty</th>
                                <th className="p-2.5">Target Date</th>
                                <th className="p-2.5 pr-6 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="text-xs">
                              {headerLines.map((item) => {
                                const currentStatus = getItemStatus(item)
                                const isFinalized = [
                                  "Approved",
                                  "Fulfilled",
                                  "Partial",
                                  "Cancelled",
                                ].includes(currentStatus)
                                const isLineChecked = selectedLineIds.includes(
                                  item.lineId
                                )

                                const handleLineCheckboxChange = () => {
                                  if (isLineChecked) {
                                    setSelectedLineIds((prev) =>
                                      prev.filter((id) => id !== item.lineId)
                                    )
                                  } else {
                                    setSelectedLineIds((prev) => [
                                      ...prev,
                                      item.lineId,
                                    ])
                                  }
                                }

                                return (
                                  <tr
                                    key={item.lineId}
                                    className={`transition-colors ${currentStatus === "Cancelled" ? "bg-rose-50/80 text-rose-900 hover:bg-rose-100" : "bg-white hover:bg-slate-100"}`}
                                  >
                                    <td className="p-2.5 text-center">
                                      {!isFinalized ? (
                                        <input
                                          type="checkbox"
                                          checked={isLineChecked}
                                          onChange={handleLineCheckboxChange}
                                          className="h-3.5 w-3.5 cursor-pointer rounded border-gray-300 text-primary accent-primary focus:ring-primary"
                                        />
                                      ) : (
                                        <input
                                          type="checkbox"
                                          disabled
                                          className="h-3.5 w-3.5 cursor-not-allowed opacity-20"
                                        />
                                      )}
                                    </td>

                                    <td className="p-2.5 pl-3 font-mono text-blue-700">
                                      <span className="truncate block">Line #{item.lineId}</span>
                                    </td>
                                    <td className="p-2.5 font-mono text-slate-900">
                                      <span className="truncate block">{item.itemCode || "-"}</span>
                                    </td>
                                    <td className="p-2.5 text-slate-900">
                                      <div className="text-sm font-semibold truncate">
                                        {item.itemDescription || "-"}
                                      </div>
                                    </td>
                                    <td className="p-2.5 text-right font-mono font-semibold text-slate-900">
                                      {item.b3Quantity.toLocaleString()}
                                    </td>

                                    <td className="p-2.5 text-right">
                                      {isBusinessHour() && !isFinalized ? (
                                        <input
                                          type="number"
                                          value={
                                            quantities[item.lineId] !==
                                              undefined
                                              ? quantities[item.lineId]
                                              : (item.b3ApprovedQuantity ??
                                                item.b3Quantity)
                                          }
                                          onChange={(e) =>
                                            handleQtyChange(
                                              item.lineId,
                                              Number(e.target.value)
                                            )
                                          }
                                          className="w-20 rounded border border-slate-300 bg-white py-0.5 text-center font-mono text-xs text-slate-900 focus:border-primary focus:outline-none"
                                        />
                                      ) : isFinalized ? (
                                        <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono font-bold text-emerald-600">
                                          {item.b3ApprovedQuantity?.toLocaleString() ??
                                            "-"}
                                        </span>
                                      ) : (
                                        <span className="font-mono text-slate-600">
                                          {item.b3ApprovedQuantity != null
                                            ? item.b3ApprovedQuantity.toLocaleString()
                                            : "-"}
                                        </span>
                                      )}
                                    </td>

                                    <td className="p-2.5 font-mono text-slate-600">
                                      <span className="truncate block">
                                        {new Date(item.targetDate).toLocaleDateString(undefined, {
                                          year: "numeric",
                                          month: "2-digit",
                                          day: "2-digit",
                                        })}
                                      </span>
                                    </td>

                                    <td className="p-2.5 pr-6 text-right">
                                      <div className="flex flex-wrap items-center justify-end gap-2">
                                        <button
                                          onClick={() => openHeaderReview(item.headerId)}
                                          className="cursor-pointer rounded bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-200 flex items-center gap-1"
                                        >
                                          <Eye size={12} />
                                          View
                                        </button>

                                        {currentStatus === "Cancelled" ? (
                                          <span className="inline-block rounded border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-600">
                                            Cancelled
                                          </span>
                                        ) : isFinalized ? (
                                          <span className="inline-block rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                                            ✓ Approved
                                          </span>
                                        ) : (
                                          <button
                                            onClick={() => approveItem(item.lineId)}
                                            className="cursor-pointer rounded bg-primary px-2.5 py-0.5 text-[11px] font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
                                          >
                                            Approve
                                          </button>
                                        )}
                                      </div>
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

      {reviewHeaderId !== null && (
        <ReviewAllocationModal
          isOpen={isReviewModalOpen}
          onClose={closeHeaderReview}
          headerId={reviewHeaderId}
          onSave={async () => {
            closeHeaderReview()
            await reloadAllocations()
          }}
        />
      )}
    </div>
  )
}