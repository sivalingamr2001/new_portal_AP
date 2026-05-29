using Microsoft.EntityFrameworkCore;
using Web.Domain.Dto;
using Web.Domain.Entities;
using Web.Domain.Enums;
using Web.Infrastructure.Data;

namespace Web.Application.Services;

internal static class RequestWorkflowSupport
{
    public static string NormalizeFolderPath(string folderPath) =>
        folderPath.Trim();

    public static bool IsItRole(string role) =>
        role.Equals("It", StringComparison.OrdinalIgnoreCase)
        || role.Equals("Admin", StringComparison.OrdinalIgnoreCase);

    public static async Task<int?> ResolveMappedHodApproverAsync(
        AppDbContext db,
        int requesterUserId,
        string folderPath)
    {
        var mapping = await db.FolderMappings
            .FirstOrDefaultAsync(f => f.FolderName.ToLower() == folderPath.ToLower());

        if (mapping is null)
            return null;

        var primary = await ResolveUserIdAsync(
            db,
            mapping.PrimaryHodId,
            mapping.PrimaryHodEmail,
            mapping.PrimaryHodName);

        var secondary = await ResolveUserIdAsync(
            db,
            mapping.SecondaryHodId,
            mapping.SecondaryHodEmail,
            mapping.SecondaryHodName);

        var requester = await db.CmplUsers.FindAsync(requesterUserId);
        if (requester?.DeptId is > 0)
        {
            var department = await db.Departments.FindAsync(requester.DeptId.Value);

            if (department?.HodId is > 0)
            {
                var hod = await db.HodMasters.FindAsync(department.HodId.Value);
                var requesterDeptHodUserId = await ResolveUserIdAsync(
                    db,
                    hod?.Id,
                    hod?.EmailId,
                    hod?.HodName);

                if (requesterDeptHodUserId != null)
                {
                    if (primary == requesterDeptHodUserId)
                        return primary;

                    if (secondary == requesterDeptHodUserId)
                        return secondary;
                }
            }
        }

        return primary ?? secondary;
    }

    public static async Task<IReadOnlyList<int>> GetItUserIdsAsync(AppDbContext db)
    {
        return await db.Users
            .Where(u => u.Role.ToLower() == "it" || u.Role.ToLower() == "admin")
            .Select(u => u.UserId)
            .ToListAsync();
    }

    public static async Task<AccessRequestDto?> BuildRequestDtoAsync(AppDbContext db, int accessReqId)
    {
        var request = await db.AccessRequests.FindAsync(accessReqId);
        if (request is null)
            return null;

        var requester = await db.CmplUsers.FindAsync(request.UserId);

        var items = await db.AccessItems
            .Where(i => i.AccessReqId == accessReqId)
            .OrderBy(i => i.AccessItemId)
            .ToListAsync();

        var itemIds = items.Select(i => i.AccessItemId).ToList();

        var approvals = await db.AccessApprovals
            .Where(a => itemIds.Contains(a.AccessItemId))
            .OrderBy(a => a.ActionedAtUtc)
            .ToListAsync();

        var approvalsByItem = approvals
            .GroupBy(a => a.AccessItemId)
            .ToDictionary(
                group => group.Key,
                group => (IReadOnlyList<AccessApprovalDto>)group
                    .Select(a => new AccessApprovalDto(
                        a.AccessApproveId,
                        a.AccessItemId,
                        a.ApproverId,
                        a.ApprovalLevel,
                        a.ApprovalStatus,
                        a.Comments,
                        a.ActionedAtUtc))
                    .ToList());

        var itemDtos = items
            .Select(item =>
            {
                approvalsByItem.TryGetValue(item.AccessItemId, out var itemApprovals);

                return new AccessRequestItemDto(
                    item.AccessItemId,
                    item.TicketNumber,
                    item.FolderPath,
                    item.AccessType,
                    item.ConfirmAccessType,
                    item.Reason,
                    item.RejectionReason,
                    item.Status,
                    item.HodApproverId,
                    item.ItApproverId,
                    item.RequestedAtUtc,
                    item.LastActionAtUtc,
                    item.ApprovedAtUtc,
                    item.ExpiresAtUtc,
                    itemApprovals ?? Array.Empty<AccessApprovalDto>());
            })
            .ToList();

        return new AccessRequestDto(
            request.AccessReqId,
            request.UserId,
            requester?.CmplUserName ?? string.Empty,
            requester?.MailId,
            request.ReqTo,
            request.IsAgreed,
            request.ItsrNo,
            request.CurrentStatus,
            request.CurrentApproverId,
            request.RequestedAtUtc,
            request.LastActionAtUtc,
            itemDtos);
    }

    public static async Task UpdateRequestAggregateAsync(AppDbContext db, AccessRequestEntity request)
    {
        var items = await db.AccessItems
            .Where(i => i.AccessReqId == request.AccessReqId)
            .OrderBy(i => i.AccessItemId)
            .ToListAsync();

        request.CurrentStatus = DetermineAggregateStatus(items);
        request.CurrentApproverId = items
            .FirstOrDefault(i => i.Status == RequestStatus.PendingWithHod)?.HodApproverId;
        request.ReqTo = request.CurrentApproverId ?? 0;
        request.LastActionAtUtc = DateTime.UtcNow;
    }

    public static RequestStatus DetermineAggregateStatus(IReadOnlyCollection<AccessItemEntity> items)
    {
        if (items.Any(i => i.Status == RequestStatus.PendingWithHod))
            return RequestStatus.PendingWithHod;

        if (items.Any(i => i.Status == RequestStatus.PendingWithIt))
            return RequestStatus.PendingWithIt;

        if (items.Any(i => i.Status == RequestStatus.ItApproved))
            return RequestStatus.ItApproved;

        if (items.Any(i => i.Status == RequestStatus.HodRejected))
            return RequestStatus.HodRejected;

        if (items.Any(i => i.Status == RequestStatus.ItRejected))
            return RequestStatus.ItRejected;

        if (items.Any(i => i.Status == RequestStatus.Revoked))
            return RequestStatus.Revoked;

        if (items.Any(i => i.Status == RequestStatus.Expired))
            return RequestStatus.Expired;

        return RequestStatus.Submitted;
    }

    public static async Task<int?> ResolveUserIdAsync(
        AppDbContext db,
        string? employeeId,
        string? email,
        string? name)
    {
        if (!string.IsNullOrWhiteSpace(employeeId))
        {
            var byEmpId = await db.CmplUsers
                .FirstOrDefaultAsync(c => c.EmpId != null && c.EmpId.ToLower() == employeeId.ToLower());

            if (byEmpId is not null)
                return byEmpId.CmplUserId;
        }

        if (!string.IsNullOrWhiteSpace(email))
        {
            var byEmail = await db.CmplUsers
                .FirstOrDefaultAsync(c => c.MailId != null && c.MailId.ToLower() == email.ToLower());

            if (byEmail is not null)
                return byEmail.CmplUserId;
        }

        if (!string.IsNullOrWhiteSpace(name))
        {
            var byName = await db.CmplUsers
                .FirstOrDefaultAsync(c => c.CmplUserName.ToLower() == name.ToLower());

            if (byName is not null)
                return byName.CmplUserId;
        }

        return null;
    }

    public static async Task<string?> ResolveEmailAsync(AppDbContext db, int userId)
    {
        var cmplUser = await db.CmplUsers.FindAsync(userId);
        return cmplUser?.MailId;
    }
}
