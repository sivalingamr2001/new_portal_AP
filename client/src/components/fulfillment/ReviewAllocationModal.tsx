import { useAuth } from "@/context/AuthContext";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLoader } from "@/hooks/useLoader";
import { getAllocationByHeaderId, type AmendQuantityRequest } from "@/api/allocationApi";
import { Loader } from "../Loader";
import { toast } from "sonner";
import { useAmendApprovedQuantity } from "@/hooks/useAllocationApi";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** 
 * Closure Flag Status:
 * - "Y" = Cancelled (Line item is closed/cancelled, no further action allowed)
 * - "N" = Active (Line item is still open for processing)
 */
type ClosureFlag = "Y" | "N";

/**
 * Approval Flag Status:
 * - "N" = Pending (Not yet approved, waiting for review)
 * - "A" = Approved (Fully approved)
 * - "P" = Partially Approved (Some quantity approved)
 * - "R" = Rejected (Approval denied)
 */
type ApprovalFlag = "Y" | "N" | "A";

/**
 * Allocation Status at Header Level:
 * - "Pending" = Awaiting review
 * - "In Review" = Currently being reviewed
 * - "Partially Approved" = Some items approved
 * - "Approved" = All items fully approved
 * - "Rejected" = All items rejected
 * - "Cancelled" = Header level cancellation
 */
type AllocationStatus = "Pending" | "Approved" | "Amended" | "Cancelled";

interface AllocationLineItem {
  lineId: number;
  organizationId: number;
  organizationCode: string;
  inventoryItemId: number;
  itemCode: string | null;
  itemDescription: string;
  b3Quantity: number;           // Requested quantity (user editable when Pending)
  b3ApprovedQuantity: number | null;  // Approved/Allocated quantity (HOD only)
  targetDate: string;           // Expected delivery date
  approvalFlag: ApprovalFlag;   // Approval status
  closureFlag: ClosureFlag;     // Cancellation status
  revision: number;             // Revision number for tracking changes
  parentLineId: number | null;  // For tracking line revisions/history
  oldRequestedQty: number | null;    // Original requested quantity before amendment
}

interface AllocationHeaderDetails {
  headerId: number;
  customerId: number | null;
  customerName: string | null;
  billToCustomerId: number | null;
  billToCustomerName: string | null;
  shipToCustomerId: number | null;
  shipToCustomerName: string | null;
  territoryId: number | null;
  customerOrItemSpecific: number | null;  // 0=Customer Specific, 1=Item Specific
  remarks: string | null;
  transactionDate: string;
  createdBy: string;
  createdDate: string;
  updatedBy: string | null;
  updatedDate: string | null;
  totalRequested: number;       // Sum of all line b3Quantity
  totalApproved: number;        // Sum of all line b3ApprovedQuantity
  status: AllocationStatus;
  items: AllocationLineItem[];
}

// ============================================================================
// REASON OPTIONS FOR AMENDMENT
// ============================================================================

const AMENDMENT_REASONS = [
  { value: "", label: "Select Reason..." },
  { value: "Customer Request", label: "Customer Request" },
  { value: "Stock Shortage", label: "Stock Shortage" },
  { value: "Order Error", label: "Order Error" },
  { value: "Demand Change", label: "Demand Change" },
  { value: "Price Revision", label: "Price Revision" },
  { value: "Quality Issue", label: "Quality Issue" },
  { value: "Delivery Issue", label: "Delivery Issue" },
  { value: "Other", label: "Other (Specify)" },
];

// ============================================================================
// LINE ITEM STATUS HELPERS
// ============================================================================

interface LineItemStatus {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  description: string;
}

const getLineItemStatus = (item: AllocationLineItem): LineItemStatus => {
  if (item.closureFlag === "Y") {
    return {
      label: "Cancelled",
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      borderColor: "border-gray-300",
      icon: "✕",
      description: "This line item has been cancelled and is no longer active",
    };
  }

  if (item.approvalFlag === "A") {
    return {
      label: "Amended",
      color: "text-orange-700",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      icon: "✓",
      description: "Fully approved and allocated",
    };
  }

  if (item.approvalFlag === "Y") {
    return {
      label: "Approved",
      color: "text-emerald-700",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      icon: "✓",
      description: "Fully approved and allocated",
    };
  }

  if (item.approvalFlag === "N") {
    return {
      label: "Pending",
      color: "text-blue-700",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      icon: "⏳",
      description: "Awaiting review and approval",
    };
  }

  return {
    label: "Pending",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    icon: "⏳",
    description: "Awaiting review and approval",
  };
};

// ============================================================================
// MODAL PROPS
// ============================================================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  headerId: number;
  onSave: (updatedLines: AllocationLineItem[]) => void;
  onCancelLine?: (lineId: number) => void;
  onApproveLine?: (lineId: number, quantity: number) => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ReviewAllocationModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  headerId,
  onSave,
  onCancelLine,
  onApproveLine,
}) => {
  const { currentUserRole } = useAuth();
  const { loading, withLoader } = useLoader();
  const { execute: amendQuantity } = useAmendApprovedQuantity();

  const [headerData, setHeaderData] = useState<AllocationHeaderDetails | null>(null);
  const [items, setItems] = useState<AllocationLineItem[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "cancelled">("all");
  const [sortConfig, setSortConfig] = useState<{ key: keyof AllocationLineItem; direction: "asc" | "desc" } | null>(null);

  // Track which lines have been modified by the user
  const [modifiedLines, setModifiedLines] = useState<Set<number>>(new Set());

  // Track reasons for each modified line
  const [lineReasons, setLineReasons] = useState<Record<number, { reason: string; otherReason: string }>>({});

  // Check if user is HOD
  const isHod = currentUserRole === "hod";

  // ============================================================================
  // FETCH DATA BY HEADER ID
  // ============================================================================
  useEffect(() => {
    if (!isOpen || !headerId) return;

    const fetchAllocationData = async () => {
      try {
        const data: any = await withLoader(() => getAllocationByHeaderId(headerId));
        setHeaderData(data);
        setItems(JSON.parse(JSON.stringify(data.items)));
        setModifiedLines(new Set());
        setLineReasons({});
      } catch (error) {
        console.error("Failed to fetch allocation data:", error);
        toast.error("Failed to load allocation data");
      }
    };

    fetchAllocationData();
  }, [isOpen, headerId, withLoader]);

  if (!isOpen) return null;

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Handle REQUESTED quantity change
   * RULE: Requested Qty can only be updated if approvalFlag === "N" (Pending)
   */
  const handleRequestedQuantityChange = (lineId: number, value: string) => {
    const numValue = value === "" ? 0 : Math.max(0, parseInt(value, 10) || 0);
    setItems((prev) =>
      prev.map((item) => {
        if (item.lineId !== lineId) return item;
        if (item.approvalFlag !== "N") return item;
        return { ...item, b3Quantity: numValue };
      })
    );
    setModifiedLines((prev) => new Set(prev).add(lineId));
  };

  /**
   * Handle reason change for amendment
   */
  const handleReasonChange = (lineId: number, reason: string) => {
    setLineReasons((prev) => ({
      ...prev,
      [lineId]: { ...prev[lineId], reason, otherReason: reason === "Other" ? prev[lineId]?.otherReason || "" : "" },
    }));
    setModifiedLines((prev) => new Set(prev).add(lineId));
  };

  /**
   * Handle other reason text change
   */
  const handleOtherReasonChange = (lineId: number, otherReason: string) => {
    setLineReasons((prev) => ({
      ...prev,
      [lineId]: { ...prev[lineId], otherReason },
    }));
  };

  /**
   * Handle APPROVED quantity change (HOD only)
   */
  const handleApprovedQuantityChange = (lineId: number, value: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.lineId !== lineId) return item;
        if (!isHod) return item;

        const numValue = value === "" ? null : Math.max(0, parseInt(value, 10) || 0);
        const boundedValue = numValue !== null ? Math.min(item.b3Quantity, numValue) : null;

        let newApprovalFlag: ApprovalFlag = "N";
        if (boundedValue === null || boundedValue === 0) {
          newApprovalFlag = "N";
        } else if (boundedValue === item.b3Quantity) {
          newApprovalFlag = "A";
        }

        return {
          ...item,
          b3ApprovedQuantity: boundedValue,
          approvalFlag: newApprovalFlag,
        };
      })
    );
  };

  /**
   * Handle UPDATE line - Call API to amend quantity with reason
   */
  const handleUpdateLine = useCallback(async (item: AllocationLineItem) => {
    if (item.approvalFlag !== "N") {
      toast.error("Cannot amend quantity. Line is no longer pending.");
      return;
    }

    if (!modifiedLines.has(item.lineId)) {
      toast.info("No changes detected for this line.");
      return;
    }

    const lineReasonData = lineReasons[item.lineId];
    const selectedReason = lineReasonData?.reason || "";
    const otherReasonText = lineReasonData?.otherReason || "";

    // Validate reason is provided
    if (!selectedReason) {
      toast.error("Please select a reason for the amendment.");
      return;
    }

    // If "Other" is selected, custom reason must be provided
    if (selectedReason === "Other" && !otherReasonText.trim()) {
      toast.error("Please specify the reason in the text box.");
      return;
    }

    // Build final reason string
    const finalReason = selectedReason === "Other" ? otherReasonText.trim() : selectedReason;

    const payload: AmendQuantityRequest = {
      lineId: item.lineId,
      amendedQuantity: item.b3Quantity,
      amendedBy: headerData?.createdBy || "current-user",
      revision: item.revision,
      reason: finalReason,
    };

    try {
      await withLoader(async () => amendQuantity(payload));

      toast.success(`Quantity amended for Line #${item.lineId}. Awaiting HOD approval.`);

      setModifiedLines((prev) => {
        const next = new Set(prev);
        next.delete(item.lineId);
        return next;
      });

      setLineReasons((prev) => {
        const next = { ...prev };
        delete next[item.lineId];
        return next;
      });

      const refreshedData: any = await getAllocationByHeaderId(headerId);
      setHeaderData(refreshedData);
      setItems(JSON.parse(JSON.stringify(refreshedData.items)));

    } catch (error) {
      console.error("Failed to amend quantity:", error);
      toast.error("Failed to submit quantity amendment.");
    }
  }, [amendQuantity, headerData, headerId, modifiedLines, lineReasons, withLoader]);

  const handleCancelLine = (lineId: number) => {
    if (window.confirm("Are you sure you want to cancel this line item?")) {
      setItems((prev) =>
        prev.map((item) =>
          item.lineId === lineId
            ? { ...item, closureFlag: "Y" as ClosureFlag, b3ApprovedQuantity: 0, approvalFlag: "R" as ApprovalFlag }
            : item
        )
      );
      onCancelLine?.(lineId);
    }
  };

  const handleApproveLine = (lineId: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.lineId === lineId
          ? { ...item, b3ApprovedQuantity: item.b3Quantity, approvalFlag: "A" as ApprovalFlag }
          : item
      )
    );
    onApproveLine?.(lineId, items.find((i) => i.lineId === lineId)?.b3Quantity || 0);
  };

  const handleSort = (key: keyof AllocationLineItem) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const filteredItems = useMemo(() => {
    let filtered = [...items];

    if (activeTab === "pending") {
      filtered = filtered.filter((i) => i.approvalFlag === "N" && i.closureFlag === "N");
    } else if (activeTab === "approved") {
      filtered = filtered.filter((i) => (i.approvalFlag === "A") && i.closureFlag === "N");
    } else if (activeTab === "cancelled") {
      filtered = filtered.filter((i) => i.closureFlag === "Y");
    }

    if (sortConfig) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal === null || bVal === null) return 0;
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [items, activeTab, sortConfig]);

  const totalCurrentApproved = items.reduce((acc, curr) => acc + (curr.b3ApprovedQuantity || 0), 0);
  const totalCurrentRequested = items.reduce((acc, curr) => acc + curr.b3Quantity, 0);
  const currentFillRate = totalCurrentRequested > 0 ? Math.round((totalCurrentApproved / totalCurrentRequested) * 100) : 0;

  const cancelledCount = items.filter((i) => i.closureFlag === "Y").length;
  const approvedCount = items.filter((i) => i.approvalFlag === "A" && i.closureFlag === "N").length;
  const pendingCount = items.filter((i) => i.approvalFlag === "N" && i.closureFlag === "N").length;
  const partiallyApprovedCount = items.filter((i) => i.closureFlag === "N").length;

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getHeaderStatusColor = () => {
    if (currentFillRate === 100 && cancelledCount === 0) return "bg-emerald-50 border-emerald-200 text-emerald-700";
    if (currentFillRate === 0 && cancelledCount === items.length) return "bg-gray-50 border-gray-200 text-gray-700";
    if (currentFillRate > 0) return "bg-amber-50 border-amber-200 text-amber-700";
    return "bg-rose-50 border-rose-200 text-rose-700";
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getDaysRemaining = (targetDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col relative">

        {/* ===== LOADER OVERLAY ===== */}
        {loading && (
          <div className="absolute inset-0 z-60 bg-white/80 flex items-center justify-center rounded-xl">
            <Loader />
          </div>
        )}

        {/* ===== HEADER SECTION ===== */}
        <div className="bg-muted text-foreground p-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">Allocation Review</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getHeaderStatusColor()}`}>
                  {currentFillRate === 100 ? "Fully Allocated" : currentFillRate > 0 ? "Partially Allocated" : "Pending Allocation"}
                </span>
              </div>
              <p className="text-slate-300 text-sm">Header ID: <span className="font-mono text-white">#{headerData?.headerId || headerId}</span></p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Customer Info Cards */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Bill To Customer</p>
              <p className="font-semibold text-sm">{headerData?.billToCustomerName || "—"}</p>
              <p className="text-slate-400 text-xs mt-1">ID: {headerData?.billToCustomerId || "—"}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Ship To Customer</p>
              <p className="font-semibold text-sm">{headerData?.shipToCustomerName || "—"}</p>
              <p className="text-slate-400 text-xs mt-1">ID: {headerData?.shipToCustomerId || "—"}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Transaction Date</p>
              <p className="font-semibold text-sm">{headerData?.transactionDate ? formatDate(headerData.transactionDate) : "—"}</p>
              <p className="text-slate-400 text-xs mt-1">Created by: {headerData?.createdBy || "—"}</p>
            </div>
          </div>
        </div>

        {/* ===== METRICS BAR ===== */}
        <div className="bg-slate-50 border-b border-slate-200 p-4">
          <div className="grid grid-cols-6 gap-4">
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Fill Rate</p>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-800">{currentFillRate}%</span>
                <div className="flex-1 h-2 bg-slate-200 rounded-full mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${currentFillRate === 100 ? "bg-emerald-500" : currentFillRate > 0 ? "bg-amber-500" : "bg-rose-500"}`}
                    style={{ width: `${currentFillRate}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Total Requested</p>
              <p className="text-2xl font-bold text-slate-800">{totalCurrentRequested.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Total Approved</p>
              <p className="text-2xl font-bold text-emerald-600">{totalCurrentApproved.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Pending</p>
              <p className="text-2xl font-bold text-blue-600">{pendingCount}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Approved Lines</p>
              <p className="text-2xl font-bold text-emerald-600">{approvedCount}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Cancelled</p>
              <p className="text-2xl font-bold text-gray-600">{cancelledCount}</p>
            </div>
          </div>
        </div>

        {/* ===== TABS & REMARKS ===== */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
              {(["all", "pending", "approved", "cancelled"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                    }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  <span className="ml-2 text-xs bg-slate-200 px-2 py-0.5 rounded-full">
                    {tab === "all" ? items.length : tab === "pending" ? pendingCount : tab === "approved" ? approvedCount + partiallyApprovedCount : cancelledCount}
                  </span>
                </button>
              ))}
            </div>
            {headerData?.remarks && (
              <div className="text-sm text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                <span className="font-semibold">Remarks:</span> {headerData.remarks}
              </div>
            )}
          </div>
        </div>

        {/* ===== LINE ITEMS TABLE ===== */}
        <div className="flex-1 overflow-auto p-6">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50 sticky top-0">
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="p-3 font-semibold cursor-pointer hover:bg-slate-100" onClick={() => handleSort("lineId")}>
                  Line ID {sortConfig?.key === "lineId" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th className="p-3 font-semibold">Organization</th>
                <th className="p-3 font-semibold">Item Details</th>
                <th className="p-3 font-semibold text-right">Requested Qty</th>
                <th className="p-3 font-semibold text-right">Approved Qty</th>
                <th className="p-3 font-semibold text-center">Fill %</th>
                <th className="p-3 font-semibold">Target Date</th>
                <th className="p-3 font-semibold text-center">Status</th>
                <th className="p-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const status = getLineItemStatus(item);
                const fillPercentage = item.b3Quantity > 0
                  ? Math.round(((item.b3ApprovedQuantity || 0) / item.b3Quantity) * 100)
                  : 0;
                const daysRemaining = getDaysRemaining(item.targetDate);
                const isCancelled = item.closureFlag === "Y";
                const isFullyApproved = item.approvalFlag === "Y";
                const isPending = item.approvalFlag === "N";
                const canEditRequestedQty = isPending;
                const canEditApprovedQty = isHod;
                const hasBeenModified = modifiedLines.has(item.lineId);
                const lineReasonData = lineReasons[item.lineId];
                const selectedReason = lineReasonData?.reason || "";
                const showReasonInput = hasBeenModified && !isHod && isPending;

                return (
                  <React.Fragment key={item.lineId}>
                    <tr
                      className={`hover:bg-slate-50 transition-colors ${isCancelled ? "opacity-60 bg-gray-50" : ""}`}
                    >
                      {/* Line ID */}
                      <td className="p-3">
                        <span className="font-mono text-sm text-slate-600">#{item.lineId}</span>
                        {item.revision > 0 && (
                          <span className="ml-1 text-xs text-slate-400">v{item.revision}</span>
                        )}
                      </td>

                      {/* Organization */}
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-mono font-semibold">
                            {item.organizationCode}
                          </span>
                          <span className="text-xs text-slate-400">ID: {item.organizationId}</span>
                        </div>
                      </td>

                      {/* Item Details */}
                      <td className="p-3">
                        <div>
                          <p className="font-medium text-sm text-slate-800">
                            {item.itemDescription !== "N/A" ? item.itemDescription : "—"}
                          </p>
                          {item.itemCode && (
                            <p className="text-xs text-slate-500 font-mono mt-0.5">{item.itemCode}</p>
                          )}
                          <p className="text-xs text-slate-400 mt-0.5">Inv ID: {item.inventoryItemId}</p>
                        </div>
                      </td>

                      {/* Requested Qty - Editable ONLY when Pending */}
                      <td className="p-3 text-right">
                        {canEditRequestedQty ? (
                          <div className="flex flex-col items-end gap-1">
                            <input
                              type="number"
                              min="1"
                              value={item.b3Quantity}
                              onChange={(e) => handleRequestedQuantityChange(item.lineId, e.target.value)}
                              className={`w-24 text-right px-2 py-1.5 rounded border text-sm font-semibold outline-none transition-all ${hasBeenModified
                                ? "border-amber-400 bg-amber-50 text-amber-700 ring-1 ring-amber-300"
                                : "border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                }`}
                              placeholder="0"
                            />
                            {hasBeenModified && (
                              <span className="text-[10px] text-amber-600 font-medium">Modified</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-end justify-center">
                            {isCancelled ? (
                              /* If item is cancelled, render the current quantity with a plain grey strikethrough */
                              <span className="text-sm font-semibold text-gray-400 line-through">
                                {item.b3Quantity?.toLocaleString() || 0}
                              </span>
                            ) : item.oldRequestedQty !== null && item.oldRequestedQty !== undefined && item.oldRequestedQty !== item.b3Quantity ? (
                              /* 💡 If an old history value exists and differs, show comparative variance inline */
                              <div className="flex items-center justify-end gap-1.5 font-mono font-bold whitespace-nowrap text-sm">
                                {/* Old Quantity - Red Strikethrough */}
                                <span className="text-red-500 line-through">
                                  {item.oldRequestedQty.toLocaleString()}
                                </span>
                                {/* Decorative directional separator arrow */}
                                <span className="text-[11px] text-slate-400 font-normal">→</span>
                                {/* New Quantity - Solid Green text */}
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  {item.b3Quantity?.toLocaleString() || 0}
                                </span>
                              </div>
                            ) : (
                              /* Standard structural fallback text layout */
                              <span className="text-sm font-semibold text-slate-700">
                                {item.b3Quantity?.toLocaleString() || 0}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Approved Qty - Editable by HOD only */}
                      <td className="p-3 text-right">
                        {canEditApprovedQty && !isCancelled ? (
                          <input
                            type="number"
                            min="0"
                            max={item.b3Quantity}
                            value={item.b3ApprovedQuantity ?? ""}
                            onChange={(e) => handleApprovedQuantityChange(item.lineId, e.target.value)}
                            className={`w-24 text-right px-2 py-1.5 rounded border text-sm font-semibold transition-all ${isFullyApproved
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                              : item.b3ApprovedQuantity && item.b3ApprovedQuantity > 0
                                ? "border-amber-300 bg-amber-50 text-amber-700"
                                : "border-slate-300 bg-white text-slate-700"
                              }`}
                            placeholder="0"
                            disabled={isCancelled || item.approvalFlag === "Y"}
                          />
                        ) : (
                          <span className={`text-sm font-semibold ${isCancelled ? "text-gray-400 line-through" :
                            isFullyApproved ? "text-emerald-700" :
                              item.b3ApprovedQuantity && item.b3ApprovedQuantity > 0 ? "text-amber-700" :
                                "text-slate-700"
                            }`}>
                            {(item.b3ApprovedQuantity ?? 0).toLocaleString()}
                          </span>
                        )}
                      </td>

                      {/* Fill Percentage */}
                      <td className="p-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`text-xs font-bold ${fillPercentage === 100 ? "text-emerald-600" : fillPercentage > 0 ? "text-amber-600" : "text-slate-400"}`}>
                            {fillPercentage}%
                          </span>
                          <div className="w-12 h-1.5 bg-slate-200 rounded-full mt-1">
                            <div
                              className={`h-full rounded-full ${fillPercentage === 100 ? "bg-emerald-500" : fillPercentage > 0 ? "bg-amber-500" : "bg-slate-300"}`}
                              style={{ width: `${fillPercentage}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Target Date */}
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-700">{formatDate(item.targetDate)}</span>
                          <span className={`text-xs ${daysRemaining < 0 ? "text-rose-500 font-semibold" : daysRemaining <= 7 ? "text-amber-600" : "text-slate-400"}`}>
                            {daysRemaining < 0 ? `Overdue by ${Math.abs(daysRemaining)} days` : `${daysRemaining} days remaining`}
                          </span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="p-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${status.bgColor} ${status.color} ${status.borderColor}`}>
                            <span>{status.icon}</span>
                            {status.label}
                          </span>
                          <span className="text-[10px] text-slate-400 max-w-30 leading-tight">{status.description}</span>
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td className="p-3 text-center">
                        {/* Non-HOD: Show Update button for pending lines that have been modified */}
                        {!isHod && isPending && !isCancelled && (
                          <button
                            onClick={() => handleUpdateLine(item)}
                            disabled={!hasBeenModified || loading}
                            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${hasBeenModified
                              ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                              : "bg-slate-100 text-slate-400 cursor-not-allowed"
                              }`}
                            title={hasBeenModified ? "Submit quantity amendment" : "No changes to submit"}
                          >
                            {loading ? "Updating..." : "Update"}
                          </button>
                        )}

                        {/* Non-HOD: No actions for non-pending lines */}
                        {!isHod && !isPending && (
                          <span className="text-xs text-slate-400">—</span>
                        )}

                        {/* HOD: Show Approve/Cancel for pending lines */}
                        {isHod && isPending && !isCancelled && (
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={() => handleApproveLine(item.lineId)}
                              className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs font-semibold hover:bg-emerald-100 transition-colors"
                              title="Approve full quantity"
                            >
                              Approve All
                            </button>
                            <button
                              onClick={() => handleCancelLine(item.lineId)}
                              className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded text-xs font-semibold hover:bg-rose-100 transition-colors"
                              title="Cancel this line"
                            >
                              Cancel
                            </button>
                          </div>
                        )}

                        {/* HOD: Show status for already processed lines */}
                        {isHod && !isPending && !isCancelled && (
                          <span className="text-xs text-slate-500 font-medium">
                            {isFullyApproved ? "✓ Approved" : "✕ Rejected"}
                          </span>
                        )}

                        {/* Cancelled lines */}
                        {isCancelled && (
                          <span className="text-xs text-gray-500">— Cancelled —</span>
                        )}
                      </td>
                    </tr>

                    {/* REASON ROW - Shows when user has modified quantity and needs to provide reason */}
                    {showReasonInput && (
                      <tr className="bg-amber-50/50">
                        <td colSpan={9} className="px-3 py-2">
                          <div className="flex items-center gap-3 pl-[calc(16.66%+12px)]">
                            <span className="text-xs font-semibold text-amber-700 whitespace-nowrap">
                              Amendment Reason:
                            </span>
                            <select
                              value={selectedReason}
                              onChange={(e) => handleReasonChange(item.lineId, e.target.value)}
                              className="text-xs px-2 py-1.5 rounded border border-amber-300 bg-white text-slate-700 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none min-w-40"
                            >
                              {AMENDMENT_REASONS.map((r) => (
                                <option key={r.value} value={r.value}>
                                  {r.label}
                                </option>
                              ))}
                            </select>

                            {/* Show text input when "Other" is selected */}
                            {selectedReason === "Other" && (
                              <input
                                type="text"
                                value={lineReasonData?.otherReason || ""}
                                onChange={(e) => handleOtherReasonChange(item.lineId, e.target.value)}
                                placeholder="Please specify reason..."
                                className="text-xs px-2 py-1.5 rounded border border-amber-300 bg-white text-slate-700 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none flex-1 max-w-xs"
                              />
                            )}

                            {selectedReason && selectedReason !== "" && (
                              <span className="text-[10px] text-amber-600">
                                Required for submission
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {filteredItems.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <p className="text-lg">No items found in this category</p>
            </div>
          )}
        </div>

        {/* ===== FOOTER ===== */}
        <div className="border-t border-slate-200 p-4 bg-slate-50 flex justify-between items-center">
          <div className="text-sm text-slate-500">
            <span className="font-semibold">{items.length}</span> total line items |
            Last updated: {headerData?.updatedDate ? formatDate(headerData.updatedDate) : "—"} by {headerData?.updatedBy || headerData?.createdBy || "—"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewAllocationModal;