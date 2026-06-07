using Server.Core.Domain.Dto;
using Server.Core.Domain.Enums;

namespace Server.Core.Interfaces;

/// <summary>
/// Full lifecycle contract for the multi-gate, multi-item folder access request state machine.
/// Stages: Submit → HOD Approve/Reject → IT Provision/Reject → Active (90 days) → Expire/Renew/Revoke
/// </summary>
public interface IAccessRequestWorkflow
{
    // ── Queries ──────────────────────────────────────────────────────────────────

    /// <summary>
    /// Paginated list of ALL access items (Admin / IT view).
    /// Supports optional status filter and search against ticket number or folder path.
    /// </summary>
    Task<PaginatedListDto<AccessRequestSummaryDto>> GetAllRequestsAsync(
        int pageNumber, int pageSize,
        RequestStatus? statusFilter = null,
        string? search = null);

    /// <summary>
    /// All access items submitted by a specific user (the requester's own history).
    /// </summary>
    Task<PaginatedListDto<AccessRequestSummaryDto>> GetRequestsByUserIdAsync(
        int userId, int pageNumber, int pageSize,
        RequestStatus? statusFilter = null);

    /// <summary>
    /// All access items raised by users belonging to a specific department.
    /// Used by a HOD to review their team's request queue.
    /// </summary>
    Task<PaginatedListDto<AccessRequestSummaryDto>> GetRequestsByDepartmentAsync(
        int departmentId, int pageNumber, int pageSize,
        RequestStatus? statusFilter = null);

    /// <summary>
    /// All access items targeting folders owned (primary or secondary) by a given HOD.
    /// Used by a folder-owner HOD to see what awaits their data-owner approval.
    /// </summary>
    Task<PaginatedListDto<AccessRequestSummaryDto>> GetRequestsByFolderOwnerAsync(
        int hodUserId, int pageNumber, int pageSize,
        RequestStatus? statusFilter = null);

    // ── Stage 0: Create ──────────────────────────────────────────────────────────

    /// <summary>
    /// Submits a new multi-folder access request batch.
    /// Generates sequential ticket numbers (REQ-YYYYMM-NNN) and notifies the
    /// requester's direct HOD plus any cross-department folder-owner HODs.
    /// </summary>
    Task<int> CreateMultiItemRequestAsync(
        int requesterUserId,
        List<(string FolderPath, AccessTypes AccessType, string Reason)> items,
        bool isAgreed = true,
        string itsrNo = "");

    // ── Stage 1: HOD Approve / Reject ────────────────────────────────────────────

    /// <summary>
    /// Processes a HOD or folder-owner decision (Approved → IT queue | Rejected → closed).
    /// Notifies the requester on rejection and IT on approval.
    /// </summary>
    Task ProcessItemApprovalAsync(
        int currentApproverId, int accessItemId,
        RequestStatus decision, string comments);

    // ── Stage 2: IT Provision / Reject ───────────────────────────────────────────

    /// <summary>
    /// IT agent closes out provisioning. On Completed, sets a 90-day AccessTo window
    /// and notifies the requester. On Rejected, closes the item and notifies the requester.
    /// </summary>
    Task FinalizeItemProvisioningAsync(
        int itAgentUserId, int accessItemId,
        RequestStatus finalDecision, AccessTypes confirmedAccessType,
        string operationalComments);

    // ── Ad-hoc: Revoke ────────────────────────────────────────────────────────────

    /// <summary>
    /// IT agent force-terminates an active (Completed) access item.
    /// Notifies the requester and folder-owner HOD.
    /// </summary>
    Task RevokeAccessAsync(int itAgentUserId, int accessItemId, string revocationReason);

    // ── Ad-hoc: Renew ─────────────────────────────────────────────────────────────

    /// <summary>
    /// IT agent extends a Completed access item by another 90 calendar days.
    /// Notifies the requester and folder-owner HOD.
    /// </summary>
    Task RenewAccessAsync(int itAgentUserId, int accessItemId, string renewalNotes);

    // ── Lifecycle: Resubmit ──────────────────────────────────────────────────────

    /// <summary>
    /// Clones a Rejected, Revoked, or Expired item into a fresh workflow cycle.
    /// Requester identity is enforced; active/pending items are blocked.
    /// Returns the new master AccessRequest ID.
    /// </summary>
    Task<int> ResubmitExpiredOrFailedRequestAsync(
        int requesterUserId, int historicalAccessItemId,
        string? updatedReasonIfAny = null);

    // ── Lifecycle: Expire (called by background job) ─────────────────────────────

    /// <summary>
    /// Marks a Completed item as Expired and dispatches notifications.
    /// Idempotent — safe to call if already expired.
    /// </summary>
    Task ExpireAccessItemAsync(int accessItemId);
}