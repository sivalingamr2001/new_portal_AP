using Microsoft.EntityFrameworkCore;
using Web.Domain.Common;
using Web.Domain.Dto;
using Web.Domain.Entities;
using Web.Domain.Enums;
using Web.Infrastructure.Data;
using Web.Infrastructure.Utilities;

namespace Web.Application.Services;

public sealed class AccessRequestService(
    AppDbContext db,
    INotificationService notificationService,
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
            UserId        = submittedByUserId,
            ReqTo         = dto.ReqTo,
            IsAgreed      = true,
            CurrentStatus = RequestStatus.PendingWithHod,
            IsActive      = true,
            CreatedOn     = DateTime.UtcNow,
            CreatedBy     = submittedByUserId
        };

        db.AccessRequests.Add(request);
        await db.SaveChangesAsync();

        var items = await CreateItemsAsync(dto.Items, request.AccessReqId, submittedByUserId);

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
        var hod = await hodDb.HodMasters.FirstOrDefaultAsync(h => h.UserId == hodUserId);
        if (hod is null)
            return Result.Failure<int>(Error.NotFound("HOD_001", "HOD not found."));

        var request = new AccessRequestEntity
        {
            UserId        = hodUserId,
            ReqTo         = dto.ReqTo,
            IsAgreed      = true,
            CurrentStatus = RequestStatus.PendingWithIt,
            IsActive      = true,
            CreatedOn     = DateTime.UtcNow,
            CreatedBy     = hodUserId
        };

        db.AccessRequests.Add(request);
        await db.SaveChangesAsync();

        var items = await CreateItemsAsync(dto.Items, request.AccessReqId, hodUserId,
            hodApproverId: hodUserId, initialStatus: RequestStatus.PendingWithIt);

        foreach (var item in items)
        {
            db.AccessReqAudits.Add(BuildAudit(request.AccessReqId, item.AccessItemId,
                "HodSelfSubmit", $"HOD submitted item {item.TicketNumber} — forwarded to IT.", hodUserId));
        }

        await db.SaveChangesAsync();

        // Notify IT operators
        await notificationService.NotifyRoleGroupAsync(
            role: "It",
            title: "New HOD Access Request",
            message: $"HOD {hod.Name} submitted an access request with {items.Count} item(s).",
            type: "HodRequest",
            requestId: request.AccessReqId);

        return Result.Success(request.AccessReqId);
    }

    // ─── Get Request Detail ──────────────────────────────────────────────────────

    public async Task<Result<AccessRequestDetailDto>> GetRequestDetailAsync(
        int requestId, int callerUserId)
    {
        var request = await db.AccessRequests
            .Include(r => r.AccessItems)
            .FirstOrDefaultAsync(r => r.AccessReqId == requestId);

        if (request is null)
            return Result.Failure<AccessRequestDetailDto>(
                Error.NotFound("REQ_002", "Request not found."));

        return Result.Success(MapToDetailDto(request));
    }

    // ─── My Requests (Paged) ─────────────────────────────────────────────────────

    public async Task<PagedResult<AccessRequestSummaryDto>> GetMyRequestsAsync(
        int userId, int page, int pageSize)
    {
        var query = db.AccessRequests
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CreatedOn);

        var total = await query.CountAsync();

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(r => r.AccessItems)
            .Select(r => MapToSummaryDto(r))
            .ToListAsync();

        return new PagedResult<AccessRequestSummaryDto>(items, total, page, pageSize);
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
        item.Status           = RequestStatus.PendingWithHod;
        item.Reason           = reason;
        item.RejectionReason  = null;
        item.HodApproverId    = null;
        item.ItApproverId     = null;
        item.ModifiedOn       = DateTime.UtcNow;
        item.ModifiedBy       = userId;

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
        item.Status          = RequestStatus.PendingWithHod;
        item.Reason          = reason;
        item.RejectionReason = null;
        item.ApprovedAtUtc   = null;
        item.ExpiresAtUtc    = null;
        item.HodApproverId   = null;
        item.ItApproverId    = null;
        item.ModifiedOn      = DateTime.UtcNow;
        item.ModifiedBy      = userId;

        db.AccessReqAudits.Add(BuildAudit(item.AccessReqId, item.AccessItemId,
            "RenewalRequested", $"User requested renewal of ticket {item.TicketNumber}.", userId));

        await db.SaveChangesAsync();

        await NotifyHodsForItemAsync(item, "Renewal Request",
            $"Ticket {item.TicketNumber} renewal has been submitted.", userId);

        return Result.Success();
    }

    // ─── Private Helpers ─────────────────────────────────────────────────────────

    private async Task<List<AccessItemEntity>> CreateItemsAsync(
        IEnumerable<AccessItemRequestDto> itemDtos,
        int requestId,
        int createdBy,
        int? hodApproverId = null,
        RequestStatus initialStatus = RequestStatus.PendingWithHod)
    {
        var items = new List<AccessItemEntity>();

        foreach (var dto in itemDtos)
        {
            var item = new AccessItemEntity
            {
                AccessReqId        = requestId,
                TicketNumber       = TicketNumberGenerator.Generate(),
                Status             = initialStatus,
                FolderPath         = dto.FolderPath,
                AccessType         = dto.AccessType,
                ConfirmAccessType  = dto.AccessType,
                Reason             = dto.Reason,
                HodApproverId      = hodApproverId,
                IsActive           = true,
                CreatedOn          = DateTime.UtcNow,
                CreatedBy          = createdBy
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
        CmplUser user)
    {
        // 1. Notify the user: confirm receipt with ticket numbers
        var ticketList = string.Join(", ", items.Select(i => i.TicketNumber));
        await notificationService.NotifyUserAsync(
            userId: user.Id,
            role: "User",
            title: "Access Request Submitted",
            message: $"Your request has been submitted. Tickets: {ticketList}",
            type: "RequestSubmitted",
            requestId: request.AccessReqId);

        // 2. Resolve HODs for each item and notify them
        foreach (var item in items)
        {
            await NotifyHodsForItemAsync(item,
                "New Access Request Awaiting Approval",
                $"Ticket {item.TicketNumber} from {user.Name} is pending your review.",
                user.Id);
        }

        // 3. Notify all IT Operators about new request
        await notificationService.NotifyRoleGroupAsync(
            role: "It",
            title: "New Access Request",
            message: $"{items.Count} new item(s) submitted by {user.Name} await HOD approval.",
            type: "NewRequest",
            requestId: request.AccessReqId);
    }

    /// <summary>
    /// Resolves the folder's HOD and the user's department HOD.
    /// If they differ, notifies both; otherwise notifies just one.
    /// </summary>
    private async Task NotifyHodsForItemAsync(
        AccessItemEntity item, string title, string message, int actorUserId)
    {
        var folderMapping = await db.FolderMappings
            .FirstOrDefaultAsync(f => f.FolderName == item.FolderPath);

        // Collect unique HOD userIds to notify
        var hodUserIds = new HashSet<int>();

        // Folder's primary HOD
        if (folderMapping?.PrimaryHodId is not null
            && int.TryParse(folderMapping.PrimaryHodId, out var foldPrimaryHodId))
            hodUserIds.Add(foldPrimaryHodId);

        // Folder's secondary HOD (if exists)
        if (folderMapping?.SecondaryHodId is not null
            && int.TryParse(folderMapping.SecondaryHodId, out var foldSecondHodId))
            hodUserIds.Add(foldSecondHodId);

        // User's department HOD
        var user = await cmplDb.CmplUsers.FirstOrDefaultAsync(u => u.Id == actorUserId);
        if (user?.DepartmentId is not null)
        {
            var dept = await db.Departments.FirstOrDefaultAsync(d => d.Id == user.DepartmentId);
            if (dept?.HodId is not null && int.TryParse(dept.HodId, out var deptHodId))
                hodUserIds.Add(deptHodId);
        }

        // If folder HOD ≠ user dept HOD, both already added above
        // Notify all resolved HODs
        foreach (var hodId in hodUserIds)
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
    }

    private static AccessReqAuditEntity BuildAudit(int requestId, int? itemId,
        string eventType, string message, int actorUserId) => new()
    {
        AccessReqId   = requestId,
        AccessItemId  = itemId,
        EventType     = eventType,
        Message       = message,
        ActorUserId   = actorUserId,
        RecipientUserId = actorUserId,
        RecipientName = string.Empty,
        RecipientRole = string.Empty,
        IsActive      = true,
        CreatedOn     = DateTime.UtcNow,
        CreatedBy     = actorUserId
    };

    private static AccessRequestDetailDto MapToDetailDto(AccessRequestEntity r) => new(
        r.AccessReqId,
        r.UserId,
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
            i.ApprovedAtUtc,
            i.ExpiresAtUtc
        )).ToList()
    );

    private static AccessRequestSummaryDto MapToSummaryDto(AccessRequestEntity r) => new(
        r.AccessReqId,
        r.CurrentStatus,
        r.ItsrNo,
        r.CreatedOn,
        r.AccessItems.Count,
        r.AccessItems.Count(i => i.Status == RequestStatus.ItApproved),
        r.AccessItems.Count(i => i.Status is RequestStatus.HodRejected or RequestStatus.ItRejected)
    );
}
