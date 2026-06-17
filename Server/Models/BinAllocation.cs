// ---------------------------------------------------------------
// File: Models/BinAllocationModels.cs
// ---------------------------------------------------------------
namespace Backend.Models
{
    // ── Header ──────────────────────────────────────────────────
    public class B3Header
    {
        public decimal HeaderId { get; set; }
        public DateTime TransactionDate { get; set; }
        public decimal? CustomerOrItemSpecific { get; set; }
        public decimal? CustomerId { get; set; }
        public decimal? TerritoryId { get; set; }
        public decimal? BillToCustomer { get; set; }
        public decimal? ShipToCustomer { get; set; }
        public string CreatedBy { get; set; }
        public DateTime CreatedDate { get; set; }
        public string UpdatedBy { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public string Remarks { get; set; }
    }

    // ── Line ────────────────────────────────────────────────────
    public class B3Line
    {
        public decimal LineId { get; set; }
        public decimal HeaderId { get; set; }
        public decimal? OrganizationId { get; set; }
        public decimal InventoryItemId { get; set; }
        public decimal B3Quantity { get; set; }
        public DateTime? TargetDate { get; set; }
        public decimal? B3ApprovedQuantity { get; set; }
        public string ApprovalFlag { get; set; }   // 'Y' | 'N'
        public DateTime? ApprovedDate { get; set; }
        public string ApprovedBy { get; set; }
        public string ClosureFlag { get; set; }   // 'Y' | 'N'
        public decimal Revision { get; set; }
        public decimal? ParentLineId { get; set; }
    }

    // ── Cancellation ────────────────────────────────────────────
    public class B3Cancellation
    {
        public decimal CancelId { get; set; }
        public decimal LineId { get; set; }
        public decimal CancelledQty { get; set; }
        public DateTime CancelledDate { get; set; }
        public string CancelReason { get; set; }
        public string CreatedBy { get; set; }
        public DateTime CreatedDate { get; set; }
    }

    // ── Flat result row (Header + Line joined) ───────────────────
    public class AllocationRow : B3Header
    {
        public decimal LineId { get; set; }
        public decimal? OrganizationId { get; set; }
        public decimal InventoryItemId { get; set; }
        public decimal B3Quantity { get; set; }
        public DateTime? TargetDate { get; set; }
        public decimal? B3ApprovedQuantity { get; set; }
        public string ApprovalFlag { get; set; }
        public DateTime? ApprovedDate { get; set; }
        public string ApprovedBy { get; set; }
        public string ClosureFlag { get; set; }
        public decimal Revision { get; set; }
    }

    // ── Summary row ─────────────────────────────────────────────
    public class AllocationSummary
    {
        public decimal HeaderId { get; set; }
        public DateTime TransactionDate { get; set; }
        public decimal? CustomerId { get; set; }
        public int TotalLines { get; set; }
        public decimal TotalRequestedQty { get; set; }
        public decimal TotalApprovedQty { get; set; }
        public int ApprovedLines { get; set; }
        public int PendingLines { get; set; }
        public int CancelledLines { get; set; }
    }

    // ── Request DTOs ─────────────────────────────────────────────
    public class CreateAllocationRequestV2
    {
        public DateTime TransactionDate { get; set; }
        public decimal? CustomerOrItemSpecific { get; set; }
        public decimal? CustomerId { get; set; }
        public decimal? TerritoryId { get; set; }
        public decimal? BillToCustomer { get; set; }
        public decimal? ShipToCustomer { get; set; }
        public string CreatedBy { get; set; }
        public string Remarks { get; set; }
        public List<CreateLineRequest> Lines { get; set; }
    }

    public class CreateLineRequest
    {
        public decimal? OrganizationId { get; set; }
        public decimal InventoryItemId { get; set; }
        public decimal B3Quantity { get; set; }
        public DateTime? TargetDate { get; set; }
    }

    public class ReviseQuantityRequest
    {
        public decimal OriginalLineId { get; set; }
        public decimal NewB3Quantity { get; set; }
    }

    public class ApproveLineRequest
    {
        public decimal LineId { get; set; }
        public decimal ApprovedQuantity { get; set; }
        public string ApprovedBy { get; set; }
    }

    public class AmendQuantityRequest
    {
        public decimal LineId { get; set; }
        public decimal AmendedQuantity { get; set; }
        public string AmendedBy { get; set; }
    }

    public class CancelLineRequest
    {
        public decimal LineId { get; set; }
        public decimal CancelledQty { get; set; }
        public string CancelReason { get; set; }
        public string CreatedBy { get; set; }
    }

    public class CancelHeaderRequest
    {
        public decimal HeaderId { get; set; }
        public string CancelReason { get; set; }
        public string CreatedBy { get; set; }
    }
}