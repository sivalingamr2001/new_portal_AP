using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Web.Domain.Common;
using Web.Domain.Dto;
using Web.Domain.Entities;
using Web.Infrastructure.Data;

namespace Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly CmplDbContext _cmplDb;
    private readonly HodDbContext _hodDb;

    public UserController(AppDbContext db, CmplDbContext cmplDb, HodDbContext hodDb)
    {
        _db = db;
        _cmplDb = cmplDb;
        _hodDb = hodDb;
    }

    [HttpGet]
    public async Task<ActionResult<Result<PagedResult<LoginResponseDto>>>> GetAll(
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 10)
    {
        if (page < 1 || pageSize < 1)
        {
            return BadRequest(
                Result.Failure(
                    new Error("400", "Invalid pagination parameters")));
        }

        var totalCount = await _db.Users.CountAsync();

        var pageUsers = await _db.Users
            .OrderBy(u => u.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        if (pageUsers.Count == 0)
        {
            return Ok(Result.Success(new PagedResult<LoginResponseDto>(new List<LoginResponseDto>(), totalCount, page, pageSize)));
        }

        var userIds = pageUsers.Select(u => u.Id).ToList();
        var cmplUsers = await _cmplDb.CmplUsers
            .Where(c => userIds.Contains(c.Id))
            .ToListAsync();

        var departmentIds = cmplUsers
            .Where(c => c.DepartmentId is > 0)
            .Select(c => c.DepartmentId!.Value)
            .Distinct()
            .ToList();

        var departments = await _db.Departments
            .Where(d => departmentIds.Contains(d.Id))
            .ToListAsync();

        var hodIds = departments
            .Where(d => !string.IsNullOrWhiteSpace(d.HodId))
            .Select(d => d.HodId!.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var hods = await _hodDb.HodMasters
            .ToListAsync();

        var hodLookup = hods
            .Where(h => hodIds.Contains(h.EmployeeId ?? string.Empty) || hodIds.Contains(h.UserId.ToString()))
            .GroupBy(h => h.EmployeeId ?? h.UserId.ToString(), StringComparer.OrdinalIgnoreCase)
            .Select(g => g.First())
            .ToDictionary(h => h.EmployeeId ?? h.UserId.ToString(), StringComparer.OrdinalIgnoreCase);

        var cmplUserLookup = cmplUsers.ToDictionary(c => c.Id, c => c);
        var departmentLookup = departments.ToDictionary(d => d.Id, d => d);

        var response = pageUsers
            .Select(u =>
            {
                var cmplUser = cmplUserLookup.GetValueOrDefault(u.Id);
                Department? department = null;

                if (cmplUser?.DepartmentId is > 0 && departmentLookup.TryGetValue(cmplUser.DepartmentId.Value, out var foundDepartment))
                {
                    department = foundDepartment;
                }

                HodMaster? hod = null;
                if (!string.IsNullOrWhiteSpace(department?.HodId) && hodLookup.TryGetValue(department.HodId, out var foundHod))
                {
                    hod = foundHod;
                }

                return BuildUserResponse(u, cmplUser, department, hod);
            })
            .ToList();

        return Ok(
            Result.Success(
                new PagedResult<LoginResponseDto>(
                    response,
                    totalCount,
                    page,
                    pageSize)));
    }

    [HttpGet("search")]
    public async Task<ActionResult<Result<LoginResponseDto>>> GetUser(
    [FromQuery] int? userId,
    [FromQuery] string? employeeId,
    [FromQuery] string? eEmail)
    {
        if (userId.HasValue)
        {
            var user = await _db.Users.FindAsync(userId.Value);
            if (user is null)
            {
                return NotFound(Result.Failure<LoginResponseDto>(new Error("404", "User not found")));
            }

            var cmplUser = await _cmplDb.CmplUsers.FirstOrDefaultAsync(c => c.Id == user.Id);
            var department = cmplUser?.DepartmentId is > 0
                ? await _db.Departments.FindAsync(cmplUser.DepartmentId.Value)
                : null;
            var hod = !string.IsNullOrWhiteSpace(department?.HodId)
                ? await _hodDb.HodMasters.FirstOrDefaultAsync(h => h.EmployeeId == department.HodId || h.UserId.ToString() == department.HodId)
                : null;

            return Ok(Result.Success(BuildUserResponse(user, cmplUser, department, hod)));
        }

        if (!string.IsNullOrWhiteSpace(employeeId))
        {
            var cmplUser = await _cmplDb.CmplUsers.FirstOrDefaultAsync(c => c.EmployeeId == employeeId);
            if (cmplUser is null)
            {
                return NotFound(Result.Failure<LoginResponseDto>(new Error("404", "User not found")));
            }

            var user = await _db.Users.FindAsync(cmplUser.Id);
            if (user is null)
            {
                return NotFound(Result.Failure<LoginResponseDto>(new Error("404", "User not found")));
            }

            var department = cmplUser.DepartmentId is > 0
                ? await _db.Departments.FindAsync(cmplUser.DepartmentId.Value)
                : null;
            var hod = !string.IsNullOrWhiteSpace(department?.HodId)
                ? await _hodDb.HodMasters.FirstOrDefaultAsync(h => h.EmployeeId == department.HodId || h.UserId.ToString() == department.HodId)
                : null;

            return Ok(Result.Success(BuildUserResponse(user, cmplUser, department, hod)));
        }

        if (!string.IsNullOrWhiteSpace(eEmail))
        {
            var cmplUser = await _cmplDb.CmplUsers.FirstOrDefaultAsync(c => c.Email == eEmail);
            if (cmplUser is null)
            {
                return NotFound(Result.Failure<LoginResponseDto>(new Error("404", "User not found")));
            }

            var user = await _db.Users.FindAsync(cmplUser.Id);
            if (user is null)
            {
                return NotFound(Result.Failure<LoginResponseDto>(new Error("404", "User not found")));
            }

            var department = cmplUser.DepartmentId is > 0
                ? await _db.Departments.FindAsync(cmplUser.DepartmentId.Value)
                : null;
            var hod = !string.IsNullOrWhiteSpace(department?.HodId)
                ? await _hodDb.HodMasters.FirstOrDefaultAsync(h => h.EmployeeId == department.HodId || h.UserId.ToString() == department.HodId)
                : null;

            return Ok(Result.Success(BuildUserResponse(user, cmplUser, department, hod)));
        }

        return BadRequest(Result.Failure<LoginResponseDto>(new Error("400", "Provide userId, employeeId, or eEmail")));
    }

    [HttpPut("{userId}")]
    public async Task<ActionResult<Result<LoginResponseDto>>> UpdateUser(int userId, [FromBody] UpdateUserRequest request)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user is null)
        {
            user = new User
            {
                Id = userId,
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

        var response = await BuildUserResponseAsync(userId);
        return Ok(Result.Success(response));
    }

    [HttpGet("hods")]
    public async Task<ActionResult<Result<List<HodDto>>>> GetAllHods()
    {
        var hods = await _hodDb.HodMasters
            .Select(h => new HodDto(h.UserId, h.Name, h.EmployeeId, h.Email, h.MobileNumber))
            .ToListAsync();
        return Ok(Result.Success(hods));
    }

    private async Task<LoginResponseDto> BuildUserResponseAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user is null)
        {
            return BuildUserResponse(new User { Id = userId }, null, null, null);
        }

        var cmplUser = await _cmplDb.CmplUsers.FirstOrDefaultAsync(c => c.Id == user.Id);
        var department = cmplUser?.DepartmentId is > 0
            ? await _db.Departments.FindAsync(cmplUser.DepartmentId.Value)
            : null;
        var hod = !string.IsNullOrWhiteSpace(department?.HodId)
            ? await _hodDb.HodMasters.FirstOrDefaultAsync(h => h.EmployeeId == department.HodId || h.UserId.ToString() == department.HodId)
            : null;

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
            User = new UserProfile(
                Id: cmplUser?.Id ?? user.Id,
                Name: cmplUser?.Name ?? string.Empty,
                Role: user.Role,
                Location: user.Location,
                EmployeeId: cmplUser?.EmployeeId,
                Email: cmplUser?.Email,
                MobileNumber: cmplUser?.MobileNumber,
                DepartmentId: cmplUser?.DepartmentId
            ),
            Department = department is null
                ? null
                : new DepartmentDto(department.Id, department.Name, department.HodId ?? string.Empty),
            HeadOfDepartment = hod is null
                ? null
                : new HodDto(hod.UserId, hod.Name, hod.EmployeeId, hod.Email, hod.MobileNumber)
        };
    }



    public sealed record UpdateUserRequest(string? Role, string? Location);
}
