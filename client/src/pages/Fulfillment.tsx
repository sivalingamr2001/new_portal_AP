import ReviewAllocationModal from "@/components/fulfillment/ReviewAllocationModal"
import { FulfillmentTrackerTable } from "@/components/fulfillment/FulfillmentTrackerTable"
import { useFulFilment } from "@/components/fulfillment/hooks/useFullfilement"
import React, { useCallback } from "react"

export const FulfillmentScreen: React.FC = () => {
  const {
    groupedHeaders,
    loadingRecords,
    selectedLines,
    loadingSingle,
    loadLinesForEdit,
    closeEditModal,
    refreshRecords,
  } = useFulFilment()

  const selectedHeaderDetails = selectedLines
    ? {
        headerId: selectedLines[0].headerId,
        customerId: selectedLines[0].customerId ?? 0,
        customerName: selectedLines[0].customerName ?? "Unknown Customer",
        billToCustomerId: selectedLines[0].billToCustomer ?? 0,
        billToCustomerName:
          selectedLines[0].customerName ?? `BillTo-${selectedLines[0].billToCustomer ?? 0}`,
        shipToCustomerId: selectedLines[0].shipToCustomer ?? 0,
        shipToCustomerName:
          selectedLines[0].customerRegion ?? `ShipTo-${selectedLines[0].shipToCustomer ?? 0}`,
        remarks: selectedLines[0].remarks ?? null,
        transactionDate: selectedLines[0].transactionDate,
        createdBy: selectedLines[0].createdBy,
        createdDate: selectedLines[0].createdDate,
        updatedBy: selectedLines[0].updatedBy ?? null,
        updatedDate: selectedLines[0].updatedDate ?? null,
        totalRequested: selectedLines.reduce((sum, line) => sum + line.b3Quantity, 0),
        totalApproved: selectedLines.reduce(
          (sum, line) => sum + (line.b3ApprovedQuantity ?? 0),
          0
        ),
        status: selectedLines.every((line) => line.approvalFlag === "Y")
          ? "Fulfilled"
          : selectedLines.every((line) => line.approvalFlag === "N")
          ? "Pending"
          : "Partial",
        items: selectedLines.map((line) => ({
          lineId: line.lineId,
          organizationId: line.organizationId ?? 0,
          organizationCode: line.organizationCode ?? "",
          inventoryItemId: line.inventoryItemId,
          itemCode: line.itemCode ?? null,
          itemDescription: line.itemDescription ?? "",
          b3Quantity: line.b3Quantity,
          b3ApprovedQuantity: line.b3ApprovedQuantity,
          targetDate: line.targetDate,
          approvalFlag: line.approvalFlag,
          closureFlag: line.closureFlag,
          revision: line.revision,
          parentLineId: line.parentLineId ?? null,
        })),
      }
    : null

  const handleEditClick = useCallback(
    (headerId: number) => {
      loadLinesForEdit(headerId)
    },
    [loadLinesForEdit]
  )

  // Metrics extraction for top indicators dashboard
  const metrics = React.useMemo(() => {
    let req = 0,
      app = 0,
      linesCount = 0
    groupedHeaders.forEach((h) => {
      req += h.totalRequested
      app += h.totalApproved
      linesCount += h.lines.length
    })
    return { linesCount, req, app, unallocated: req - app }
  }, [groupedHeaders])

  return (
    <div className="min-h-screen w-full bg-slate-100 p-4 font-sans text-xs text-slate-700 antialiased">
      {/* Visual KPI Header Grid Section */}
      <div className="mb-4 grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
          <div className="text-[10px] font-semibold text-slate-400 uppercase">
            Total Order Items
          </div>
          <div className="mt-1 text-lg font-bold text-slate-800">
            {metrics.linesCount} lines
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
          <div className="text-[10px] font-semibold text-slate-400 uppercase">
            Requested Quantities
          </div>
          <div className="mt-1 text-lg font-bold text-slate-800">
            {metrics.req.toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
          <div className="text-[10px] font-semibold text-slate-400 uppercase">
            Allocated Approved
          </div>
          <div className="mt-1 text-lg font-bold text-green-600">
            {metrics.app.toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 shadow-xs">
          <div className="text-[10px] font-semibold text-amber-700 uppercase">
            Unallocated Pipeline
          </div>
          <div className="mt-1 text-lg font-bold text-amber-800">
            {metrics.unallocated.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Primary Shared Table System View Container */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loadingRecords ? (
          <div className="animate-pulse p-12 text-center font-medium text-slate-400">
            Downloading record stream pipeline...
          </div>
        ) : (
          <FulfillmentTrackerTable
            headers={groupedHeaders}
            onEditClick={handleEditClick}
          />
        )}
      </div>

      {/* Dynamic Overlay Edit Mutation Modal Drawer Context */}
      {selectedHeaderDetails && (
        <ReviewAllocationModal
          isOpen={!loadingSingle}
          onClose={closeEditModal}
          headerId={selectedHeaderDetails.headerId}
          onSave={(updatedLines) => {
            console.log("Saved lines", updatedLines)
            closeEditModal()
            refreshRecords()
          }}
        />
      )}
    </div>
  )
}
