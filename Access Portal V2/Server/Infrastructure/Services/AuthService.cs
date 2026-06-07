using Microsoft.EntityFrameworkCore;
using Server.Core.Domain.Dto;
using Server.Core.Interfaces;
using Server.Infrastructure.Data;

namespace Server.Infrastructure.Services;

public sealed class AuthService(
    IdentityDbContext identityDb,
    AppDbContext appDb) : IAuthService
{
    public async Task<AuthSessionResponseDto?> AuthenticateUserAsync(string userName, string userKey)
    {
        if (string.IsNullOrWhiteSpace(userName) || string.IsNullOrWhiteSpace(userKey))
        {
            return null;
        }

        // 1. Validate credentials and pull core user data from Connection 1 (Read-Only)
        var userAccount = await identityDb.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserName == userName && u.UserKey == userKey);

        // Fail-fast boundary if credential pairs do not map to an existing record
        if (userAccount == null)
        {
            return null;
        }

        // 2. Fetch specific application role and location scopes from Connection 2 (Portal Db)
        var portalDetails = await appDb.UserDetails
            .AsNoTracking()
            .FirstOrDefaultAsync(ud => ud.UserId == userAccount.UserId && ud.IsActive);

        // 3. Fabricate enriched session state response schema
        return new AuthSessionResponseDto
        {
            UserId = userAccount.UserId,
            UserName = userAccount.UserName ?? string.Empty,
            UserKey = userAccount.UserKey,
            MobileNo = userAccount.MobileNo,
            MailId = userAccount.MailId,
            DeptId = userAccount.DeptId,
            EmpId = userAccount.EmpId,

            // Default to foundational access boundaries if detail records have not been seeded yet
            UserRole = portalDetails?.UserRole ?? "User",
            Location = portalDetails?.Location
        };
    }
}
