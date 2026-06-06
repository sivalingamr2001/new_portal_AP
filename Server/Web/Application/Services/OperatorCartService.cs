using Microsoft.EntityFrameworkCore;
using Web.Application.Interfaces;
using Web.Domain.Common;
using Web.Domain.Dto.AccessRequest;
using Web.Domain.Entities;
using Web.Domain.Enums;
using Web.Infrastructure.Data;

namespace Web.Application.Services;

public sealed class OperatorCartService(
    AppDbContext db,
    CmplDbContext cmplDb,
    INotificationService notificationService) : IOperatorCartService
{
    public async Task<PagedResult<OperatorCartItemDto>> GetCartAsync(
        int page,
        int pageSize,
        RequestStatus? status)
    {
        bool isTestEnv = db.Database.IsSqlite();

        var query = db.AccessItems
            .Include(i => i.AccessRequest)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(i => i.Status == status.Value);
        }

        var total = await query.CountAsync();

        // 1. Fetch the raw items from the main DB first
        var dbItems = await query
            .OrderByDescending(i => i.CreatedOn)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        // 2. Extract all unique Requester User IDs from this page to avoid loading all users
        var uniqueUserIds = dbItems
            .Select(i => i.AccessRequest.UserId)
            .Distinct()
            .ToList();

        // 3. Query the user database to map UserIds to Department Names
        var userContext = isTestEnv ? db.CmplUsers.AsQueryable() : cmplDb.CmplUsers.AsQueryable();

        var userDeptMap = await (from u in userContext
                                 join d in db.Departments on u.DepartmentId equals d.Id
                                 where uniqueUserIds.Contains(u.Id)
                                 select new { UserId = u.Id, DeptName = d.Name })
                                 .ToDictionaryAsync(x => x.UserId, x => x.DeptName ?? "N/A");

        // 4. Map everything into the final DTO array with individual department names
        var items = dbItems.Select(i => new OperatorCartItemDto(
            i.AccessItemId,
            i.AccessReqId,
            i.TicketNumber,
            i.FolderPath,
            i.AccessType,
            i.ConfirmAccessType,
            i.Status,
            i.Reason,
            i.HodApproverId,
            i.AccessRequest.UserId,
            userDeptMap.TryGetValue(i.AccessRequest.UserId, out var deptName) ? deptName : "N/A", // Injected department name here
            i.CreatedOn
        )).ToList();

        return new PagedResult<OperatorCartItemDto>(items, total, page, pageSize);
    }


    public async Task<Result> ApproveItemAsync(int accessItemId, string comments, int operatorUserId)
    {
        var item = await GetPendingItemAsync(accessItemId, RequestStatus.PendingWithIt);
        if (item is null)
            return Result.Failure(Error.NotFound("ITEM_007", "Item not in operator cart."));

        var now = DateTime.UtcNow;

        item.Status = RequestStatus.ItApproved;
        item.ItApproverId = operatorUserId;
        item.ApprovedAtUtc = now;
        item.ExpiresAtUtc = now.AddDays(90);
        item.ModifiedOn = now;
        item.ModifiedBy = operatorUserId;

        db.AccessApprovals.Add(new AccessApprovalEntity
        {
            AccessReqId = item.AccessReqId,
            AccessItemId = item.AccessItemId,
            ApproverId = operatorUserId,
            ApprovalStatus = RequestStatus.ItApproved,
            ApprovalLevel = "IT",
            Comments = comments,
            IsActive = true,
            CreatedOn = now,
            CreatedBy = operatorUserId
        });

        db.AccessReqAudits.Add(new AccessReqAuditEntity
        {
            AccessReqId = item.AccessReqId,
            AccessItemId = item.AccessItemId,
            EventType = "ItApproved",
            Message = $"IT approved ticket {item.TicketNumber}. Access granted until {item.ExpiresAtUtc:yyyy-MM-dd}.",
            ActorUserId = operatorUserId,
            RecipientUserId = item.AccessRequest.UserId,
            RecipientName = string.Empty,
            RecipientRole = "User",
            IsActive = true,
            CreatedOn = now,
            CreatedBy = operatorUserId
        });

        await db.SaveChangesAsync();

        await notificationService.NotifyUserAsync(
            userId: item.AccessRequest.UserId,
            role: "User",
            title: "Access Granted",
            message: $"Ticket {item.TicketNumber} — access to '{item.FolderPath}' granted. " +
                     $"Valid until {item.ExpiresAtUtc:yyyy-MM-dd}.",
            type: "ItApproved",
            requestId: item.AccessReqId,
            itemId: item.AccessItemId,
            ticketNumber: item.TicketNumber);

        return Result.Success();
    }

    public async Task<Result> RejectItemAsync(int accessItemId, string rejectionReason, int operatorUserId)
    {
        var item = await GetPendingItemAsync(accessItemId, RequestStatus.PendingWithIt);
        if (item is null)
            return Result.Failure(Error.NotFound("ITEM_007", "Item not in operator cart."));

        item.Status = RequestStatus.ItRejected;
        item.RejectionReason = rejectionReason;
        item.ItApproverId = operatorUserId;
        item.ModifiedOn = DateTime.UtcNow;
        item.ModifiedBy = operatorUserId;

        db.AccessApprovals.Add(new AccessApprovalEntity
        {
            AccessReqId = item.AccessReqId,
            AccessItemId = item.AccessItemId,
            ApproverId = operatorUserId,
            ApprovalStatus = RequestStatus.ItRejected,
            ApprovalLevel = "IT",
            Comments = rejectionReason,
            IsActive = true,
            CreatedOn = DateTime.UtcNow,
            CreatedBy = operatorUserId
        });

        db.AccessReqAudits.Add(new AccessReqAuditEntity
        {
            AccessReqId = item.AccessReqId,
            AccessItemId = item.AccessItemId,
            EventType = "ItRejected",
            Message = $"IT rejected ticket {item.TicketNumber}: {rejectionReason}",
            ActorUserId = operatorUserId,
            RecipientUserId = item.AccessRequest.UserId,
            RecipientName = string.Empty,
            RecipientRole = "User",
            IsActive = true,
            CreatedOn = DateTime.UtcNow,
            CreatedBy = operatorUserId
        });

        await db.SaveChangesAsync();

        await notificationService.NotifyUserAsync(
            userId: item.AccessRequest.UserId,
            role: "User",
            title: "Access Request Rejected by IT",
            message: $"Ticket {item.TicketNumber} rejected by IT. Reason: {rejectionReason}. You may resubmit.",
            type: "ItRejected",
            requestId: item.AccessReqId,
            itemId: item.AccessItemId,
            ticketNumber: item.TicketNumber);

        return Result.Success();
    }

    public async Task<Result> RevokeItemAsync(int accessItemId, string reason, int operatorUserId)
    {
        var item = await db.AccessItems
            .Include(i => i.AccessRequest)
            .FirstOrDefaultAsync(i => i.AccessItemId == accessItemId
                                   && i.Status == RequestStatus.ItApproved);

        if (item is null)
            return Result.Failure(Error.NotFound("ITEM_008",
                "Approved item not found for revocation."));

        item.Status = RequestStatus.Revoked;
        item.ModifiedOn = DateTime.UtcNow;
        item.ModifiedBy = operatorUserId;

        db.AccessReqAudits.Add(new AccessReqAuditEntity
        {
            AccessReqId = item.AccessReqId,
            AccessItemId = item.AccessItemId,
            EventType = "Revoked",
            Message = $"IT revoked ticket {item.TicketNumber}: {reason}",
            ActorUserId = operatorUserId,
            RecipientUserId = item.AccessRequest.UserId,
            RecipientName = string.Empty,
            RecipientRole = "User",
            IsActive = true,
            CreatedOn = DateTime.UtcNow,
            CreatedBy = operatorUserId
        });

        await db.SaveChangesAsync();

        await notificationService.NotifyUserAsync(
            userId: item.AccessRequest.UserId,
            role: "User",
            title: "Access Revoked",
            message: $"Ticket {item.TicketNumber} — your access to '{item.FolderPath}' has been revoked.",
            type: "Revoked",
            requestId: item.AccessReqId,
            itemId: item.AccessItemId,
            ticketNumber: item.TicketNumber);

        return Result.Success();
    }

    public async Task<Result> OverrideAccessTypeAsync(
        int accessItemId, AccessTypes accessType, int operatorUserId)
    {
        var item = await GetPendingItemAsync(accessItemId, RequestStatus.PendingWithIt);
        if (item is null)
            return Result.Failure(Error.NotFound("ITEM_007", "Item not in operator cart."));

        item.ConfirmAccessType = accessType;
        item.ModifiedOn = DateTime.UtcNow;
        item.ModifiedBy = operatorUserId;

        await db.SaveChangesAsync();
        return Result.Success();
    }

    // ─── Private ─────────────────────────────────────────────────────────────────

    private async Task<AccessItemEntity?> GetPendingItemAsync(
        int accessItemId, RequestStatus requiredStatus)
        => await db.AccessItems
            .Include(i => i.AccessRequest)
            .FirstOrDefaultAsync(i => i.AccessItemId == accessItemId
                                   && i.Status == requiredStatus);
}
