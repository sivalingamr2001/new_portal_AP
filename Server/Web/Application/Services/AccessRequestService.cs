using Microsoft.EntityFrameworkCore;
using Web.Application.Interfaces;
using Web.Domain.Common;
using Web.Domain.Dto.AccessRequest;
using Web.Domain.Entities;
using Web.Domain.Enums;
using Web.Infrastructure.Data;
using Web.Infrastructure.Utilities;
using Web.Shared.Utilites.EmailService;

namespace Web.Application.Services;

public sealed class AccessRequestService(
    AppDbContext db,
    INotificationService notificationService,
    IAccessRequestEmailNotificationService emailNotificationService,
    HodDbContext hodDb,
    CmplDbContext cmplDb) : IAccessRequestService
{
    // ─── Submit (User) ───────────────────────────────────────────────────────────

    public async Task<Result<int>> SubmitRequestAsync(
        SubmitAccessRequestDto dto, int submittedByUserId)
    {
        bool isTestEnv = db.Database.IsSqlite();

        var user = isTestEnv
            ? await db.CmplUsers.FirstOrDefaultAsync(u => u.Id == submittedByUserId)
            : await cmplDb.CmplUsers.FirstOrDefaultAsync(u => u.Id == submittedByUserId);

        if (!dto.IsAgreed)
            return Result.Failure<int>(Error.Validation("REQ_001",
                "You must agree to the terms before submitting."));

        var request = new AccessRequestEntity
        {
            UserId = submittedByUserId,
            ReqTo = dto.ReqTo,
            IsAgreed = true,
            CurrentStatus = RequestStatus.PendingWithHod,
            IsActive = true,
            CreatedOn = DateTime.UtcNow,
            CreatedBy = submittedByUserId
        };

        db.AccessRequests.Add(request);
        await db.SaveChangesAsync();

        var items = await CreateItemsAsync(db, dto.Items, request.AccessReqId, submittedByUserId);

        // Audit each item
        foreach (var item in items)
        {
            db.AccessReqAudits.Add(BuildAudit(request.AccessReqId, item.AccessItemId,
                "Submitted", $"Item {item.TicketNumber} submitted by user.", submittedByUserId));
        }

        await db.SaveChangesAsync();

        // ─── Notifications ────────────────────────────────────────────────────
        await SendSubmissionNotificationsAsync(request, items, user);

        return Result.Success(request.AccessReqId);
    }

    // ─── Submit (HOD — goes directly to IT) ─────────────────────────────────────

    public async Task<Result<int>> SubmitHodRequestAsync(
        SubmitAccessRequestDto dto, int hodUserId)
    {
        // Validate that the submitter is a HOD via portal User role
        var hodPortalUser = await db.Users.FirstOrDefaultAsync(u => u.Id == hodUserId && u.Role == "Hod");
        if (hodPortalUser is null)
            return Result.Failure<int>(Error.NotFound("HOD_001", "User is not authorized as an HOD."));

        // Get HOD's CMPL user details for notification
        bool isTestEnv = db.Database.IsSqlite();
        var cmplHod = isTestEnv
            ? await db.CmplUsers.FirstOrDefaultAsync(c => c.Id == hodUserId)
            : await cmplDb.CmplUsers.FirstOrDefaultAsync(c => c.Id == hodUserId);

        var request = new AccessRequestEntity
        {
            UserId = hodUserId,
            ReqTo = dto.ReqTo,
            IsAgreed = true,
            CurrentStatus = RequestStatus.PendingWithIt,
            IsActive = true,
            CreatedOn = DateTime.UtcNow,
            CreatedBy = hodUserId
        };

        db.AccessRequests.Add(request);
        await db.SaveChangesAsync();

        var items = await CreateItemsAsync(db, dto.Items, request.AccessReqId, hodUserId,
            hodApproverId: hodUserId, initialStatus: RequestStatus.PendingWithIt);

        foreach (var item in items)
        {
            db.AccessReqAudits.Add(BuildAudit(request.AccessReqId, item.AccessItemId,
                "HodSelfSubmit", $"HOD submitted item {item.TicketNumber} — forwarded to IT.", hodUserId));
        }

        await db.SaveChangesAsync();

        // Notify IT operators
        await notificationService.NotifyRoleGroupAsync(
            role: "Operator",
            title: "New HOD Access Request",
            message: $"HOD {cmplHod?.Name ?? "(unknown)"} submitted an access request with {items.Count} item(s).",
            type: "HodRequest",
            requestId: request.AccessReqId);

        return Result.Success(request.AccessReqId);
    }

    // ─── Get Request Detail ──────────────────────────────────────────────────────

    public async Task<Result<AccessRequestDetailDto>> GetRequestDetailAsync(
    int requestId, int callerUserId, int? itemId = null)
    {
        var query = db.AccessRequests.AsQueryable();

        if (itemId.HasValue)
        {
            query = query.Include(r => r.AccessItems.Where(i => i.AccessItemId == itemId.Value))
                .ThenInclude(i => i.AccessApprovals);
        }
        else
        {
            query = query.Include(r => r.AccessItems)
                .ThenInclude(i => i.AccessApprovals);
        }

        var request = await query.FirstOrDefaultAsync(r => r.AccessReqId == requestId);

        if (request is null)
            return Result.Failure<AccessRequestDetailDto>(
                Error.NotFound("REQ_002", "Request not found."));

        // If a specific item was requested but not found in this request
        if (itemId.HasValue && !request.AccessItems.Any())
        {
            return Result.Failure<AccessRequestDetailDto>(
                Error.NotFound("ITEM_001", "Requested item not found in this access request."));
        }

        return Result.Success(await MapToDetailDtoAsync(request));
    }


    // ─── My Requests (Paged) ─────────────────────────────────────────────────────
    public async Task<PagedResult<AccessRequestSummaryDto>> GetMyRequestsAsync(
    int userId, string? identifier, int page, int pageSize)
    {
        bool isTestEnv = db.Database.IsSqlite();

        HodMaster? hodRecord = null;

        if (!string.IsNullOrWhiteSpace(identifier))
        {
            var normalizedIdentifier = identifier.Trim().ToLower();

            hodRecord = await db.HodMasters
                .FirstOrDefaultAsync(h => h.Deleted == 0
                    && ((h.EmployeeId != null && h.EmployeeId.ToLower() == normalizedIdentifier)
                        || (h.Email != null && h.Email.ToLower() == normalizedIdentifier)));
        }

        // Prepare the base query with the required inclusion
        var baseQuery = db.AccessItems
            .Include(i => i.AccessRequest)
            .Include(i => i.AccessApprovals)
            .AsQueryable();

        // 3. Conditional Routing: HOD Query vs. User/Operator Query
        if (hodRecord is not null)
        {
            // ========================================================
            // HOD PATH: View managed departments and folder paths globally
            // ========================================================
            var cleanEmpId = hodRecord.EmployeeId?.Trim().ToLower() ?? string.Empty;

            // A. Fetch departments managed by this HOD's Employee ID string
            var deptIds = await db.Departments
                .Where(d => d.HodId != null && d.HodId.ToLower() == cleanEmpId && d.IsActive)
                .Select(d => d.Id)
                .ToListAsync();

            // B. Fetch user IDs belonging to those departments
            var cmplContext = isTestEnv ? db.CmplUsers : cmplDb.CmplUsers;
            var deptUserIds = await cmplContext
                .Where(u => u.DepartmentId.HasValue && deptIds.Contains(u.DepartmentId!.Value))
                .Select(u => u.Id)
                .ToListAsync();

            // C. Fetch folder paths managed by this HOD's Employee ID string
            var hodOwnedFolderPaths = await db.FolderMappings
                .Where(f => f.IsActive &&
                    ((f.PrimaryHodId != null && f.PrimaryHodId.ToLower() == cleanEmpId) ||
                     (f.SecondaryHodId != null && f.SecondaryHodId.ToLower() == cleanEmpId)))
                .Select(f => f.FolderName)
                .ToListAsync();

            // Apply global manager filters (No "UserId == userId" constraint here)
            baseQuery = baseQuery.Where(i =>
                deptUserIds.Contains(i.AccessRequest.UserId) ||
                hodOwnedFolderPaths.Contains(i.FolderPath));
        }
        else
        {
            // ========================================================
            // USER / OPERATOR PATH: Restrict strictly to their own requests
            // ========================================================
            baseQuery = baseQuery.Where(i => i.AccessRequest.UserId == userId);
        }

        // Apply global chronological sorting order
        baseQuery = baseQuery.OrderByDescending(i => i.CreatedOn);

        var total = await baseQuery.CountAsync();

        // 4. Stream database entities to avoid EF Core LINQ translation failures with MapToSummaryDto
        var rawItems = await baseQuery
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        // 5. Apply safe local mapping conversion in-memory
        var items = (await Task.WhenAll(rawItems.Select(MapToSummaryDtoAsync))).ToList();

        return new PagedResult<AccessRequestSummaryDto>(
            items,
            total,
            page,
            pageSize
        );
    }

    // ─── Resubmit Rejected Item ──────────────────────────────────────────────────

    public async Task<Result> ResubmitItemAsync(int accessItemId, string reason, int userId)
    {
        var item = await db.AccessItems
            .Include(i => i.AccessRequest)
            .FirstOrDefaultAsync(i => i.AccessItemId == accessItemId);

        if (item is null)
            return Result.Failure(Error.NotFound("ITEM_001", "Access item not found."));

        if (item.AccessRequest.UserId != userId)
            return Result.Failure(Error.Validation("ITEM_002", "You do not own this item."));

        var allowedStatuses = new[] { RequestStatus.HodRejected, RequestStatus.ItRejected };
        if (!allowedStatuses.Contains(item.Status))
            return Result.Failure(Error.Validation("ITEM_003",
                "Only rejected items can be resubmitted."));

        // Reset item back to PendingWithHod
        item.Status = RequestStatus.PendingWithHod;
        item.Reason = reason;
        item.RejectionReason = null;
        item.HodApproverId = null;
        item.ItApproverId = null;
        item.ModifiedOn = DateTime.UtcNow;
        item.ModifiedBy = userId;

        db.AccessReqAudits.Add(BuildAudit(item.AccessReqId, item.AccessItemId,
            "Resubmitted", $"Item {item.TicketNumber} resubmitted by user.", userId));

        await db.SaveChangesAsync();

        await NotifyHodsForItemAsync(item, "Item Resubmitted",
            $"Ticket {item.TicketNumber} has been resubmitted and awaits your review.", userId);

        return Result.Success();
    }

    // ─── Renew Item ──────────────────────────────────────────────────────────────

    public async Task<Result> RenewItemAsync(int accessItemId, string reason, int userId)
    {
        var item = await db.AccessItems
            .Include(i => i.AccessRequest)
            .FirstOrDefaultAsync(i => i.AccessItemId == accessItemId);

        if (item is null)
            return Result.Failure(Error.NotFound("ITEM_001", "Access item not found."));

        if (item.AccessRequest.UserId != userId)
            return Result.Failure(Error.Validation("ITEM_002", "You do not own this item."));

        var renewableStatuses = new[]
            { RequestStatus.ItApproved, RequestStatus.Expired };

        if (!renewableStatuses.Contains(item.Status))
            return Result.Failure(Error.Validation("ITEM_004",
                "Only approved or expired items can be renewed."));

        // Reset for re-approval cycle
        item.Status = RequestStatus.PendingWithHod;
        item.Reason = reason;
        item.RejectionReason = null;
        item.ApprovedAtUtc = null;
        item.ExpiresAtUtc = null;
        item.HodApproverId = null;
        item.ItApproverId = null;
        item.ModifiedOn = DateTime.UtcNow;
        item.ModifiedBy = userId;

        db.AccessReqAudits.Add(BuildAudit(item.AccessReqId, item.AccessItemId,
            "RenewalRequested", $"User requested renewal of ticket {item.TicketNumber}.", userId));

        await db.SaveChangesAsync();

        await NotifyHodsForItemAsync(item, "Renewal Request",
            $"Ticket {item.TicketNumber} renewal has been submitted.", userId);

        return Result.Success();
    }

    // ─── Private Helpers ─────────────────────────────────────────────────────────

    private async Task<List<AccessItemEntity>> CreateItemsAsync(
        AppDbContext db,
        IEnumerable<AccessItemRequestDto> itemDtos,
        int requestId,
        int createdBy,
        int? hodApproverId = null,
        RequestStatus initialStatus = RequestStatus.PendingWithHod)
    {
        var items = new List<AccessItemEntity>();

        foreach (var dto in itemDtos)
        {
            string ticketNumber = await TicketNumberGenerator.GenerateAsync(db);

            var item = new AccessItemEntity
            {
                AccessReqId = requestId,
                TicketNumber = ticketNumber,
                Status = initialStatus,
                FolderPath = dto.FolderPath,
                AccessType = dto.AccessType,
                ConfirmAccessType = dto.AccessType,
                Reason = dto.Reason,
                HodApproverId = hodApproverId,
                IsActive = true,
                CreatedOn = DateTime.UtcNow,
                CreatedBy = createdBy
            };

            db.AccessItems.Add(item);
            items.Add(item);
        }

        await db.SaveChangesAsync();
        return items;
    }

    private async Task SendSubmissionNotificationsAsync(
        AccessRequestEntity request,
        List<AccessItemEntity> items,
        CmplUser? user)
    {
        var actorUserId = user?.Id ?? request.UserId;
        var actorName = user?.Name ?? "the requester";

        // 1. Notify the user: confirm receipt with ticket numbers
        var ticketList = string.Join(", ", items.Select(i => i.TicketNumber));
        await notificationService.NotifyUserAsync(
            userId: actorUserId,
            role: "User",
            title: "Access Request Submitted",
            message: $"Your request has been submitted. Ticket: {ticketList}",
            type: "RequestSubmitted",
            requestId: request.AccessReqId);

        // 2. Resolve HODs for each item and notify them
        foreach (var item in items)
        {
            await NotifyHodsForItemAsync(
                item,
                "New Access Request Awaiting Approval",
                $"Ticket {item.TicketNumber} from {actorName} is pending your review.",
                actorUserId,
                request.ReqTo);
        }

        // 3. Notify all IT Operators about new request
        await notificationService.NotifyRoleGroupAsync(
            role: "Operator",
            title: "New Access Request",
            message: $"{items.Count} new item(s) submitted by {actorName} await HOD approval.",
            type: "NewRequest",
            requestId: request.AccessReqId);
    }

    /// <summary>
    /// Resolves the folder's HOD and the user's department HOD.
    /// If they differ, notifies both; otherwise notifies just one.
    /// </summary>
    private async Task NotifyHodsForItemAsync(
        AccessItemEntity item,
        string title,
        string message,
        int actorUserId,
        string? requestedHodIdentifier = null)
    {
        // Initialize our master collection for numerical system user IDs
        var hodUserIds = new List<int>();

        if (!string.IsNullOrWhiteSpace(requestedHodIdentifier))
        {
            var requestedHodIds = await ResolveRequestedHodUserIdsAsync(requestedHodIdentifier);
            if (requestedHodIds.Count > 0)
            {
                foreach (var hodId in requestedHodIds.Distinct())
                {
                    await notificationService.NotifyUserAsync(
                        userId: hodId,
                        role: "Hod",
                        title: title,
                        message: message,
                        type: "HodAction",
                        requestId: item.AccessReqId,
                        itemId: item.AccessItemId,
                        ticketNumber: item.TicketNumber);
                }

                return;
            }
        }

        // ========================================================
        // 1. RESOLVE FOLDER-MAPPED HODs (Strings -> Integer UserIds)
        // ========================================================
        var folderMapping = await db.FolderMappings
            .FirstOrDefaultAsync(f => f.FolderName == item.FolderPath);

        var hodUserIdentifiers = new List<string>();

        if (!string.IsNullOrWhiteSpace(folderMapping?.PrimaryHodId))
        {
            hodUserIdentifiers.Add(folderMapping.PrimaryHodId.Trim().ToLower());
        }

        if (!string.IsNullOrWhiteSpace(folderMapping?.SecondaryHodId))
        {
            hodUserIdentifiers.Add(folderMapping.SecondaryHodId.Trim().ToLower());
        }

        // If the folder has mapped identifiers, look up their numeric UserIds in HodMaster
        if (hodUserIdentifiers.Any())
        {
            bool isTestEnv = db.Database.IsSqlite();
            var hodContext = isTestEnv ? db.HodMasters : hodDb.HodMasters; // Uses your cross-context fallback

            var folderHodUserIds = await hodContext
                .Where(h => h.Deleted == 0 && h.EmployeeId != null && hodUserIdentifiers.Contains(h.EmployeeId.ToLower()))
                .Select(h => h.UserId)
                .ToListAsync();

            hodUserIds.AddRange(folderHodUserIds);
        }

        // ========================================================
        // 2. RESOLVE USER DEPARTMENT HOD (String -> Integer UserId)
        // ========================================================
        var user = await db.CmplUsers.FirstOrDefaultAsync(u => u.Id == actorUserId);
        if (user?.DepartmentId is not null)
        {
            var dept = await db.Departments.FirstOrDefaultAsync(d => d.Id == user.DepartmentId);
            if (!string.IsNullOrWhiteSpace(dept?.HodId))
            {
                var hodRecord = await db.HodMasters
                    .FirstOrDefaultAsync(h => h.EmployeeId != null
                        && h.EmployeeId.ToLower() == dept.HodId.Trim().ToLower()
                        && h.Deleted == 0);

                if (hodRecord is not null)
                {
                    hodUserIds.Add(hodRecord.UserId);
                }
            }
        }

        // ========================================================
        // 3. EXECUTE DEDUPLICATED NOTIFICATION DISTRIBUTION LOOP
        // ========================================================
        // Distinct() ensures an HOD doesn't get duplicate notifications if they manage both the folder and department
        foreach (var hodId in hodUserIds.Distinct())
        {
            await notificationService.NotifyUserAsync(
                userId: hodId, // Safely matches the required integer signature
                role: "Hod",
                title: title,
                message: message,
                type: "HodAction",
                requestId: item.AccessReqId,
                itemId: item.AccessItemId,
                ticketNumber: item.TicketNumber);
        }
    }

    private async Task<List<int>> ResolveRequestedHodUserIdsAsync(string? requestedHodIdentifier)
    {
        if (string.IsNullOrWhiteSpace(requestedHodIdentifier))
            return [];

        var normalizedIdentifier = requestedHodIdentifier.Trim().ToLowerInvariant();

        return await db.CmplUsers
            .Where(h => (h.EmployeeId != null && h.EmployeeId.ToLower() == normalizedIdentifier)
                    || (h.Email != null && h.Email.ToLower() == normalizedIdentifier))
            .Select(h => h.Id)
            .Distinct()
            .ToListAsync();
    }

    private static AccessReqAuditEntity BuildAudit(int requestId, int? itemId,
        string eventType, string message, int actorUserId) => new()
        {
            AccessReqId = requestId,
            AccessItemId = itemId,
            EventType = eventType,
            Message = message,
            ActorUserId = actorUserId,
            RecipientUserId = actorUserId,
            RecipientName = string.Empty,
            RecipientRole = string.Empty,
            IsActive = true,
            CreatedOn = DateTime.UtcNow,
            CreatedBy = actorUserId
        };

    private async Task<AccessRequestDetailDto> MapToDetailDtoAsync(AccessRequestEntity r)
    {
        bool isTestEnv = db.Database.IsSqlite();

        // 1. Fetch the Requester Name using the Request's UserId against CmplUsers
        var cmplContext = isTestEnv ? db.CmplUsers : cmplDb.CmplUsers;

        var requesterName = await cmplContext
            .Where(c => c.Id == r.UserId)
            .Select(c => c.Name)
            .FirstOrDefaultAsync() ?? "Unknown Requester";

        // 2. Extract unique approver IDs from the item approval logs
        var approverIds = r.AccessItems
            .SelectMany(i => i.AccessApprovals.Select(a => a.ApproverId))
            .Where(id => id > 0)
            .Distinct()
            .ToList();

        // 3. Resolve the approver names map dictionary
        var approverNames = await BuildApproverNameMapAsync(approverIds);

        // 4. Return the fully mapped DTO containing the requester's name
        return new AccessRequestDetailDto(
            r.AccessReqId,
            r.UserId,
            requesterName, // Safely injected here
            r.CurrentStatus,
            r.ItsrNo,
            r.CreatedOn,
            r.AccessItems.Select(i => new AccessItemDto(
                i.AccessItemId,
                i.TicketNumber,
                i.FolderPath,
                i.AccessType,
                i.ConfirmAccessType,
                i.Status,
                i.Reason,
                i.RejectionReason,
                ResolveApproverName(i.AccessApprovals, "HOD", RequestStatus.HodApproved, approverNames),
                ResolveApproverName(i.AccessApprovals, "HOD", RequestStatus.HodRejected, approverNames),
                ResolveApproverName(i.AccessApprovals, "IT", RequestStatus.ItApproved, approverNames),
                ResolveApproverName(i.AccessApprovals, "IT", RequestStatus.ItRejected, approverNames),
                i.ApprovedAtUtc,
                i.ExpiresAtUtc
            )).ToList()
        );
    }

    private async Task<AccessRequestSummaryDto> MapToSummaryDtoAsync(AccessItemEntity item)
    {
        var approverIds = item.AccessApprovals
            .Select(a => a.ApproverId)
            .Where(id => id > 0)
            .Distinct()
            .ToList();

        var approverNames = await BuildApproverNameMapAsync(approverIds);

        return new AccessRequestSummaryDto(
            item.AccessReqId,
            item.Status,
            item.AccessRequest.ItsrNo,
            item.AccessRequest.CreatedOn,
            new AccessItemDto(
                item.AccessItemId,
                item.TicketNumber,
                item.FolderPath,
                item.AccessType,
                item.ConfirmAccessType,
                item.Status,
                item.Reason,
                item.RejectionReason,
                ResolveApproverName(item.AccessApprovals, "HOD", RequestStatus.HodApproved, approverNames),
                ResolveApproverName(item.AccessApprovals, "HOD", RequestStatus.HodRejected, approverNames),
                ResolveApproverName(item.AccessApprovals, "IT", RequestStatus.ItApproved, approverNames),
                ResolveApproverName(item.AccessApprovals, "IT", RequestStatus.ItRejected, approverNames),
                item.ApprovedAtUtc,
                item.ExpiresAtUtc
            ),
            item.Status == RequestStatus.ItApproved ? 1 : 0,
            item.Status is RequestStatus.HodRejected or RequestStatus.ItRejected ? 1 : 0
        );
    }

    private async Task<Dictionary<int, string?>> BuildApproverNameMapAsync(List<int> approverIds)
    {
        if (approverIds.Count == 0)
            return new Dictionary<int, string?>();

        var cmplUsers = await db.CmplUsers
            .Where(u => approverIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.Name);

        var hodUsers = await db.HodMasters
            .Where(h => h.Deleted == 0 && approverIds.Contains(h.UserId))
            .ToDictionaryAsync(h => h.UserId, h => h.Name);

        return approverIds.ToDictionary(
            id => id,
            id => cmplUsers.TryGetValue(id, out var cmplName) && !string.IsNullOrWhiteSpace(cmplName)
                ? cmplName
                : hodUsers.TryGetValue(id, out var hodName) ? hodName : null);
    }

    private static string? ResolveApproverName(
        IEnumerable<AccessApprovalEntity> approvals,
        string approvalLevel,
        RequestStatus status,
        IReadOnlyDictionary<int, string?> approverNames)
    {
        var approval = approvals.FirstOrDefault(a =>
            string.Equals(a.ApprovalLevel, approvalLevel, StringComparison.OrdinalIgnoreCase)
            && a.ApprovalStatus == status);

        return approval is null || !approverNames.TryGetValue(approval.ApproverId, out var name)
            ? null
            : name;
    }

    private async Task SendStageEmailAsync(
    string eventType,
    string subject,
    string summary,
    AccessRequestEntity accessRequest,
    CmplUser requester,
    IReadOnlyCollection<CmplUser> recipients,
    AccessItemEntity? item,
    string? comments,
    DateTime? expirationDateUtc,
    CancellationToken cancellationToken)
    {
        await emailNotificationService.SendStageNotificationAsync(
            new AccessRequestEmailNotification(
                BuildMailProgramSuffix(eventType),
                subject,
                subject,
                summary,
                accessRequest,
                requester,
                recipients,
                item,
                comments,
                expirationDateUtc),
            cancellationToken);
    }

    private static string BuildMailProgramSuffix(string eventType) =>
        eventType.Replace(".", "_", StringComparison.Ordinal);
}
