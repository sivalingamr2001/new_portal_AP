import type { AllocationRow } from "@/api/allocationApi"
import type { ItemLine } from "@/layout/AppLayout"

function deriveStatus(row: AllocationRow): ItemLine["status"] {
  if (row.closureFlag === "Y") {
    return "Fulfilled"
  }
  if (row.approvalFlag === "Y") {
    return "Approved"
  }
  if (row.revision > 0) {
    return "Amend Pending"
  }
  return "Pending"
}

function formatTargetDate(targetDate: string | null): string {
  if (!targetDate) return ""
  return targetDate.split("T")[0]
}

export function mapAllocationRowToItemLine(row: AllocationRow): ItemLine {
  return {
    id: String(row.lineId),
    itemCode: `ITEM-${row.inventoryItemId}`,
    itemName: `Item ${row.inventoryItemId}`,
    customer: row.customerId ? `Customer #${row.customerId}` : "Open Pool",
    region: "",
    binQty: row.b3Quantity,
    requestedQty: row.b3Quantity,
    approvedQty: row.b3ApprovedQuantity ?? undefined,
    amendedQty: row.revision > 0 ? row.b3Quantity : undefined,
    isApproved: row.approvalFlag === "Y",
    targetDate: formatTargetDate(row.targetDate),
    status: deriveStatus(row),
  }
}

export function mapAllocationRowsToItemLines(rows: AllocationRow[]): ItemLine[] {
  return rows
    .filter((row) => row.closureFlag !== "Y")
    .map(mapAllocationRowToItemLine)
}
