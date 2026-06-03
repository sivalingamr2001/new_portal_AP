using Microsoft.EntityFrameworkCore;
using Web.Application.Interfaces;
using Web.Domain.Dto;
using Web.Domain.Entities;
using Web.Infrastructure.Data;

namespace Web.Application.Services;

public sealed class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        AppDbContext db,
        IWebHostEnvironment env,
        ILogger<AuthService> logger)
    {
        _db = db;
        _env = env;
        _logger = logger;
    }
    public async Task<LoginResponseDto?> LoginAsync(
        string identifier,
        string password)
    {
        //await AppDataSeeder.SeedIfNeededAsync(
        //    _db,
        //    _env,
        //    _logger
        //);

        var demoEmployeeIds = new[]
        {
        "E001",
        "E002",
        "E003",
        "E004"
    };

        CmplUser? cmpl = null;

        if (demoEmployeeIds.Contains(identifier, StringComparer.OrdinalIgnoreCase) && password == "password")
        {
            cmpl = await _db.CmplUsers
                .FirstOrDefaultAsync(c =>
                    c.EmpId != null &&
                    c.EmpId.ToLower() ==
                    identifier.ToLower()
                );
        }
        else
        {
            cmpl = await _db.CmplUsers
                .FirstOrDefaultAsync(c =>
                    c.CmplUserName.ToLower() ==
                        identifier.ToLower()
                    || (
                        !string.IsNullOrWhiteSpace(
                            c.MailId
                        )
                        && c.MailId!.ToLower() ==
                            identifier.ToLower()
                    )
                );
        }

        if (cmpl == null)
            return null;

        var user = await _db.Users.FindAsync(
            cmpl.CmplUserId
        );

        if (user == null)
        {
            user = new User
            {
                UserId = cmpl.CmplUserId,
                Role = "User",
                Location = "Default"
            };

            _db.Users.Add(user);

            await _db.SaveChangesAsync();
        }

        var userDetails = await (
            from u in _db.Users
            join cu in _db.CmplUsers
                on u.UserId equals cu.CmplUserId into cuGroup
            from cmplUser in cuGroup.DefaultIfEmpty()

            join d in _db.Departments
                on cmplUser.DeptId equals d.DeptId into deptGroup
            from department in deptGroup.DefaultIfEmpty()

            join h in _db.HodMasters
                on department.HodId equals h.Id into hodGroup
            from hod in hodGroup.DefaultIfEmpty()

            where u.UserId == user.UserId

            select new
            {
                User = u,
                CmplUser = cmplUser,
                Department = department,
                Hod = hod
            }
        ).FirstOrDefaultAsync();

        var resolvedUser = userDetails?.User ?? user;
        var resolvedCmplUser = userDetails?.CmplUser ?? cmpl;
        var resolvedDepartment = userDetails?.Department;
        var resolvedHod = userDetails?.Hod;

        return new LoginResponseDto
        {
            CmplUser = new CmplUserDto(
                resolvedCmplUser?.CmplUserId ?? resolvedUser.UserId,
                resolvedCmplUser?.CmplUserName ?? string.Empty,
                resolvedCmplUser?.EmpId,
                resolvedCmplUser?.MailId,
                resolvedCmplUser?.MobNo,
                resolvedCmplUser?.DeptId
            ),
            User = new UserDto(
                resolvedUser.UserId,
                resolvedUser.Role,
                resolvedUser.Location
            ),
            Department = resolvedDepartment == null
                ? null
                : new DepartmentDto(
                    resolvedDepartment.DeptId,
                    resolvedDepartment.DeptName,
                    resolvedDepartment.HodId ?? string.Empty
                ),
            Hod = resolvedHod == null
                ? null
                : new HodDto(
                    resolvedHod.IdRow,
                    resolvedHod.HodName,
                    resolvedHod.Id,
                    resolvedHod.EmailId,
                    resolvedHod.MobNo
                )
        };
    }
}
