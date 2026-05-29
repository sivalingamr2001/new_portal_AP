using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Web.Domain.Dto;
using Web.Domain.Entities;
using Web.Infrastructure.Data;

namespace Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly AppDbContext _db;

    public UserController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users = await _db.Users
            .OrderBy(u => u.UserId)
            .ToListAsync();

        var userIds = users.Select(u => u.UserId).ToList();

        var cmplUsers = await _db.CmplUsers
            .Where(c => userIds.Contains(c.CmplUserId))
            .ToDictionaryAsync(c => c.CmplUserId);

        var deptIds = cmplUsers.Values
            .Where(c => c.DeptId != null && c.DeptId != 0)
            .Select(c => c.DeptId!.Value)
            .Distinct()
            .ToList();

        var departments = await _db.Departments
            .Where(d => deptIds.Contains(d.DeptId))
            .ToDictionaryAsync(d => d.DeptId);

        var hodIds = departments.Values
            .Where(d => d.HodId != null && d.HodId != 0)
            .Select(d => d.HodId!.Value)
            .Distinct()
            .ToList();

        var hods = await _db.HodMasters
            .Where(h => hodIds.Contains(h.IdRow))
            .ToDictionaryAsync(h => h.IdRow);

        var response = users
            .Select(user => BuildUserResponse(user, cmplUsers, departments, hods))
            .ToList();

        return Ok(response);
    }

    [HttpGet("{userId:int}")]
    public async Task<IActionResult> GetById(int userId)
    {
        var user = await _db.Users.FindAsync(userId);

        if (user is null)
            return NotFound();

        var cmplUser = await _db.CmplUsers.FindAsync(userId);
        Department? department = null;
        HodMaster? hod = null;

        if (cmplUser?.DeptId is > 0)
        {
            department = await _db.Departments.FindAsync(cmplUser.DeptId.Value);

            if (department?.HodId is > 0)
                hod = await _db.HodMasters.FindAsync(department.HodId.Value);
        }

        return Ok(BuildUserResponse(user, cmplUser, department, hod));
    }

    [HttpPut("{userId}")]
    public async Task<IActionResult> UpdateUser(int userId, [FromBody] UpdateUserRequest request)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user is null)
        {
            user = new User
            {
                UserId = userId,
                Role = request.Role ?? "User",
                Location = request.Location ?? "Default"
            };
            _db.Users.Add(user);
        }
        else
        {
            user.Role = request.Role ?? user.Role;
            user.Location = request.Location ?? user.Location;
            _db.Users.Update(user);
        }

        await _db.SaveChangesAsync();
        return Ok(new UserDto(user.UserId, user.Role, user.Location));
    }

    private static LoginResponseDto BuildUserResponse(
        User user,
        IReadOnlyDictionary<int, CmplUser> cmplUsers,
        IReadOnlyDictionary<int, Department> departments,
        IReadOnlyDictionary<int, HodMaster> hods)
    {
        cmplUsers.TryGetValue(user.UserId, out var cmplUser);

        Department? department = null;
        if (cmplUser?.DeptId is > 0)
            departments.TryGetValue(cmplUser.DeptId.Value, out department);

        HodMaster? hod = null;
        if (department?.HodId is > 0)
            hods.TryGetValue(department.HodId.Value, out hod);

        return BuildUserResponse(user, cmplUser, department, hod);
    }

    private static LoginResponseDto BuildUserResponse(
        User user,
        CmplUser? cmplUser,
        Department? department,
        HodMaster? hod)
    {
        return new LoginResponseDto
        {
            CmplUser = new CmplUserDto(
                cmplUser?.CmplUserId ?? user.UserId,
                cmplUser?.CmplUserName ?? string.Empty,
                cmplUser?.EmpId,
                cmplUser?.MailId,
                cmplUser?.MobNo,
                cmplUser?.DeptId
            ),
            User = new UserDto(user.UserId, user.Role, user.Location),
            Department = department is null
                ? null
                : new DepartmentDto(department.DeptId, department.DeptName),
            Hod = hod is null
                ? null
                : new HodDto(hod.IdRow, hod.HodName, hod.Id, hod.EmailId, hod.MobNo)
        };
    }

    public sealed record UpdateUserRequest(string? Role, string? Location);
}
