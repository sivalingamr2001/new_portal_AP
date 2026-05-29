using Microsoft.EntityFrameworkCore;
using Web.Application.Interfaces;
using Web.Domain.Dto;
using Web.Domain.Entities;
using Web.Domain.Enums;
using Web.Infrastructure.Data;

namespace Web.Application.Services;

public sealed class ApprovalService : IApprovalService
{
    private readonly AppDbContext _db;
    private readonly INotificationService _notificationService;

    public ApprovalService(
        AppDbContext db,
        INotificationService notificationService)
    {
        _db = db;
        _notificationService = notificationService;
    }

    public async Task<AccessRequestDto?> ApproveByHodAsync(int accessReqId, int accessItemId, ApprovalActionRequestDto request)
    {
        var loaded = await LoadContextAsync(accessReqId, accessItemId);
        if (loaded is null)
            return null;
        var context = loaded.Value;

        EnsureHodApprovalAllowed(context.Item, request.ApproverId);

        context.Item.Status = RequestStatus.PendingWithIt;
        context.Item.RejectionReason = null;
        context.Item.LastActionAtUtc = DateTime.UtcNow;

        await AddApprovalAsync(
            accessReqId,
            accessItemId,
            request.ApproverId,
            RequestStatus.HodApproved,
            "HOD",
            request.Comments);

        await RequestWorkflowSupport.UpdateRequestAggregateAsync(_db, context.Request);
        await _db.SaveChangesAsync();

        var itUsers = await RequestWorkflowSupport.GetItUserIdsAsync(_db);

        await _notificationService.SendStageNotificationAsync(
            accessReqId,
            accessItemId,
            "HodApproved",
            $"Ticket {context.Item.TicketNumber} approved by HOD and moved to IT cart.",
            new[] { context.Request.UserId },
            request.ApproverId);

        await _notificationService.SendStageNotificationAsync(
            accessReqId,
            accessItemId,
            "PendingWithIt",
            $"Ticket {context.Item.TicketNumber} is waiting for IT verification.",
            itUsers,
            request.ApproverId);

        return await RequestWorkflowSupport.BuildRequestDtoAsync(_db, accessReqId);
    }

    public async Task<AccessRequestDto?> RejectByHodAsync(int accessReqId, int accessItemId, ApprovalActionRequestDto request)
    {
        var loaded = await LoadContextAsync(accessReqId, accessItemId);
        if (loaded is null)
            return null;
        var context = loaded.Value;

        EnsureHodApprovalAllowed(context.Item, request.ApproverId);

        context.Item.Status = RequestStatus.HodRejected;
        context.Item.RejectionReason = request.Comments?.Trim();
        context.Item.LastActionAtUtc = DateTime.UtcNow;

        await AddApprovalAsync(
            accessReqId,
            accessItemId,
            request.ApproverId,
            RequestStatus.HodRejected,
            "HOD",
            request.Comments);

        await RequestWorkflowSupport.UpdateRequestAggregateAsync(_db, context.Request);
        await _db.SaveChangesAsync();

        await _notificationService.SendStageNotificationAsync(
            accessReqId,
            accessItemId,
            "HodRejected",
            $"Ticket {context.Item.TicketNumber} was rejected by HOD. Reason: {context.Item.RejectionReason}",
            new[] { context.Request.UserId },
            request.ApproverId);

        return await RequestWorkflowSupport.BuildRequestDtoAsync(_db, accessReqId);
    }

    public async Task<AccessRequestDto?> ApproveByItAsync(int accessReqId, int accessItemId, ApprovalActionRequestDto request)
    {
        var loaded = await LoadContextAsync(accessReqId, accessItemId);
        if (loaded is null)
            return null;
        var context = loaded.Value;

        await EnsureItActionAllowedAsync(context.Item, request.ApproverId);

        context.Item.Status = RequestStatus.ItApproved;
        context.Item.ItApproverId = request.ApproverId;
        context.Item.RejectionReason = null;
        context.Item.ConfirmAccessType = request.ConfirmAccessType ?? context.Item.ConfirmAccessType;
        context.Item.ApprovedAtUtc = DateTime.UtcNow;
        context.Item.ExpiresAtUtc = context.Item.ApprovedAtUtc.Value.AddDays(90);
        context.Item.LastActionAtUtc = DateTime.UtcNow;

        await AddApprovalAsync(
            accessReqId,
            accessItemId,
            request.ApproverId,
            RequestStatus.ItApproved,
            "IT",
            request.Comments);

        await RequestWorkflowSupport.UpdateRequestAggregateAsync(_db, context.Request);
        await _db.SaveChangesAsync();

        var recipients = new List<int> { context.Request.UserId };
        if (context.Item.HodApproverId is not null)
            recipients.Add(context.Item.HodApproverId.Value);

        await _notificationService.SendStageNotificationAsync(
            accessReqId,
            accessItemId,
            "ItApproved",
            $"Ticket {context.Item.TicketNumber} approved by IT. Access granted until {context.Item.ExpiresAtUtc:yyyy-MM-dd}.",
            recipients,
            request.ApproverId);

        return await RequestWorkflowSupport.BuildRequestDtoAsync(_db, accessReqId);
    }

    public async Task<AccessRequestDto?> RejectByItAsync(int accessReqId, int accessItemId, ApprovalActionRequestDto request)
    {
        var loaded = await LoadContextAsync(accessReqId, accessItemId);
        if (loaded is null)
            return null;
        var context = loaded.Value;

        await EnsureItActionAllowedAsync(context.Item, request.ApproverId);

        context.Item.Status = RequestStatus.ItRejected;
        context.Item.ItApproverId = request.ApproverId;
        context.Item.RejectionReason = request.Comments?.Trim();
        context.Item.LastActionAtUtc = DateTime.UtcNow;
        context.Item.ApprovedAtUtc = null;
        context.Item.ExpiresAtUtc = null;

        await AddApprovalAsync(
            accessReqId,
            accessItemId,
            request.ApproverId,
            RequestStatus.ItRejected,
            "IT",
            request.Comments);

        await RequestWorkflowSupport.UpdateRequestAggregateAsync(_db, context.Request);
        await _db.SaveChangesAsync();

        var recipients = new List<int> { context.Request.UserId };
        if (context.Item.HodApproverId is not null)
            recipients.Add(context.Item.HodApproverId.Value);

        await _notificationService.SendStageNotificationAsync(
            accessReqId,
            accessItemId,
            "ItRejected",
            $"Ticket {context.Item.TicketNumber} was rejected by IT. Reason: {context.Item.RejectionReason}",
            recipients,
            request.ApproverId);

        return await RequestWorkflowSupport.BuildRequestDtoAsync(_db, accessReqId);
    }

    public async Task<AccessRequestDto?> ResubmitAsync(int accessReqId, int accessItemId, ResubmitAccessRequestDto request)
    {
        var loaded = await LoadContextAsync(accessReqId, accessItemId);
        if (loaded is null)
            return null;
        var context = loaded.Value;

        if (context.Request.UserId != request.UserId)
            throw new InvalidOperationException("Only the request owner can resubmit.");

        if (context.Item.Status != RequestStatus.HodRejected && context.Item.Status != RequestStatus.ItRejected)
            throw new InvalidOperationException("Only rejected requests can be resubmitted.");

        var hodApproverId = await RequestWorkflowSupport.ResolveMappedHodApproverAsync(
            _db,
            request.UserId,
            context.Item.FolderPath);

        if (hodApproverId is null)
            throw new InvalidOperationException($"No HOD mapping found for folder path '{context.Item.FolderPath}'.");

        context.Item.AccessType = request.AccessType ?? context.Item.AccessType;
        context.Item.ConfirmAccessType = request.ConfirmAccessType ?? context.Item.ConfirmAccessType;
        context.Item.Reason = request.Reason.Trim();
        context.Item.RejectionReason = null;
        context.Item.Status = RequestStatus.PendingWithHod;
        context.Item.HodApproverId = hodApproverId;
        context.Item.ItApproverId = null;
        context.Item.ApprovedAtUtc = null;
        context.Item.ExpiresAtUtc = null;
        context.Item.LastActionAtUtc = DateTime.UtcNow;

        await RequestWorkflowSupport.UpdateRequestAggregateAsync(_db, context.Request);
        await _db.SaveChangesAsync();

        await _notificationService.SendStageNotificationAsync(
            accessReqId,
            accessItemId,
            "Resubmitted",
            $"Ticket {context.Item.TicketNumber} has been resubmitted and moved to HOD cart.",
            new[] { request.UserId, hodApproverId.Value },
            request.UserId);

        return await RequestWorkflowSupport.BuildRequestDtoAsync(_db, accessReqId);
    }

    public async Task<AccessRequestDto?> RevokeAsync(int accessReqId, int accessItemId, ApprovalActionRequestDto request)
    {
        var loaded = await LoadContextAsync(accessReqId, accessItemId);
        if (loaded is null)
            return null;
        var context = loaded.Value;

        await EnsureItActionAllowedAsync(context.Item, request.ApproverId);

        if (context.Item.Status != RequestStatus.ItApproved)
            throw new InvalidOperationException("Only IT approved requests can be revoked.");

        context.Item.Status = RequestStatus.Revoked;
        context.Item.LastActionAtUtc = DateTime.UtcNow;
        context.Item.ExpiresAtUtc = DateTime.UtcNow;
        context.Item.ItApproverId = request.ApproverId;

        await AddApprovalAsync(
            accessReqId,
            accessItemId,
            request.ApproverId,
            RequestStatus.Revoked,
            "IT",
            request.Comments);

        await RequestWorkflowSupport.UpdateRequestAggregateAsync(_db, context.Request);
        await _db.SaveChangesAsync();

        var recipients = new List<int> { context.Request.UserId };
        if (context.Item.HodApproverId is not null)
            recipients.Add(context.Item.HodApproverId.Value);

        await _notificationService.SendStageNotificationAsync(
            accessReqId,
            accessItemId,
            "Revoked",
            $"Ticket {context.Item.TicketNumber} has been revoked by IT.",
            recipients,
            request.ApproverId);

        return await RequestWorkflowSupport.BuildRequestDtoAsync(_db, accessReqId);
    }

    public async Task<int> ExpireApprovedRequestsAsync(DateTime utcNow)
    {
        var expiringItems = await _db.AccessItems
            .Where(i => i.Status == RequestStatus.ItApproved
                && i.ExpiresAtUtc != null
                && i.ExpiresAtUtc <= utcNow)
            .ToListAsync();

        if (expiringItems.Count == 0)
            return 0;

        var requestIds = expiringItems
            .Select(i => i.AccessReqId)
            .Distinct()
            .ToList();

        var requests = await _db.AccessRequests
            .Where(r => requestIds.Contains(r.AccessReqId))
            .ToDictionaryAsync(r => r.AccessReqId);

        var itUsers = await RequestWorkflowSupport.GetItUserIdsAsync(_db);

        foreach (var item in expiringItems)
        {
            item.Status = RequestStatus.Expired;
            item.LastActionAtUtc = utcNow;

            var request = requests[item.AccessReqId];

            await _notificationService.SendStageNotificationAsync(
                request.AccessReqId,
                item.AccessItemId,
                "Expired",
                $"Ticket {item.TicketNumber} has expired and access is revoked automatically.",
                BuildRecipients(request.UserId, item.HodApproverId, itUsers),
                null);
        }

        foreach (var request in requests.Values)
            await RequestWorkflowSupport.UpdateRequestAggregateAsync(_db, request);

        await _db.SaveChangesAsync();
        return expiringItems.Count;
    }

    private async Task<(AccessRequestEntity Request, AccessItemEntity Item)?> LoadContextAsync(int accessReqId, int accessItemId)
    {
        var request = await _db.AccessRequests.FindAsync(accessReqId);
        if (request is null)
            return null;

        var item = await _db.AccessItems
            .FirstOrDefaultAsync(i => i.AccessItemId == accessItemId && i.AccessReqId == accessReqId);

        if (item is null)
            return null;

        return (request, item);
    }

    private void EnsureHodApprovalAllowed(AccessItemEntity item, int approverId)
    {
        if (item.Status != RequestStatus.PendingWithHod)
            throw new InvalidOperationException("This item is not pending with HOD.");

        if (item.HodApproverId != approverId)
            throw new InvalidOperationException("This HOD is not assigned to the request.");
    }

    private async Task EnsureItActionAllowedAsync(AccessItemEntity item, int approverId)
    {
        if (item.Status != RequestStatus.PendingWithIt && item.Status != RequestStatus.ItApproved)
            throw new InvalidOperationException("This item is not available in the IT cart.");

        var user = await _db.Users.FindAsync(approverId);
        if (user is null || !RequestWorkflowSupport.IsItRole(user.Role))
            throw new InvalidOperationException("Only IT or Admin users can perform this action.");
    }

    private async Task<AccessApprovalEntity> AddApprovalAsync(
        int accessReqId,
        int accessItemId,
        int approverId,
        RequestStatus status,
        string approvalLevel,
        string? comments)
    {
        var approval = new AccessApprovalEntity
        {
            AccessReqId = accessReqId,
            AccessItemId = accessItemId,
            ApproverId = approverId,
            ApprovalStatus = status,
            ApprovalLevel = approvalLevel,
            Comments = comments?.Trim() ?? string.Empty,
            ActionedAtUtc = DateTime.UtcNow
        };

        _db.AccessApprovals.Add(approval);
        await _db.SaveChangesAsync();
        return approval;
    }

    private static IReadOnlyCollection<int> BuildRecipients(
        int requesterUserId,
        int? hodApproverId,
        IReadOnlyList<int> itUserIds)
    {
        var result = new List<int> { requesterUserId };

        if (hodApproverId is not null)
            result.Add(hodApproverId.Value);

        result.AddRange(itUserIds);
        return result.Distinct().ToList();
    }
}
