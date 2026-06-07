using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Server.Core.Domain.Dto;
using Server.Core.Domain.Entities;
using Server.Core.Domain.Enums;
using Server.Core.Interfaces;
using Server.Infrastructure.Data;

namespace Server.Infrastructure.Services;

// ══════════════════════════════════════════════════════════════════════════════════
//  ACCESS REQUEST WORKFLOW SERVICE
//  Implements the full multi-gate lifecycle:
//  User → HOD Approval → IT Provisioning → Active (90 days) → Expired / Renewed
// ══════════════════════════════════════════════════════════════════════════════════

public sealed class AccessRequestWorkflow(
    AppDbContext appDb,
    IdentityDbContext identityDb) : IAccessRequestWorkflow
{
    private const string ItRoleGroupName  = "IT";
    private const string HodRoleName      = "Hod";
    private const string UserRoleName     = "User";
    private const int    AccessValidDays  = 90;

    private static readonly SemaphoreSlim TicketSemaphore = new(1, 1);

    // ──────────────────────────────────────────────────────────────────────────────
    // QUERIES
    // ──────────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Returns a paginated list of ALL access requests visible to administrators / IT.
    /// Supports optional status filter and search against folder path or ticket number.
    /// </summary>
    public async Task<PaginatedListDto<AccessRequestSummaryDto>> GetAllRequestsAsync(
        int pageNumber, int pageSize,
        RequestStatus? statusFilter = null,
        string? search = null)
    {
        var query = appDb.AccessItems
            .Include(ai => ai.AccessRequest)
            .AsNoTracking()
            .Where(ai => ai.IsActive);

        if (statusFilter.HasValue)
            query = query.Where(ai => ai.Status == statusFilter.Value);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(ai =>
                ai.TicketNumber.Contains(search) ||
                ai.FolderPath.Contains(search));

        int total = await query.CountAsync();

        var items = await query
            .OrderByDescending(ai => ai.CreatedOn)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var requesterIds = items.Select(ai => ai.AccessRequest.UserId).Distinct().ToList();
        var requesterProfiles = await identityDb.Users
            .AsNoTracking()
            .Where(u => requesterIds.Contains(u.UserId))
            .ToDictionaryAsync(u => u.UserId, u => u.UserName);

        var dtos = items.Select(ai => MapToSummaryDto(ai, requesterProfiles)).ToList();
        return new PaginatedListDto<AccessRequestSummaryDto>(dtos, total, pageNumber, pageSize);
    }

    /// <summary>
    /// Returns all access items raised by a specific user (the requester's own history).
    /// </summary>
    public async Task<PaginatedListDto<AccessRequestSummaryDto>> GetRequestsByUserIdAsync(
        int userId, int pageNumber, int pageSize,
        RequestStatus? statusFilter = null)
    {
        var query = appDb.AccessItems
            .Include(ai => ai.AccessRequest)
            .AsNoTracking()
            .Where(ai => ai.IsActive && ai.AccessRequest.UserId == userId);

        if (statusFilter.HasValue)
            query = query.Where(ai => ai.Status == statusFilter.Value);

        int total = await query.CountAsync();

        var items = await query
            .OrderByDescending(ai => ai.CreatedOn)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = items.Select(ai => MapToSummaryDto(ai, userId, null)).ToList();
        return new PaginatedListDto<AccessRequestSummaryDto>(dtos, total, pageNumber, pageSize);
    }

    /// <summary>
    /// Returns all access items whose requester belongs to a given department.
    /// Used by HODs to see their entire department's request queue.
    /// </summary>
    public async Task<PaginatedListDto<AccessRequestSummaryDto>> GetRequestsByDepartmentAsync(
        int departmentId, int pageNumber, int pageSize,
        RequestStatus? statusFilter = null)
    {
        // Materialise department members first (cross-db join not supported by EF)
        var deptMemberIds = await identityDb.Users
            .AsNoTracking()
            .Where(u => u.DeptId == departmentId)
            .Select(u => u.UserId)
            .ToListAsync();

        var query = appDb.AccessItems
            .Include(ai => ai.AccessRequest)
            .AsNoTracking()
            .Where(ai => ai.IsActive && deptMemberIds.Contains(ai.AccessRequest.UserId));

        if (statusFilter.HasValue)
            query = query.Where(ai => ai.Status == statusFilter.Value);

        int total = await query.CountAsync();

        var items = await query
            .OrderByDescending(ai => ai.CreatedOn)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var requesterIds = items.Select(ai => ai.AccessRequest.UserId).Distinct().ToList();
        var requesterProfiles = await identityDb.Users
            .AsNoTracking()
            .Where(u => requesterIds.Contains(u.UserId))
            .ToDictionaryAsync(u => u.UserId, u => u.UserName);

        var dtos = items.Select(ai => MapToSummaryDto(ai, requesterProfiles)).ToList();
        return new PaginatedListDto<AccessRequestSummaryDto>(dtos, total, pageNumber, pageSize);
    }

    /// <summary>
    /// Returns all access items targeting folders owned by a specific HOD (primary or secondary).
    /// Used by a folder-owner HOD to see what needs their approval.
    /// </summary>
    public async Task<PaginatedListDto<AccessRequestSummaryDto>> GetRequestsByFolderOwnerAsync(
        int hodUserId, int pageNumber, int pageSize,
        RequestStatus? statusFilter = null)
    {
        // Resolve folder paths owned by this HOD
        var ownedFolderNames = await appDb.FolderMappings
            .AsNoTracking()
            .Where(f => f.IsActive &&
                        (f.PrimaryHodId == hodUserId || f.SecondaryHodId == hodUserId))
            .Select(f => f.FolderName)
            .ToListAsync();

        if (ownedFolderNames.Count == 0)
            return new PaginatedListDto<AccessRequestSummaryDto>([], 0, pageNumber, pageSize);

        // EF cannot translate StartsWith with a variable list — materialise and filter in memory
        var rawItems = await appDb.AccessItems
            .Include(ai => ai.AccessRequest)
            .AsNoTracking()
            .Where(ai => ai.IsActive)
            .ToListAsync();

        var filtered = rawItems
            .Where(ai => ownedFolderNames.Any(fn => ai.FolderPath.StartsWith(fn)))
            .AsQueryable();

        if (statusFilter.HasValue)
            filtered = filtered.Where(ai => ai.Status == statusFilter.Value);

        var orderedList = filtered
            .OrderByDescending(ai => ai.CreatedOn)
            .ToList();

        int total = orderedList.Count;
        var page = orderedList
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        var requesterIds = page.Select(ai => ai.AccessRequest.UserId).Distinct().ToList();
        var requesterProfiles = await identityDb.Users
            .AsNoTracking()
            .Where(u => requesterIds.Contains(u.UserId))
            .ToDictionaryAsync(u => u.UserId, u => u.UserName);

        var dtos = page.Select(ai => MapToSummaryDto(ai, requesterProfiles)).ToList();
        return new PaginatedListDto<AccessRequestSummaryDto>(dtos, total, pageNumber, pageSize);
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // STAGE 0 — CREATE
    // ──────────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Registers a new multi-item access request batch.
    /// Notifies the user's direct HOD (and folder-owner HOD where cross-department).
    /// </summary>
    public async Task<int> CreateMultiItemRequestAsync(
        int requesterUserId,
        List<(string FolderPath, AccessTypes AccessType, string Reason)> items,
        bool isAgreed = true,
        string itsrNo = "")
    {
        if (items is null || items.Count == 0)
            throw new ArgumentException("Workflow Abort: Submission must contain at least one folder item.");

        if (string.IsNullOrWhiteSpace(itsrNo))
            throw new ArgumentException("ITSR number is required.", nameof(itsrNo));

        var userAccount = await identityDb.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserId == requesterUserId)
            ?? throw new KeyNotFoundException($"User #{requesterUserId} not found.");

        if (userAccount.DeptId is null)
            throw new InvalidOperationException($"User '{userAccount.UserName}' is not linked to a department.");

        var userDepartment = await appDb.Departments
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.DepartmentId == userAccount.DeptId)
            ?? throw new InvalidOperationException($"Department #{userAccount.DeptId} not found.");

        int userDirectHodId = userDepartment.HodId ?? 0;
        if (userDirectHodId == 0)
            throw new InvalidOperationException("Requester's department has no active HOD assigned.");

        var userDirectHodProfile = await identityDb.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserId == userDirectHodId);

        using var transaction = await appDb.Database.BeginTransactionAsync();
        try
        {
            var accessRequest = new AccessRequestEntity
            {
                UserId   = requesterUserId,
                ReqTo    = userDirectHodId,
                IsAgreed = isAgreed,
                ItsrNo   = itsrNo
            };
            appDb.AccessRequests.Add(accessRequest);
            await appDb.SaveChangesAsync();

            foreach (var item in items)
            {
                var folderMapping = await appDb.FolderMappings
                    .AsNoTracking()
                    .FirstOrDefaultAsync(f => item.FolderPath.StartsWith(f.FolderName))
                    ?? throw new KeyNotFoundException(
                        $"Path '{item.FolderPath}' does not map to any registered folder.");

                int folderOwnerHodId   = folderMapping.PrimaryHodId ?? 0;
                string ticketNumber    = await GenerateNextTicketNumberSequenceAsync();

                var accessItem = new AccessItemEntity
                {
                    AccessReqId       = accessRequest.AccessReqId,
                    TicketNumber      = ticketNumber,
                    FolderPath        = item.FolderPath,
                    Reason            = item.Reason,
                    AccessType        = item.AccessType,
                    ConfirmAccessType = item.AccessType,
                    Status            = RequestStatus.Pending
                };
                appDb.AccessItems.Add(accessItem);
                await appDb.SaveChangesAsync();

                // ── Notify requester: submission confirmed ──────────────────────
                appDb.AccessReqAudits.Add(new AccessReqAuditEntity
                {
                    AccessReqId     = accessRequest.AccessReqId,
                    AccessItemId    = accessItem.AccessItemId,
                    EventType       = "REQUEST_SUBMITTED",
                    Message         = $"Your access request ticket {ticketNumber} for '{item.FolderPath}' has been submitted and is awaiting HOD approval.",
                    RecipientUserId = requesterUserId,
                    RecipientName   = userAccount.UserName ?? "Requester",
                    RecipientRole   = UserRoleName,
                    IsRead          = false
                });

                // ── Notify direct HOD ───────────────────────────────────────────
                appDb.AccessReqAudits.Add(new AccessReqAuditEntity
                {
                    AccessReqId     = accessRequest.AccessReqId,
                    AccessItemId    = accessItem.AccessItemId,
                    EventType       = "HOD_PENDING",
                    Message         = $"Ticket {ticketNumber} from {userAccount.UserName} requires your approval for folder '{item.FolderPath}'.",
                    RecipientUserId = userDirectHodId,
                    RecipientName   = userDirectHodProfile?.UserName ?? "HOD",
                    RecipientRole   = HodRoleName,
                    IsRead          = false
                });

                // ── Notify folder-owner HOD if cross-department ─────────────────
                if (folderOwnerHodId != userDirectHodId && folderOwnerHodId != 0)
                {
                    var folderHodProfile = await identityDb.Users
                        .AsNoTracking()
                        .FirstOrDefaultAsync(u => u.UserId == folderOwnerHodId);

                    appDb.AccessReqAudits.Add(new AccessReqAuditEntity
                    {
                        AccessReqId     = accessRequest.AccessReqId,
                        AccessItemId    = accessItem.AccessItemId,
                        EventType       = "OWNER_PENDING",
                        Message         = $"Cross-department ticket {ticketNumber} by {userAccount.UserName} requires your data-owner approval for '{item.FolderPath}'.",
                        RecipientUserId = folderOwnerHodId,
                        RecipientName   = folderHodProfile?.UserName ?? folderMapping.PrimaryHodName ?? "Folder Owner",
                        RecipientRole   = HodRoleName,
                        IsRead          = false
                    });
                }
            }

            await appDb.SaveChangesAsync();
            await transaction.CommitAsync();
            return accessRequest.AccessReqId;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // STAGE 1 — HOD APPROVE / REJECT
    // ──────────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// HOD or folder-owner approves or rejects a specific access item ticket.
    /// On approval → status moves to ApprovedByHod and IT is notified.
    /// On rejection → item is closed and requester is notified.
    /// </summary>
    public async Task ProcessItemApprovalAsync(
        int currentApproverId, int accessItemId,
        RequestStatus decision, string comments)
    {
        var lineItem = await appDb.AccessItems
            .Include(ai => ai.AccessRequest)
            .FirstOrDefaultAsync(ai => ai.AccessItemId == accessItemId)
            ?? throw new KeyNotFoundException($"Access item #{accessItemId} not found.");

        if (lineItem.Status is RequestStatus.Rejected
                            or RequestStatus.ApprovedByHod
                            or RequestStatus.Completed)
            throw new InvalidOperationException(
                $"Ticket {lineItem.TicketNumber} has already been finalised.");

        var folderMapping = await appDb.FolderMappings
            .AsNoTracking()
            .FirstOrDefaultAsync(f => lineItem.FolderPath.StartsWith(f.FolderName))
            ?? throw new InvalidOperationException(
                $"No folder mapping found for '{lineItem.FolderPath}'.");

        var requesterAccount = await identityDb.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserId == lineItem.AccessRequest.UserId)
            ?? throw new InvalidOperationException("Requester account no longer exists.");

        var requesterDept = await appDb.Departments
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.DepartmentId == requesterAccount.DeptId);

        int userDirectHodId  = requesterDept?.HodId ?? 0;
        int folderOwnerHodId = folderMapping.PrimaryHodId ?? 0;

        bool isDirectHod    = currentApproverId == userDirectHodId;
        bool isFolderOwner  = currentApproverId == folderOwnerHodId
                              || currentApproverId == folderMapping.SecondaryHodId.GetValueOrDefault();

        if (!isDirectHod && !isFolderOwner)
            throw new UnauthorizedAccessException(
                "You do not have authority to approve this ticket.");

        var approverProfile = await identityDb.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserId == currentApproverId);
        string approverName = approverProfile?.UserName ?? "Approver";

        using var transaction = await appDb.Database.BeginTransactionAsync();
        try
        {
            appDb.Approvals.Add(new AccessApprovalEntity
            {
                AccessReqId    = lineItem.AccessReqId,
                AccessItemId   = lineItem.AccessItemId,
                ApproverId     = currentApproverId,
                ApprovalStatus = decision,
                Comments       = comments
            });

            if (decision == RequestStatus.Rejected)
            {
                lineItem.Status = RequestStatus.Rejected;

                // Notify requester
                appDb.AccessReqAudits.Add(new AccessReqAuditEntity
                {
                    AccessReqId     = lineItem.AccessReqId,
                    AccessItemId    = lineItem.AccessItemId,
                    EventType       = "REQUEST_REJECTED",
                    Message         = $"Ticket {lineItem.TicketNumber} for '{lineItem.FolderPath}' was rejected by {approverName}. Reason: {comments}",
                    RecipientUserId = lineItem.AccessRequest.UserId,
                    RecipientName   = requesterAccount.UserName ?? "Requester",
                    RecipientRole   = UserRoleName,
                    IsRead          = false
                });
            }
            else if (decision == RequestStatus.Approved)
            {
                lineItem.Status = RequestStatus.ApprovedByHod;

                // Locate active IT agent
                var itUserDetail = await appDb.UserDetails
                    .AsNoTracking()
                    .FirstOrDefaultAsync(ud => ud.UserRole == ItRoleGroupName && ud.IsActive);

                int targetItUserId = itUserDetail?.UserId ?? 0;

                if (targetItUserId != 0)
                {
                    var itProfile = await identityDb.Users
                        .AsNoTracking()
                        .FirstOrDefaultAsync(u => u.UserId == targetItUserId);

                    appDb.AccessReqAudits.Add(new AccessReqAuditEntity
                    {
                        AccessReqId     = lineItem.AccessReqId,
                        AccessItemId    = lineItem.AccessItemId,
                        EventType       = "IT_PENDING",
                        Message         = $"Ticket {lineItem.TicketNumber} approved by {approverName}. Please provision '{lineItem.FolderPath}' ({lineItem.AccessType}).",
                        RecipientUserId = targetItUserId,
                        RecipientName   = itProfile?.UserName ?? "IT Team",
                        RecipientRole   = ItRoleGroupName,
                        IsRead          = false
                    });
                }

                // Notify requester that HOD has approved
                appDb.AccessReqAudits.Add(new AccessReqAuditEntity
                {
                    AccessReqId     = lineItem.AccessReqId,
                    AccessItemId    = lineItem.AccessItemId,
                    EventType       = "HOD_APPROVED",
                    Message         = $"Good news! Ticket {lineItem.TicketNumber} was approved by {approverName} and has been forwarded to IT for provisioning.",
                    RecipientUserId = lineItem.AccessRequest.UserId,
                    RecipientName   = requesterAccount.UserName ?? "Requester",
                    RecipientRole   = UserRoleName,
                    IsRead          = false
                });

                lineItem.AccessRequest.ReqTo = targetItUserId;
            }
            else
            {
                throw new ArgumentException("Decision must be Approved or Rejected.");
            }

            await appDb.SaveChangesAsync();
            await transaction.CommitAsync();
            await EvaluateParentHeaderResolutionStateAsync(lineItem.AccessReqId);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // STAGE 2 — IT PROVISION / REJECT
    // ──────────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// IT agent completes provisioning (Completed) or rejects (Rejected / ItemRejectedByIt).
    /// On completion, access validity window of 90 calendar days is set.
    /// </summary>
    public async Task FinalizeItemProvisioningAsync(
        int itAgentUserId, int accessItemId,
        RequestStatus finalDecision, AccessTypes confirmedAccessType,
        string operationalComments)
    {
        var lineItem = await appDb.AccessItems
            .Include(ai => ai.AccessRequest)
            .FirstOrDefaultAsync(ai => ai.AccessItemId == accessItemId)
            ?? throw new KeyNotFoundException($"Access item #{accessItemId} not found.");

        if (lineItem.Status != RequestStatus.ApprovedByHod)
            throw new InvalidOperationException(
                $"Ticket {lineItem.TicketNumber} must be in ApprovedByHod state before IT provisioning.");

        _ = await appDb.UserDetails
                .AsNoTracking()
                .FirstOrDefaultAsync(ud => ud.UserId == itAgentUserId
                                        && ud.UserRole == ItRoleGroupName
                                        && ud.IsActive)
            ?? throw new UnauthorizedAccessException("Restricted to active IT agents only.");

        var requesterAccount = await identityDb.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserId == lineItem.AccessRequest.UserId)
            ?? throw new InvalidOperationException("Requester account no longer exists.");

        var folderMapping = await appDb.FolderMappings
            .AsNoTracking()
            .FirstOrDefaultAsync(f => lineItem.FolderPath.StartsWith(f.FolderName))
            ?? throw new InvalidOperationException($"No folder mapping for '{lineItem.FolderPath}'.");

        var requesterDept = await appDb.Departments
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.DepartmentId == requesterAccount.DeptId);

        bool isCrossDept = (folderMapping.PrimaryHodId ?? 0) != (requesterDept?.HodId ?? 0)
                        && folderMapping.PrimaryHodId.GetValueOrDefault() != 0;

        using var transaction = await appDb.Database.BeginTransactionAsync();
        try
        {
            if (finalDecision is RequestStatus.Rejected or RequestStatus.ItemRejectedByIt)
            {
                lineItem.Status = RequestStatus.Rejected;

                appDb.AccessReqAudits.Add(new AccessReqAuditEntity
                {
                    AccessReqId     = lineItem.AccessReqId,
                    AccessItemId    = lineItem.AccessItemId,
                    EventType       = "IT_REJECTED",
                    Message         = $"Ticket {lineItem.TicketNumber} was rejected by IT. Notes: {operationalComments}",
                    RecipientUserId = lineItem.AccessRequest.UserId,
                    RecipientName   = requesterAccount.UserName ?? "Requester",
                    RecipientRole   = UserRoleName,
                    IsRead          = false
                });
            }
            else if (finalDecision == RequestStatus.Completed)
            {
                var now = DateTime.UtcNow;

                lineItem.Status           = RequestStatus.Completed;
                lineItem.ConfirmAccessType = confirmedAccessType;
                lineItem.AccessFrom       = now;
                lineItem.AccessTo         = now.AddDays(AccessValidDays);

                string gateSummary = isCrossDept
                    ? "Cleared both Line Management and Folder-Owner approval gates."
                    : "Cleared Department Head approval gate.";

                appDb.AccessReqAudits.Add(new AccessReqAuditEntity
                {
                    AccessReqId     = lineItem.AccessReqId,
                    AccessItemId    = lineItem.AccessItemId,
                    EventType       = "ACCESS_GRANTED",
                    Message         = $"Access granted for ticket {lineItem.TicketNumber}. {gateSummary} '{confirmedAccessType}' rights active until {lineItem.AccessTo:yyyy-MM-dd}. Access will expire after {AccessValidDays} calendar days.",
                    RecipientUserId = lineItem.AccessRequest.UserId,
                    RecipientName   = requesterAccount.UserName ?? "Requester",
                    RecipientRole   = UserRoleName,
                    IsRead          = false
                });
            }
            else
            {
                throw new ArgumentException("Invalid final decision. Use Completed or Rejected.");
            }

            appDb.Approvals.Add(new AccessApprovalEntity
            {
                AccessReqId    = lineItem.AccessReqId,
                AccessItemId   = lineItem.AccessItemId,
                ApproverId     = itAgentUserId,
                ApprovalStatus = finalDecision,
                Comments       = $"IT Closeout: {operationalComments}"
            });

            await appDb.SaveChangesAsync();
            await transaction.CommitAsync();
            await EvaluateParentHeaderResolutionStateAsync(lineItem.AccessReqId);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // REVOKE
    // ──────────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// IT agent force-terminates an active (Completed) access item before its natural expiry.
    /// All parties (requester, HODs) are notified of the revocation.
    /// </summary>
    public async Task RevokeAccessAsync(int itAgentUserId, int accessItemId, string revocationReason)
    {
        if (string.IsNullOrWhiteSpace(revocationReason))
            throw new ArgumentException("A revocation reason is required.");

        var lineItem = await appDb.AccessItems
            .Include(ai => ai.AccessRequest)
            .FirstOrDefaultAsync(ai => ai.AccessItemId == accessItemId)
            ?? throw new KeyNotFoundException($"Access item #{accessItemId} not found.");

        if (lineItem.Status != RequestStatus.Completed)
            throw new InvalidOperationException(
                $"Ticket {lineItem.TicketNumber} is not in Completed state and cannot be revoked.");

        _ = await appDb.UserDetails
                .AsNoTracking()
                .FirstOrDefaultAsync(ud => ud.UserId == itAgentUserId
                                        && ud.UserRole == ItRoleGroupName
                                        && ud.IsActive)
            ?? throw new UnauthorizedAccessException("Restricted to active IT agents only.");

        var requesterAccount = await identityDb.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserId == lineItem.AccessRequest.UserId);

        var folderMapping = await appDb.FolderMappings
            .AsNoTracking()
            .FirstOrDefaultAsync(f => lineItem.FolderPath.StartsWith(f.FolderName));

        using var transaction = await appDb.Database.BeginTransactionAsync();
        try
        {
            lineItem.Status    = RequestStatus.Revoked;
            lineItem.RevokedOn = DateTime.UtcNow;
            lineItem.RevokedBy = itAgentUserId;

            appDb.Approvals.Add(new AccessApprovalEntity
            {
                AccessReqId    = lineItem.AccessReqId,
                AccessItemId   = lineItem.AccessItemId,
                ApproverId     = itAgentUserId,
                ApprovalStatus = RequestStatus.Revoked,
                Comments       = $"FORCE REVOCATION: {revocationReason}"
            });

            // Notify requester
            appDb.AccessReqAudits.Add(new AccessReqAuditEntity
            {
                AccessReqId     = lineItem.AccessReqId,
                AccessItemId    = lineItem.AccessItemId,
                EventType       = "ACCESS_REVOKED",
                Message         = $"Your access for ticket {lineItem.TicketNumber} ('{lineItem.FolderPath}') has been revoked by IT. Reason: {revocationReason}",
                RecipientUserId = lineItem.AccessRequest.UserId,
                RecipientName   = requesterAccount?.UserName ?? "Requester",
                RecipientRole   = UserRoleName,
                IsRead          = false
            });

            // Notify folder primary HOD
            if (folderMapping is not null && folderMapping.PrimaryHodId > 0)
            {
                var hodProfile = await identityDb.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.UserId == folderMapping.PrimaryHodId.Value);

                appDb.AccessReqAudits.Add(new AccessReqAuditEntity
                {
                    AccessReqId     = lineItem.AccessReqId,
                    AccessItemId    = lineItem.AccessItemId,
                    EventType       = "ACCESS_REVOKED_HOD",
                    Message         = $"FYI: Access ticket {lineItem.TicketNumber} for '{lineItem.FolderPath}' has been revoked by IT. Reason: {revocationReason}",
                    RecipientUserId = folderMapping.PrimaryHodId.GetValueOrDefault(),
                    RecipientName   = hodProfile?.UserName ?? folderMapping.PrimaryHodName ?? "Folder Owner HOD",
                    RecipientRole   = HodRoleName,
                    IsRead          = false
                });
            }

            await appDb.SaveChangesAsync();
            await transaction.CommitAsync();
            await EvaluateParentHeaderResolutionStateAsync(lineItem.AccessReqId);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // RENEW  (extends an active, near-expiry ticket by another 90 days)
    // ──────────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Renews an active Completed access item by extending its AccessTo date by 90 more calendar days.
    /// Only IT can trigger a renewal; the item must currently be Completed (not yet Expired / Revoked).
    /// Notifies the requester and the folder-owner HOD.
    /// </summary>
    public async Task RenewAccessAsync(int itAgentUserId, int accessItemId, string renewalNotes)
    {
        if (string.IsNullOrWhiteSpace(renewalNotes))
            throw new ArgumentException("Renewal notes are required.");

        var lineItem = await appDb.AccessItems
            .Include(ai => ai.AccessRequest)
            .FirstOrDefaultAsync(ai => ai.AccessItemId == accessItemId)
            ?? throw new KeyNotFoundException($"Access item #{accessItemId} not found.");

        if (lineItem.Status != RequestStatus.Completed)
            throw new InvalidOperationException(
                $"Ticket {lineItem.TicketNumber} must be Completed to be renewed. Current status: {lineItem.Status}.");

        _ = await appDb.UserDetails
                .AsNoTracking()
                .FirstOrDefaultAsync(ud => ud.UserId == itAgentUserId
                                        && ud.UserRole == ItRoleGroupName
                                        && ud.IsActive)
            ?? throw new UnauthorizedAccessException("Restricted to active IT agents only.");

        var requesterAccount = await identityDb.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserId == lineItem.AccessRequest.UserId);

        var folderMapping = await appDb.FolderMappings
            .AsNoTracking()
            .FirstOrDefaultAsync(f => lineItem.FolderPath.StartsWith(f.FolderName));

        using var transaction = await appDb.Database.BeginTransactionAsync();
        try
        {
            var newExpiry = (lineItem.AccessTo ?? DateTime.UtcNow).AddDays(AccessValidDays);
            lineItem.AccessTo = newExpiry;

            appDb.Approvals.Add(new AccessApprovalEntity
            {
                AccessReqId    = lineItem.AccessReqId,
                AccessItemId   = lineItem.AccessItemId,
                ApproverId     = itAgentUserId,
                ApprovalStatus = RequestStatus.Completed,
                Comments       = $"RENEWAL (+{AccessValidDays} days): {renewalNotes}"
            });

            appDb.AccessReqAudits.Add(new AccessReqAuditEntity
            {
                AccessReqId     = lineItem.AccessReqId,
                AccessItemId    = lineItem.AccessItemId,
                EventType       = "ACCESS_RENEWED",
                Message         = $"Your access for ticket {lineItem.TicketNumber} ('{lineItem.FolderPath}') has been renewed. New expiry: {newExpiry:yyyy-MM-dd}.",
                RecipientUserId = lineItem.AccessRequest.UserId,
                RecipientName   = requesterAccount?.UserName ?? "Requester",
                RecipientRole   = UserRoleName,
                IsRead          = false
            });

            if (folderMapping is not null && folderMapping.PrimaryHodId > 0)
            {
                var hodProfile = await identityDb.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.UserId == folderMapping.PrimaryHodId.Value);

                appDb.AccessReqAudits.Add(new AccessReqAuditEntity
                {
                    AccessReqId     = lineItem.AccessReqId,
                    AccessItemId    = lineItem.AccessItemId,
                    EventType       = "ACCESS_RENEWED_HOD",
                    Message         = $"FYI: Access ticket {lineItem.TicketNumber} for '{lineItem.FolderPath}' has been renewed until {newExpiry:yyyy-MM-dd}.",
                    RecipientUserId = folderMapping.PrimaryHodId.GetValueOrDefault(),
                    RecipientName   = hodProfile?.UserName ?? folderMapping.PrimaryHodName ?? "Folder Owner HOD",
                    RecipientRole   = HodRoleName,
                    IsRead          = false
                });
            }

            await appDb.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // RESUBMIT  (clone a dead/rejected/expired ticket into a fresh workflow loop)
    // ──────────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Clones a Rejected, Revoked, or Expired item into a brand-new request batch
    /// and re-enters the Stage 0 HOD notification cycle.
    /// The original requester must match the caller; active/pending tickets are blocked.
    /// </summary>
    public async Task<int> ResubmitExpiredOrFailedRequestAsync(
        int requesterUserId, int historicalAccessItemId,
        string? updatedReasonIfAny = null)
    {
        var oldItem = await appDb.AccessItems
            .Include(ai => ai.AccessRequest)
            .FirstOrDefaultAsync(ai => ai.AccessItemId == historicalAccessItemId)
            ?? throw new KeyNotFoundException($"Historical item #{historicalAccessItemId} not found.");

        if (oldItem.AccessRequest.UserId != requesterUserId)
            throw new UnauthorizedAccessException("You can only resubmit your own requests.");

        if (oldItem.Status is RequestStatus.Pending
                           or RequestStatus.ApprovedByHod
                           or RequestStatus.Completed)
            throw new InvalidOperationException(
                $"Ticket {oldItem.TicketNumber} is still active. Resubmission not allowed.");

        var batch = new List<(string FolderPath, AccessTypes AccessType, string Reason)>
        {
            (
                FolderPath: oldItem.FolderPath,
                AccessType: oldItem.AccessType,
                Reason: !string.IsNullOrWhiteSpace(updatedReasonIfAny)
                    ? updatedReasonIfAny
                    : oldItem.Reason
            )
        };

        using var transaction = await appDb.Database.BeginTransactionAsync();
        try
        {
            // Audit trail: mark the old item as resubmitted
            appDb.AccessReqAudits.Add(new AccessReqAuditEntity
            {
                AccessReqId     = oldItem.AccessReqId,
                AccessItemId    = oldItem.AccessItemId,
                EventType       = "TICKET_RESUBMITTED",
                Message         = $"Ticket {oldItem.TicketNumber} was resubmitted by user #{requesterUserId} to create a new workflow cycle.",
                RecipientUserId = requesterUserId,
                RecipientName   = "System",
                RecipientRole   = "System",
                IsRead          = true
            });
            await appDb.SaveChangesAsync();

            int newMasterId = await CreateMultiItemRequestAsync(requesterUserId, batch);

            await transaction.CommitAsync();
            return newMasterId;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // EXPIRE (called internally by background job — also exposed for ad-hoc use)
    // ──────────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Marks a single Completed access item as Expired and notifies the requester and HOD.
    /// Intended to be called by the <see cref="AccessExpiryBackgroundJob"/>.
    /// </summary>
    public async Task ExpireAccessItemAsync(int accessItemId)
    {
        var lineItem = await appDb.AccessItems
            .Include(ai => ai.AccessRequest)
            .FirstOrDefaultAsync(ai => ai.AccessItemId == accessItemId)
            ?? throw new KeyNotFoundException($"Access item #{accessItemId} not found.");

        if (lineItem.Status != RequestStatus.Completed)
            return; // Already handled — idempotent

        var requesterAccount = await identityDb.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserId == lineItem.AccessRequest.UserId);

        var folderMapping = await appDb.FolderMappings
            .AsNoTracking()
            .FirstOrDefaultAsync(f => lineItem.FolderPath.StartsWith(f.FolderName));

        using var transaction = await appDb.Database.BeginTransactionAsync();
        try
        {
            lineItem.Status = RequestStatus.Expired;

            // Notify requester
            appDb.AccessReqAudits.Add(new AccessReqAuditEntity
            {
                AccessReqId     = lineItem.AccessReqId,
                AccessItemId    = lineItem.AccessItemId,
                EventType       = "ACCESS_EXPIRED",
                Message         = $"Your access for ticket {lineItem.TicketNumber} ('{lineItem.FolderPath}') expired on {lineItem.AccessTo:yyyy-MM-dd}. Please resubmit if access is still required.",
                RecipientUserId = lineItem.AccessRequest.UserId,
                RecipientName   = requesterAccount?.UserName ?? "Requester",
                RecipientRole   = UserRoleName,
                IsRead          = false
            });

            // Notify folder-owner HOD
            if (folderMapping is not null && folderMapping.PrimaryHodId > 0)
            {
                var hodProfile = await identityDb.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.UserId == folderMapping.PrimaryHodId.Value);

                appDb.AccessReqAudits.Add(new AccessReqAuditEntity
                {
                    AccessReqId     = lineItem.AccessReqId,
                    AccessItemId    = lineItem.AccessItemId,
                    EventType       = "ACCESS_EXPIRED_HOD",
                    Message         = $"FYI: Access ticket {lineItem.TicketNumber} for '{lineItem.FolderPath}' has expired. The user's permissions should be removed.",
                    RecipientUserId = folderMapping.PrimaryHodId.GetValueOrDefault(),
                    RecipientName   = hodProfile?.UserName ?? folderMapping.PrimaryHodName ?? "Folder Owner HOD",
                    RecipientRole   = HodRoleName,
                    IsRead          = false
                });
            }

            await appDb.SaveChangesAsync();
            await transaction.CommitAsync();
            await EvaluateParentHeaderResolutionStateAsync(lineItem.AccessReqId);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // PRIVATE UTILITIES
    // ──────────────────────────────────────────────────────────────────────────────

    /// <summary>Thread-safe ticket number generator: REQ-202506-001</summary>
    private async Task<string> GenerateNextTicketNumberSequenceAsync()
    {
        await TicketSemaphore.WaitAsync();
        try
        {
            string prefix      = $"REQ-{DateTime.UtcNow:yyyyMM}-";
            string lastTicket  = await appDb.AccessItems
                .AsNoTracking()
                .Where(ai => ai.TicketNumber.StartsWith(prefix))
                .OrderByDescending(ai => ai.TicketNumber)
                .Select(ai => ai.TicketNumber)
                .FirstOrDefaultAsync() ?? string.Empty;

            int next = 1;
            if (!string.IsNullOrEmpty(lastTicket))
            {
                string suffix = lastTicket[prefix.Length..];
                if (int.TryParse(suffix, out int current))
                    next = current + 1;
            }
            return $"{prefix}{next:D3}";
        }
        finally
        {
            TicketSemaphore.Release();
        }
    }

    /// <summary>
    /// Flips the master request's IsAgreed flag once all child items are resolved.
    /// </summary>
    private async Task EvaluateParentHeaderResolutionStateAsync(int parentAccessReqId)
    {
        var masterRequest = await appDb.AccessRequests
            .Include(r => r.AccessItems)
            .FirstOrDefaultAsync(r => r.AccessReqId == parentAccessReqId);

        if (masterRequest is null) return;

        bool hasUnresolved = masterRequest.AccessItems
            .Any(ai => ai.Status is RequestStatus.Pending or RequestStatus.ApprovedByHod);

        masterRequest.IsAgreed = !hasUnresolved;
        await appDb.SaveChangesAsync();
    }

    /// <summary>Projection helper — overload with pre-fetched requester name dictionary.</summary>
    private static AccessRequestSummaryDto MapToSummaryDto(
        AccessItemEntity ai,
        Dictionary<int, string?> requesterProfiles)
    {
        requesterProfiles.TryGetValue(ai.AccessRequest.UserId, out var requesterName);
        return MapToSummaryDto(ai, ai.AccessRequest.UserId, requesterName);
    }

    private static AccessRequestSummaryDto MapToSummaryDto(
        AccessItemEntity ai, int userId, string? requesterName) => new()
    {
        AccessItemId   = ai.AccessItemId,
        AccessReqId    = ai.AccessReqId,
        TicketNumber   = ai.TicketNumber,
        RequesterUserId = userId,
        RequesterName  = requesterName ?? "Unknown",
        FolderPath     = ai.FolderPath,
        AccessType     = ai.AccessType,
        ConfirmedAccessType = ai.ConfirmAccessType,
        Reason         = ai.Reason,
        Status         = ai.Status,
        AccessFrom     = ai.AccessFrom,
        AccessTo       = ai.AccessTo,
        RevokedOn      = ai.RevokedOn,
        CreatedOn      = ai.CreatedOn
    };
}


//  Task<PaginatedListDto<AccessRequestSummaryDto>> GetAllRequestsAsync(
//      int pageNumber, int pageSize,
//      RequestStatus? statusFilter = null, string? search = null);
//
//  Task<PaginatedListDto<AccessRequestSummaryDto>> GetRequestsByUserIdAsync(
//      int userId, int pageNumber, int pageSize, RequestStatus? statusFilter = null);
//
//  Task<PaginatedListDto<AccessRequestSummaryDto>> GetRequestsByDepartmentAsync(
//      int departmentId, int pageNumber, int pageSize, RequestStatus? statusFilter = null);
//
//  Task<PaginatedListDto<AccessRequestSummaryDto>> GetRequestsByFolderOwnerAsync(
//      int hodUserId, int pageNumber, int pageSize, RequestStatus? statusFilter = null);
//
//  Task RenewAccessAsync(int itAgentUserId, int accessItemId, string renewalNotes);
//
//  Task ExpireAccessItemAsync(int accessItemId);

// ══════════════════════════════════════════════════════════════════════════════════
//  BACKGROUND JOB — AccessExpiryBackgroundJob.cs
//  Register in Program.cs:  builder.Services.AddHostedService<AccessExpiryBackgroundJob>();
// ══════════════════════════════════════════════════════════════════════════════════

/// <summary>
/// Hosted background service that runs every hour to find Completed access items
/// whose AccessTo date has passed and marks them as Expired.
/// A 7-day advance warning notification is also sent to help users plan renewals.
/// </summary>
public sealed class AccessExpiryBackgroundJob(
    IServiceScopeFactory scopeFactory,
    ILogger<AccessExpiryBackgroundJob> logger) : BackgroundService
{
    private static readonly TimeSpan CheckInterval      = TimeSpan.FromHours(1);
    private const           int      ExpiryWarningDays  = 7;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("AccessExpiryBackgroundJob started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunExpiryCheckAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "AccessExpiryBackgroundJob encountered an error.");
            }

            await Task.Delay(CheckInterval, stoppingToken);
        }
    }

    private async Task RunExpiryCheckAsync(CancellationToken ct)
    {
        using var scope      = scopeFactory.CreateScope();
        var appDb            = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var identityDb       = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
        var workflowService  = scope.ServiceProvider.GetRequiredService<IAccessRequestWorkflow>();

        var now              = DateTime.UtcNow;
        var warningThreshold = now.AddDays(ExpiryWarningDays);

        // ── 1. Expire items whose AccessTo has already passed ─────────────────
        var expiredItems = await appDb.AccessItems
            .Where(ai => ai.Status == RequestStatus.Completed
                      && ai.AccessTo.HasValue
                      && ai.AccessTo.Value <= now)
            .Select(ai => ai.AccessItemId)
            .ToListAsync(ct);

        foreach (var itemId in expiredItems)
        {
            try
            {
                await workflowService.ExpireAccessItemAsync(itemId);
                logger.LogInformation("Expired access item #{ItemId}.", itemId);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to expire access item #{ItemId}.", itemId);
            }
        }

        // ── 2. Send 7-day advance warning notifications ───────────────────────
        var warningItems = await appDb.AccessItems
            .Include(ai => ai.AccessRequest)
            .AsNoTracking()
            .Where(ai => ai.Status == RequestStatus.Completed
                      && ai.AccessTo.HasValue
                      && ai.AccessTo.Value > now
                      && ai.AccessTo.Value <= warningThreshold)
            .ToListAsync(ct);

        // Avoid duplicate warnings: check if we already sent one recently
        var alreadyWarnedItemIds = await appDb.AccessReqAudits
            .AsNoTracking()
            .Where(a => a.EventType == "ACCESS_EXPIRY_WARNING"
                     && warningItems.Select(w => w.AccessItemId).Contains((int)a.AccessItemId!))
            .Select(a => a.AccessItemId)
            .Distinct()
            .ToListAsync(ct);

        var itemsNeedingWarning = warningItems
            .Where(ai => !alreadyWarnedItemIds.Contains(ai.AccessItemId))
            .ToList();

        if (itemsNeedingWarning.Count == 0) return;

        var requesterIds = itemsNeedingWarning
            .Select(ai => ai.AccessRequest.UserId)
            .Distinct()
            .ToList();

        var requesterProfiles = await identityDb.Users
            .AsNoTracking()
            .Where(u => requesterIds.Contains(u.UserId))
            .ToDictionaryAsync(u => u.UserId, u => u.UserName, ct);

        foreach (var ai in itemsNeedingWarning)
        {
            requesterProfiles.TryGetValue(ai.AccessRequest.UserId, out var requesterName);
            int daysLeft = (int)(ai.AccessTo!.Value - now).TotalDays;

            appDb.AccessReqAudits.Add(new AccessReqAuditEntity
            {
                AccessReqId     = ai.AccessReqId,
                AccessItemId    = ai.AccessItemId,
                EventType       = "ACCESS_EXPIRY_WARNING",
                Message         = $"Your access for ticket {ai.TicketNumber} ('{ai.FolderPath}') will expire in {daysLeft} day(s) on {ai.AccessTo:yyyy-MM-dd}. Please contact IT to renew if still required.",
                RecipientUserId = ai.AccessRequest.UserId,
                RecipientName   = requesterName ?? "Requester",
                RecipientRole   = "User",
                IsRead          = false,
                CreatedBy       = 0 // System
            });

            logger.LogInformation(
                "Sent expiry warning for item #{ItemId} (expires in {Days} days).",
                ai.AccessItemId, daysLeft);
        }

        await appDb.SaveChangesAsync(ct);
    }
}