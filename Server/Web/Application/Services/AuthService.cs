using Microsoft.EntityFrameworkCore;
using Web.Application.Interfaces;
using Web.Domain.Dto;
using Web.Domain.Entities;
using Web.Infrastructure.Data;

namespace Web.Application.Services;

public sealed class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly CmplDbContext _cmplDb;
    private readonly HodDbContext _hodDb;
    private readonly IHostEnvironment _env;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        AppDbContext db,
        CmplDbContext cmplDb,
        HodDbContext hodDb,
        IHostEnvironment env,
        ILogger<AuthService> logger)
    {
        _db = db;
        _cmplDb = cmplDb;
        _hodDb = hodDb;
        _env = env;
        _logger = logger;
    }

    public async Task<LoginResponseDto?> LoginAsync(string identifier, string password)
    {
        var demoEmployeeIds = new[] { "E001", "E002", "E003", "E004" };
        CmplUser? cmpl = null;
        string lowerIdentifier = identifier.ToLower();

        if (demoEmployeeIds.Contains(identifier, StringComparer.OrdinalIgnoreCase) && password == "password")
        {
            cmpl = await _cmplDb.CmplUsers
                .FirstOrDefaultAsync(c => c.EmployeeId != null && c.EmployeeId.ToLower() == lowerIdentifier);
        }
        else
        {
            cmpl = await _cmplDb.CmplUsers
                .FirstOrDefaultAsync(c =>
                    (c.Name != null && c.Name.ToLower() == lowerIdentifier) ||
                    (!string.IsNullOrWhiteSpace(c.Email) && c.Email.ToLower() == lowerIdentifier));
        }

        if (cmpl == null)
            return null;

        var user = await _db.Users.FindAsync(cmpl.Id);

        if (user == null)
        {
            user = new User
            {
                Id = cmpl.Id,
                Role = "User",
                Location = "Default"
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();
        }

        // 3. Fetch related department out of AppDbContext
        var department = cmpl.DepartmentId.HasValue
            ? await _db.Departments.FirstOrDefaultAsync(d => d.Id == cmpl.DepartmentId.Value)
            : null;

        HodMaster? hod = null;
        if (department != null && !string.IsNullOrWhiteSpace(department.HodId))
        {
            // Query from HodDbContext using primary key configurations
            hod = await _hodDb.HodMasters.FirstOrDefaultAsync(h => h.EmployeeId == department.HodId);
        }

        // 4. Map entities onto clean Data Transfer Objects
        return new LoginResponseDto
        {
            User = new UserProfile(
                Id: user.Id,
                Name: cmpl.Name ?? string.Empty,
                Role: user.Role,
                Location: user.Location,
                EmployeeId: cmpl.EmployeeId,
                Email: cmpl.Email,
                MobileNumber: cmpl.MobileNumber,
                DepartmentId: cmpl.DepartmentId
            ),
            Department = department == null ? null : new DepartmentDto(
                Id: department.Id,
                Name: department.Name,
                HodId: department.HodId ?? string.Empty
            ),
            HeadOfDepartment = hod == null ? null : new HodDto(
                Id: hod.UserId,
                Name: hod.Name ?? string.Empty,
                EmployeeId: hod.EmployeeId,
                Email: hod.Email,
                MobileNumber: hod.MobileNumber
            )
        };
    }
}
