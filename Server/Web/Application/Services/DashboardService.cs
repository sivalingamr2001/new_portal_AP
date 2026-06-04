using Microsoft.EntityFrameworkCore;
using Web.Domain.Dto;
using Web.Domain.Enums;
using Web.Infrastructure.Data;

namespace Web.Application.Services;

public sealed class DashboardService(AppDbContext db, CmplDbContext cmplDb) : IDashboardService
{
    public async Task<DashboardDto> GetDashboardAsync(int callerUserId, string role)
    {
        // Global stats (visible to HOD and IT)
        var allItems = await db.AccessItems.ToListAsync();

        var totalRequests        = await db.AccessRequests.CountAsync();
        var pendingWithHod       = allItems.Count(i => i.Status == RequestStatus.PendingWithHod);
        var pendingWithIt        = allItems.Count(i => i.Status == RequestStatus.PendingWithIt);
        var approvedActive       = allItems.Count(i => i.Status == RequestStatus.ItApproved);
        var hodRejected          = allItems.Count(i => i.Status == RequestStatus.HodRejected);
        var itRejected           = allItems.Count(i => i.Status == RequestStatus.ItRejected);
        var revoked              = allItems.Count(i => i.Status == RequestStatus.Revoked);
        var expired              = allItems.Count(i => i.Status == RequestStatus.Expired
                                                    || (i.ExpiresAtUtc.HasValue
                                                        && i.ExpiresAtUtc < DateTime.UtcNow
                                                        && i.Status == RequestStatus.ItApproved));

        // Per-user stats
        var userItemIds = await db.AccessRequests
            .Where(r => r.UserId == callerUserId)
            .Select(r => r.AccessReqId)
            .ToListAsync();

        var myItems = allItems.Where(i => userItemIds.Contains(i.AccessReqId)).ToList();

        // Recent requests (last 10)
        var recentRequests = await db.AccessRequests
            .Include(r => r.AccessItems)
            .OrderByDescending(r => r.CreatedOn)
            .Take(10)
            .Select(r => new RecentRequestDto(
                r.AccessReqId,
                r.UserId,
                r.CurrentStatus.ToString(),
                r.CreatedOn,
                r.AccessItems.Count
            ))
            .ToListAsync();

        // Expiring soon (within 14 days)
        var expiringSoon = allItems
            .Where(i => i.Status == RequestStatus.ItApproved
                && i.ExpiresAtUtc.HasValue
                && i.ExpiresAtUtc.Value <= DateTime.UtcNow.AddDays(14)
                && i.ExpiresAtUtc.Value > DateTime.UtcNow)
            .Count();

        return new DashboardDto(
            TotalRequests:    totalRequests,
            PendingWithHod:   pendingWithHod,
            PendingWithIt:    pendingWithIt,
            ApprovedActive:   approvedActive,
            HodRejected:      hodRejected,
            ItRejected:       itRejected,
            Revoked:          revoked,
            Expired:          expired,
            ExpiringSoon:     expiringSoon,
            MyPendingItems:   myItems.Count(i => i.Status is RequestStatus.PendingWithHod or RequestStatus.PendingWithIt),
            MyApprovedItems:  myItems.Count(i => i.Status == RequestStatus.ItApproved),
            MyRejectedItems:  myItems.Count(i => i.Status is RequestStatus.HodRejected or RequestStatus.ItRejected),
            RecentRequests:   recentRequests
        );
    }
}