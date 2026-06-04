using Microsoft.EntityFrameworkCore;
using Web.Domain.Common;
using Web.Domain.Dto;
using Web.Domain.Entities;
using Web.Infrastructure.Data;

namespace Web.Application.Services;

public sealed class AuthService(
    CmplDbContext cmplDb,
    HodDbContext hodDb,
    AppDbContext db) : IAuthService
{
    public async Task<Result<LoginResponseDto>> LoginAsync(LoginRequestDto dto)
    {
        bool isTestEnv = db.Database.IsSqlite();

        var cmplUser = isTestEnv
            ? await db.CmplUsers.FirstOrDefaultAsync(u =>
                u.EmployeeId == dto.Identifier || u.Email == dto.Identifier)
            : await cmplDb.CmplUsers.FirstOrDefaultAsync(u =>
                u.EmployeeId == dto.Identifier || u.Email == dto.Identifier);

        if (cmplUser is null)
            return Result.Failure<LoginResponseDto>(
                Error.NotFound("AUTH_001", "User not found."));

        var portalUser = await db.Users.FirstOrDefaultAsync(u => u.Id == cmplUser.Id);

        if (portalUser is null || !portalUser.IsActive)
            return Result.Failure<LoginResponseDto>(
                Error.Validation("AUTH_002", "Account is inactive or not registered in the portal."));

        // Resolve department
        Department? department = null;
        HodMaster? hod = null;

        if (cmplUser.DepartmentId.HasValue)
        {
            department = await db.Departments
                .FirstOrDefaultAsync(d => d.Id == cmplUser.DepartmentId.Value && d.IsActive);

            if (department?.HodId is not null
                && int.TryParse(department.HodId, out var hodId))
            {
                hod = isTestEnv
                    ? await db.HodMasters.FirstOrDefaultAsync(h => h.UserId == hodId && h.Deleted == 0)
                    : await hodDb.HodMasters.FirstOrDefaultAsync(h => h.UserId == hodId && h.Deleted == 0);
            }
        }

        var userProfile = new UserProfile(
            Id: cmplUser.Id,
            Name: cmplUser.Name,
            Role: portalUser.Role,
            Location: portalUser.Location,
            EmployeeId: cmplUser.EmployeeId,
            Email: cmplUser.Email,
            MobileNumber: cmplUser.MobileNumber,
            DepartmentId: cmplUser.DepartmentId
        );

        return Result.Success(new LoginResponseDto
        {
            User = userProfile,
            Department = department is null ? null : new DepartmentDto(
                department.Id,
                department.Name,
                department.HodId),
            HeadOfDepartment = hod is null ? null : new HodDto(
                hod.UserId,
                hod.Name,
                hod.EmployeeId,
                hod.Email,
                hod.MobileNumber),
        });
    }
}
