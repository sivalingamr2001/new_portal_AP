import { useCallback, useState, useEffect, useMemo } from "react"
import { getAllAllocations } from "@/api/allocationApi"
import { useOrganizations } from "@/hooks/useAllocationApi"

// ─── Interfaces ──────────────────────────────────────────────
export interface BackendAllocationLine {
  lineId: number
  organizationId: number | null
  inventoryItemId: number
  b3Quantity: number
  targetDate: string
  b3ApprovedQuantity: number | null
  approvalFlag: "Y" | "N"
  approvedDate: string | null
  approvedBy: string | null
  closureFlag: "Y" | "N"
  revision: number
  headerId: number
  transactionDate: string
  customerOrItemSpecific: number | null
  customerId: number | null
  territoryId: number | null
  billToCustomer: number | null
  shipToCustomer: number | null
  createdBy: string
  createdDate: string
  updatedBy: string | null
  updatedDate: string | null
  remarks: string | null
  organizationCode: string | null
  itemCode: string
  itemDescription: string | null
  customerName: string | null
  customerRegion: string | null
  parentLineId?: number | null
  oldRequestedQty?: number | null
}

export interface GroupedAllocationHeader {
  headerId: number
  transactionDate: string
  billToCustomer: number | null
  shipToCustomer: number | null
  remarks: string | null
  createdOn: string | null
  updatedOn: string | null
  status: "Fulfilled" | "Partial" | "Pending"
  totalRequested: number
  totalApproved: number
  lines: BackendAllocationLine[]
}

export function useFulFilment() {
  const [records, setRecords] = useState<BackendAllocationLine[]>([])
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [selectedLines, setSelectedLines] = useState<BackendAllocationLine[] | null>(null)
  const [loadingSingle, setLoadingSingle] = useState(false)

  const { data: organizations } = useOrganizations()

  // ─── Fetch All Records (Fulfillment Source) ──────────────────
  const fetchAllRecords = useCallback(async () => {
    setLoadingRecords(true)
    try {
      const data: any = await getAllAllocations()
      setRecords(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingRecords(false)
    }
  }, [])

  // ─── Load Header Lines For Edit Modal ──────────────────────
  const loadLinesForEdit = useCallback(
    async (headerId: number) => {
      setLoadingSingle(true)
      try {
        const matched = records.filter((r) => r.headerId === headerId)
        setSelectedLines(matched.length ? matched : null)
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingSingle(false)
      }
    },
    [records]
  )

  useEffect(() => {
    fetchAllRecords()
  }, [fetchAllRecords])

  // ─── Data Grouping Transformer (Header -> Lines Relationship) ───
  const groupedHeaders = useMemo(() => {
    const map: Record<number, GroupedAllocationHeader> = {}

    records.forEach((line) => {
      if (!map[line.headerId]) {
        map[line.headerId] = {
          headerId: line.headerId,
          transactionDate: line.transactionDate,
          billToCustomer: line.billToCustomer,
          shipToCustomer: line.shipToCustomer,
          remarks: line.remarks,
          createdOn: line.createdDate,
          updatedOn: line.updatedDate,
          status: "Pending",
          totalRequested: 0,
          totalApproved: 0,
          lines: [],
        }
      }

      const header = map[line.headerId]
      header.totalRequested += line.b3Quantity
      header.totalApproved += line.b3ApprovedQuantity || 0
      header.lines.push(line)
    })

    return Object.values(map).map((header) => {
      const allApproved = header.lines.every((l) => l.approvalFlag === "Y")
      const noneApproved = header.lines.every((l) => l.approvalFlag === "N")

      if (allApproved) header.status = "Fulfilled"
      else if (noneApproved) header.status = "Pending"
      else header.status = "Partial"

      return header
    })
  }, [records])

  return {
    groupedHeaders,
    loadingRecords,
    selectedLines,
    loadingSingle,
    loadLinesForEdit,
    closeEditModal: () => setSelectedLines(null),
    refreshRecords: fetchAllRecords,
    organizations: organizations || [],
  }
}
