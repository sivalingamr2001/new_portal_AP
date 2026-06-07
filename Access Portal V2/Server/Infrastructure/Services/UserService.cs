using Microsoft.EntityFrameworkCore;
using Server.Core.Domain.Dto;
using Server.Core.Domain.Entities;
using Server.Core.Interfaces;
using Server.Infrastructure.Data;

namespace Server.Infrastructure.Services;

public sealed class UserService(
    IdentityDbContext identityDb,
    AppDbContext appDb) : IUserService
{
    /// <summary>
    /// Advanced Query Engine: Slices, filters, and searches cross-database user rows cleanly.
    /// </summary>
    public async Task<PaginatedListDto<UserProfileResponseDto>> GetPagedAndFilteredUsersAsync(
        string? searchTerm, string? roleFilter, string? locationFilter, int pageNumber, int pageSize)
    {
        // 1. Instantiate an queryable execution graph over Connection 1 (Read-Only)
        var accountQuery = identityDb.Users.AsNoTracking();

        // 2. Apply Case-Insensitive multi-field text search filters database-side
        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            string searchLower = searchTerm.ToLower();
            accountQuery = accountQuery.Where(u =>
                (u.UserName != null && u.UserName.ToLower().Contains(searchLower)) ||
                (u.MailId != null && u.MailId.ToLower().Contains(searchLower)) ||
                (u.EmpId != null && u.EmpId.ToLower().Contains(searchLower)));
        }

        // 3. Gather cross-connection sub-filters from Connection 2 (Portal Db) if explicit roles or locations are queried
        if (!string.IsNullOrWhiteSpace(roleFilter) || !string.IsNullOrWhiteSpace(locationFilter))
        {
            var detailQuery = appDb.UserDetails.AsNoTracking().Where(ud => ud.IsActive);

            if (!string.IsNullOrWhiteSpace(roleFilter))
            {
                detailQuery = detailQuery.Where(ud => ud.UserRole.ToLower() == roleFilter.ToLower());
            }

            if (!string.IsNullOrWhiteSpace(locationFilter))
            {
                detailQuery = detailQuery.Where(ud => ud.Location != null && ud.Location.ToLower() == locationFilter.ToLower());
            }

            // Extract the matching keys from connection 2 to constraint our connection 1 query bounds
            var matchingUserIds = await detailQuery.Select(ud => ud.UserId).ToListAsync();
            accountQuery = accountQuery.Where(u => matchingUserIds.Contains(u.UserId));
        }

        // 4. Compute Total Matching Row Counts before applying page skip truncations
        int totalMatchingCount = await accountQuery.CountAsync();

        // 5. Apply server-side pagination slicing limits onto the query generation tree
        var slicedAccounts = await accountQuery
            .OrderBy(u => u.UserId) // Explicit deterministic sorting prevents paging layout duplicates
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var accountIds = slicedAccounts.Select(a => a.UserId).ToList();

        // 6. Execute highly optimized single-query lookup dictionary fetch over Connection 2
        var detailsLookup = await appDb.UserDetails
            .AsNoTracking()
            .Where(ud => accountIds.Contains(ud.UserId))
            .ToDictionaryAsync(ud => ud.UserId);

        // 7. Stitch components and wrap in our pagination envelope model
        var mappedResults = slicedAccounts.Select(a => MapToDto(a, detailsLookup.GetValueOrDefault(a.UserId)));

        return new PaginatedListDto<UserProfileResponseDto>(mappedResults, totalMatchingCount, pageNumber, pageSize);
    }

    public async Task<UserProfileResponseDto?> GetUserByIdAsync(int userId)
    {
        var account = await identityDb.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == userId);
        if (account == null) return null;

        var details = await appDb.UserDetails.AsNoTracking().FirstOrDefaultAsync(ud => ud.UserId == userId);
        return MapToDto(account, details);
    }

    public async Task<UserProfileResponseDto?> GetUserByEmailAsync(string email)
    {
        if (string.IsNullOrWhiteSpace(email)) return null;

        var account = await identityDb.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.MailId != null && u.MailId.ToLower() == email.ToLower());

        if (account == null) return null;

        var details = await appDb.UserDetails.AsNoTracking().FirstOrDefaultAsync(ud => ud.UserId == account.UserId);
        return MapToDto(account, details);
    }

    public async Task<UserProfileResponseDto?> GetUserByEmpIdAsync(string empId)
    {
        if (string.IsNullOrWhiteSpace(empId)) return null;

        var account = await identityDb.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.EmpId != null && u.EmpId.ToLower() == empId.ToLower());

        if (account == null) return null;

        var details = await appDb.UserDetails.AsNoTracking().FirstOrDefaultAsync(ud => ud.UserId == account.UserId);
        return MapToDto(account, details);
    }

    private static UserProfileResponseDto MapToDto(UserAccount account, UserDetail? details)
    {
        return new UserProfileResponseDto
        {
            UserId = account.UserId,
            UserName = account.UserName ?? string.Empty,
            UserKey = account.UserKey,
            MobileNo = account.MobileNo,
            MailId = account.MailId,
            DeptId = account.DeptId,
            EmpId = account.EmpId,
            UserRole = details?.UserRole ?? "User",
            Location = details?.Location,
            IsActive = account.IsActive
        };
    }

        public async Task<PaginatedListDto<HodUserDto>> GetAllHodsAsync()
    {
        var hodUserIds = await appDb.UserDetails
            .AsNoTracking()
            .Where(x => x.UserRole == "Hod")
            .Select(x => x.UserId)
            .ToListAsync();

        var hodUsers = await identityDb.Users
            .AsNoTracking()
            .Where(x => hodUserIds.Contains(x.UserId))
            .ToListAsync();

        var result = hodUsers.Select(x => new HodUserDto
        {
            UserId = x.UserId,
            UserName = x.UserName,
            Email = x.MailId,
            DepartmentId = x.DeptId
        }).ToList();

        return new PaginatedListDto<HodUserDto>(result, result.Count, 1, result.Count == 0 ? 1 : result.Count);
    }

    public async Task<HodUserDto?> GetHodByDepartmentIdAsync(int departmentId)
    {
        var hodUserIds = await appDb.UserDetails
            .AsNoTracking()
            .Where(x => x.UserRole == "Hod")
            .Select(x => x.UserId)
            .ToListAsync();

        var hodUser = await identityDb.Users
            .AsNoTracking()
            .Where(x => x.DeptId == departmentId && hodUserIds.Contains(x.UserId))
            .FirstOrDefaultAsync();

        if (hodUser == null)
            return null;

        return new HodUserDto
        {
            UserId = hodUser.UserId,
            UserName = hodUser.UserName,
            Email = hodUser.MailId,
            DepartmentId = hodUser.DeptId
        };
    }
}
