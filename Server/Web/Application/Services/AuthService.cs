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

    public async Task<LoginResponseDto?> LoginAsync(string identifier, string password)
    {
        await AppDataSeeder.SeedIfNeededAsync(_db, _env, _logger);

        var cmpl = await _db.CmplUsers.FirstOrDefaultAsync(c =>
            c.CmplUserName.ToLower() == identifier.ToLower()
            || (!string.IsNullOrWhiteSpace(c.MailId)
                && c.MailId!.ToLower() == identifier.ToLower()));

        if (cmpl == null)
            return null;

        var user = await _db.Users.FindAsync(cmpl.CmplUserId);

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

        DepartmentDto? departmentDto = null;
        HodDto? hodDto = null;

        if (cmpl.DeptId != null && cmpl.DeptId != 0)
        {
            var dept = await _db.Departments.FindAsync(cmpl.DeptId.Value);

            if (dept != null)
            {
                departmentDto = new DepartmentDto(dept.DeptId, dept.DeptName);

                if (dept.HodId != null && dept.HodId != 0)
                {
                    var hod = await _db.HodMasters.FindAsync(dept.HodId.Value);

                    if (hod != null)
                    {
                        hodDto = new HodDto(
                            hod.IdRow,
                            hod.HodName,
                            hod.Id,
                            hod.EmailId,
                            hod.MobNo
                        );
                    }
                }
            }
        }

        return new LoginResponseDto
        {
            CmplUser = new CmplUserDto(
                cmpl.CmplUserId,
                cmpl.CmplUserName,
                cmpl.EmpId,
                cmpl.MailId,
                cmpl.MobNo,
                cmpl.DeptId
            ),
            User = new UserDto(user.UserId, user.Role, user.Location),
            Department = departmentDto,
            Hod = hodDto
        };
    }
}
