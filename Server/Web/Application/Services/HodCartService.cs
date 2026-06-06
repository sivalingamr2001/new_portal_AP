using Microsoft.EntityFrameworkCore;
using Web.Application.Interfaces;
using Web.Domain.Common;
using Web.Domain.Dto;
using Web.Domain.Entities;
using Web.Domain.Enums;
using Web.Infrastructure.Data;

namespace Web.Application.Services;

public sealed class HodCartService(
    AppDbContext db,
    CmplDbContext cmplDb,
    INotificationService notificationService) : IHodCartService
{
    public async Task<PagedResult<HodCartItemDto>> GetCartAsync(int hodUserId, int page, int pageSize)
    {
        bool isTestEnv = db.Database.IsSqlite();

        var deptIds = await db.Departments
            .Where(d => d.HodId == hodUserId)
            .Select(d => d.Id)
            .ToListAsync();

        var deptUserIds = isTestEnv
            ? await db.CmplUsers
                .Where(u => u.DepartmentId.HasValue && deptIds.Contains(u.DepartmentId!.Value))
                .Select(u => u.Id)
                .ToListAsync()
            : await cmplDb.CmplUsers
                .Where(u => u.DepartmentId.HasValue && deptIds.Contains(u.DepartmentId!.Value))
                .Select(u => u.Id)
                .ToListAsync();

        var hodOwnedFolderPaths = await db.FolderMappings
            .Where(f => f.PrimaryHodId == hodUserId || f.SecondaryHodId == hodUserId)
            .Select(f => f.FolderName)
            .ToListAsync();

        var query = db.AccessItems
            .Include(i => i.AccessRequest)
            .Where(i => i.Status == RequestStatus.PendingWithHod
                && (deptUserIds.Contains(i.AccessRequest.UserId)
                    || hodOwnedFolderPaths.Contains(i.FolderPath)))
            .OrderBy(i => i.CreatedOn);

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(i => new HodCartItemDto(
                i.AccessItemId,
                i.AccessReqId,
                i.TicketNumber,
                i.FolderPath,
                i.Status,
                i.AccessType,
                i.Reason,
                i.AccessRequest.UserId,
                i.CreatedOn
            ))
            .ToListAsync();

        return new PagedResult<HodCartItemDto>(items, total, page, pageSize);
    }

    public async Task<Result> ApproveItemAsync(int accessItemId, AccessTypes ConfirmAccessType, string comments, int hodUserId)
    {
        var item = await GetOwnedItemAsync(accessItemId, hodUserId, RequestStatus.PendingWithHod);
        if (item is null)
        {
            return Result.Failure(Error.NotFound("ITEM_005", "Item not found or not in your cart."));
        }

        // 1. Update the entity properties in memory
        item.ConfirmAccessType = ConfirmAccessType;
        item.Status = RequestStatus.PendingWithIt;
        item.HodApproverId = hodUserId;
        item.ModifiedOn = DateTime.UtcNow;
        item.ModifiedBy = hodUserId;

        // 2. Mark the entity as modified (Removed 'await' as Update is synchronous)
        db.AccessItems.Update(item);

        // 3. Stage the approval log entry
        db.AccessApprovals.Add(new AccessApprovalEntity
        {
            AccessReqId = item.AccessReqId,
            AccessItemId = item.AccessItemId,
            ApproverId = hodUserId,
            ApprovalStatus = RequestStatus.HodApproved,
            ApprovalLevel = "HOD",
            Comments = comments,
            IsActive = true,
            CreatedOn = DateTime.UtcNow,
            CreatedBy = hodUserId
        });

        // 4. Stage the audit trail entry
        db.AccessReqAudits.Add(new AccessReqAuditEntity
        {
            AccessReqId = item.AccessReqId,
            AccessItemId = item.AccessItemId,
            EventType = "HodApproved",
            Message = $"HOD approved ticket {item.TicketNumber}. Forwarded to IT.",
            ActorUserId = hodUserId,
            RecipientUserId = item.AccessRequest?.UserId ?? 0, // Fallback to 0 if AccessRequest isn't eager loaded
            RecipientName = string.Empty,
            RecipientRole = "It",
            IsActive = true,
            CreatedOn = DateTime.UtcNow,
            CreatedBy = hodUserId
        });

        // 5. Commit all pending database changes in a single transaction
        await db.SaveChangesAsync();

        // 6. Trigger external notification service
        await notificationService.NotifyRoleGroupAsync(
            role: "It",
            title: "HOD Approved — Action Required",
            message: $"Ticket {item.TicketNumber} has been approved by HOD and is pending IT review.",
            type: "HodApproved",
            requestId: item.AccessReqId,
            itemId: item.AccessItemId,
            ticketNumber: item.TicketNumber);

        return Result.Success();
    }

    public async Task<Result> RejectItemAsync(int accessItemId, string rejectionReason, int hodUserId)
    {
        var item = await GetOwnedItemAsync(accessItemId, hodUserId, RequestStatus.PendingWithHod);
        if (item is null)
            return Result.Failure(Error.NotFound("ITEM_005",
                "Item not found or not in your cart."));

        item.Status = RequestStatus.HodRejected;
        item.RejectionReason = rejectionReason;
        item.HodApproverId = hodUserId;
        item.ModifiedOn = DateTime.UtcNow;
        item.ModifiedBy = hodUserId;

        db.AccessApprovals.Add(new AccessApprovalEntity
        {
            AccessReqId = item.AccessReqId,
            AccessItemId = item.AccessItemId,
            ApproverId = hodUserId,
            ApprovalStatus = RequestStatus.HodRejected,
            ApprovalLevel = "HOD",
            Comments = rejectionReason,
            IsActive = true,
            CreatedOn = DateTime.UtcNow,
            CreatedBy = hodUserId
        });

        db.AccessReqAudits.Add(new AccessReqAuditEntity
        {
            AccessReqId = item.AccessReqId,
            AccessItemId = item.AccessItemId,
            EventType = "HodRejected",
            Message = $"HOD rejected ticket {item.TicketNumber}: {rejectionReason}",
            ActorUserId = hodUserId,
            RecipientUserId = item.AccessRequest.UserId,
            RecipientName = string.Empty,
            RecipientRole = "User",
            IsActive = true,
            CreatedOn = DateTime.UtcNow,
            CreatedBy = hodUserId
        });

        await db.SaveChangesAsync();

        // Notify the user
        await notificationService.NotifyUserAsync(
            userId: item.AccessRequest.UserId,
            role: "User",
            title: "Item Rejected by HOD",
            message: $"Ticket {item.TicketNumber} was rejected. Reason: {rejectionReason}. You may resubmit.",
            type: "HodRejected",
            requestId: item.AccessReqId,
            itemId: item.AccessItemId,
            ticketNumber: item.TicketNumber);

        return Result.Success();
    }

    public async Task<Result> ApproveAllInRequestAsync(
        int accessRequestId, string comments, int hodUserId)
    {
        var deptIds = await db.Departments
            .Where(d => d.HodId == hodUserId && d.IsActive)
            .Select(d => d.Id)
            .ToListAsync();

        var deptUserIds = await cmplDb.CmplUsers
            .Where(u => u.DepartmentId.HasValue && deptIds.Contains(u.DepartmentId!.Value))
            .Select(u => u.Id)
            .ToListAsync();

        var hodOwnedPaths = await db.FolderMappings
            .Where(f => f.PrimaryHodId == hodUserId || f.SecondaryHodId == hodUserId)
            .Select(f => f.FolderName)
            .ToListAsync();

        var items = await db.AccessItems
            .Include(i => i.AccessRequest)
            .Where(i => i.AccessReqId == accessRequestId
                && i.Status == RequestStatus.PendingWithHod
                && (deptUserIds.Contains(i.AccessRequest.UserId)
                    || hodOwnedPaths.Contains(i.FolderPath)))
            .ToListAsync();

        if (items.Count == 0)
            return Result.Failure(Error.NotFound("ITEM_006",
                "No pending items found in this request for your cart."));

        foreach (var item in items)
        {
            item.Status = RequestStatus.PendingWithIt;
            item.HodApproverId = hodUserId;
            item.ModifiedOn = DateTime.UtcNow;
            item.ModifiedBy = hodUserId;

            db.AccessApprovals.Add(new AccessApprovalEntity
            {
                AccessReqId = item.AccessReqId,
                AccessItemId = item.AccessItemId,
                ApproverId = hodUserId,
                ApprovalStatus = RequestStatus.HodApproved,
                ApprovalLevel = "HOD",
                Comments = comments,
                IsActive = true,
                CreatedOn = DateTime.UtcNow,
                CreatedBy = hodUserId
            });
        }

        await db.SaveChangesAsync();

        await notificationService.NotifyRoleGroupAsync(
            role: "It",
            title: "Bulk HOD Approval",
            message: $"{items.Count} items in Request #{accessRequestId} approved by HOD.",
            type: "BulkHodApproved",
            requestId: accessRequestId);

        return Result.Success();
    }

    // ─── Private ─────────────────────────────────────────────────────────────────

    private async Task<AccessItemEntity?> GetOwnedItemAsync(
        int accessItemId, int hodUserId, RequestStatus requiredStatus)
    {
        bool isTestEnv = db.Database.IsSqlite();

        var deptIds = await db.Departments
            .Where(d => d.HodId == hodUserId && d.IsActive)
            .Select(d => d.Id)
            .ToListAsync();

        var deptUserIds = isTestEnv ? await db.CmplUsers
            .Where(u => u.DepartmentId.HasValue && deptIds.Contains(u.DepartmentId!.Value))
            .Select(u => u.Id)
            .ToListAsync() : await cmplDb.CmplUsers
            .Where(u => u.DepartmentId.HasValue && deptIds.Contains(u.DepartmentId!.Value))
            .Select(u => u.Id)
            .ToListAsync() ;

        var hodPaths = await db.FolderMappings
            .Where(f => f.PrimaryHodId == hodUserId || f.SecondaryHodId == hodUserId)
            .Select(f => f.FolderName)
            .ToListAsync();

        return await db.AccessItems
            .Include(i => i.AccessRequest)
            .FirstOrDefaultAsync(i =>
                i.AccessItemId == accessItemId
                && i.Status == requiredStatus
                && (deptUserIds.Contains(i.AccessRequest.UserId)
                    || hodPaths.Contains(i.FolderPath)));
    }
}
