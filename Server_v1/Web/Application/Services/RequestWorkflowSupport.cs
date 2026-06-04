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

    public static string GetTargetFolder(string fullPath)
    {
        if (string.IsNullOrWhiteSpace(fullPath))
            return string.Empty;

        // 1. Remove the network prefix
        string prefix = @"\\10.30.50.15\jipl\";
        if (fullPath.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
        {
            fullPath = fullPath.Substring(prefix.Length);
        }

        // 2. Get the first folder segment
        string[] segments = fullPath.Split(new[] { '\\', '/' }, StringSplitOptions.RemoveEmptyEntries);

        return segments.Length > 0 ? segments[0] : string.Empty;
    }

    public static async Task<int?> ResolveMappedHodApproverAsync(
        AppDbContext db,
        CmplDbContext cmplDb,
        HodDbContext hodDb,
        int requesterUserId,
        string folderPath)
    {
        var parentFolder = GetTargetFolder(folderPath);

        var mapping = await db.FolderMappings
            .FirstOrDefaultAsync(f => f.FolderName.ToLower() == parentFolder.ToLower());

        if (mapping is null)
            return null;

        var primary = await ResolveUserIdAsync(
            db,
            cmplDb,
            mapping.PrimaryHodId,
            mapping.PrimaryHodEmail,
            mapping.PrimaryHodName);

        var secondary = await ResolveUserIdAsync(
            db,
            cmplDb,
            mapping.SecondaryHodId,
            mapping.SecondaryHodEmail,
            mapping.SecondaryHodName);

        var requester = await cmplDb.CmplUsers.FindAsync(requesterUserId);
        if (requester?.DepartmentId is > 0)
        {
            var department = await db.Departments.FindAsync(requester.DepartmentId.Value);

            if (!string.IsNullOrWhiteSpace(department?.HodId))
            {
                var hod = await hodDb.HodMasters
                    .FirstOrDefaultAsync(h => h.EmployeeId == department.HodId || h.UserId.ToString() == department.HodId);
                var requesterDeptHodUserId = await ResolveUserIdAsync(
                    db,
                    cmplDb,
                    hod?.EmployeeId,
                    hod?.Email,
                    hod?.Name);
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

    public static async Task<int?> ResolveRequesterDeptHodApproverAsync(
        AppDbContext db,
        CmplDbContext cmplDb,
        HodDbContext hodDb,
        int requesterUserId)
    {
        var requester = await cmplDb.CmplUsers.FindAsync(requesterUserId);
        if (requester?.DepartmentId is not > 0)
            return null;

        var department = await db.Departments.FindAsync(requester.DepartmentId.Value);
        if (string.IsNullOrWhiteSpace(department?.HodId))
            return null;

        var hod = await hodDb.HodMasters
            .FirstOrDefaultAsync(h => h.EmployeeId == department.HodId || h.UserId.ToString() == department.HodId);
        return await ResolveUserIdAsync(
            db,
            cmplDb,
            hod?.EmployeeId,
            hod?.Email,
            hod?.Name);
    }

    public static async Task<IReadOnlyList<int>> GetItUserIdsAsync(AppDbContext db)
    {
        return await db.Users
            .Where(u => u.Role.ToLower() == "it" || u.Role.ToLower() == "admin")
            .Select(u => u.Id)
            .ToListAsync();
    }

    public static async Task<AccessRequestDto?> BuildRequestDtoAsync(AppDbContext db, CmplDbContext cmplDb, int accessReqId)
    {
        var request = await db.AccessRequests.FindAsync(accessReqId);
        if (request is null)
            return null;

        var requester = await cmplDb.CmplUsers.FindAsync(request.UserId);

        var items = await db.AccessItems
            .Where(i => i.AccessReqId == accessReqId)
            .OrderBy(i => i.AccessItemId)
            .ToListAsync();

        var itemIds = items.Select(i => i.AccessItemId).ToList();

        var approvals = await db.AccessApprovals
            .Where(a => itemIds.Contains(a.AccessItemId))
            .OrderBy(a => a.CreatedOn)
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
                        a.CreatedOn))
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
                    item.CreatedOn,
                    item.ModifiedOn ?? item.CreatedOn,
                    item.ApprovedAtUtc,
                    item.ExpiresAtUtc,
                    itemApprovals ?? Array.Empty<AccessApprovalDto>());
            })
            .ToList();

        return new AccessRequestDto(
            request.AccessReqId,
            request.UserId,
            requester?.Name ?? string.Empty,
            requester?.Email,
            request.ReqTo,
            request.IsAgreed,
            request.ItsrNo,
            request.CurrentStatus,
            request.CurrentApproverId,
            request.CreatedOn,
            request.ModifiedOn ?? request.CreatedOn,
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
        request.ModifiedOn = DateTime.UtcNow;
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
        CmplDbContext cmplDb,
        string? employeeId,
        string? email,
        string? name)
    {
        if (!string.IsNullOrWhiteSpace(employeeId))
        {
            var byEmployeeId = await cmplDb.CmplUsers
                .FirstOrDefaultAsync(c => c.EmployeeId != null && c.EmployeeId.ToLower() == employeeId.ToLower());

            if (byEmployeeId is not null)
                return byEmployeeId.Id;
        }

        if (!string.IsNullOrWhiteSpace(email))
        {
            var byEmail = await cmplDb.CmplUsers
                .FirstOrDefaultAsync(c => c.Email != null && c.Email.ToLower() == email.ToLower());

            if (byEmail is not null)
                return byEmail.Id;
        }

        if (!string.IsNullOrWhiteSpace(name))
        {
            var byName = await cmplDb.CmplUsers
                .FirstOrDefaultAsync(c => c.Name.ToLower() == name.ToLower());

            if (byName is not null)
                return byName.Id;
        }

        return null;
    }

    public static async Task<string?> ResolveEmailAsync(AppDbContext db, CmplDbContext cmplDb, int userId)
    {
        var cmplUser = await cmplDb.CmplUsers.FindAsync(userId);
        return cmplUser?.Email;
    }
}
