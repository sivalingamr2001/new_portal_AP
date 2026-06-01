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

    public UserController(AppDbContext db)
    {
        _db = db;
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

        var users = await (
            from u in _db.Users

            join cu in _db.CmplUsers
                on u.UserId equals cu.CmplUserId into cuGroup
            from cu in cuGroup.DefaultIfEmpty()

            join d in _db.Departments
                on cu.DeptId equals d.DeptId into deptGroup
            from d in deptGroup.DefaultIfEmpty()

            join h in _db.HodMasters
                on d.HodId equals h.IdRow into hodGroup
            from h in hodGroup.DefaultIfEmpty()

            orderby u.UserId

            select new LoginResponseDto
            {
                CmplUser = new CmplUserDto(
                    cu != null ? cu.CmplUserId : u.UserId,
                    cu != null ? cu.CmplUserName : "",
                    cu != null ? cu.EmpId : null,
                    cu != null ? cu.MailId : null,
                    cu != null ? cu.MobNo : null,
                    cu != null ? cu.DeptId : null
                ),

                User = new UserDto(
                    u.UserId,
                    u.Role,
                    u.Location
                ),

                Department = d == null
                    ? null
                    : new DepartmentDto(
                        d.DeptId,
                        d.DeptName
                    ),

                Hod = h == null
                    ? null
                    : new HodDto(
                        h.IdRow,
                        h.HodName,
                        h.Id,
                        h.EmailId,
                        h.MobNo
                    )
            }
        )
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

        return Ok(
            Result.Success(
                new PagedResult<LoginResponseDto>(
                    users,
                    totalCount,
                    page,
                    pageSize)));
    }

    [HttpGet("search")]
    public async Task<ActionResult<Result<LoginResponseDto>>> GetUser(
    [FromQuery] int? userId,
    [FromQuery] string? employeeId,
    [FromQuery] string? emailId)
    {
        var query =
            from u in _db.Users

            join cu in _db.CmplUsers
                on u.UserId equals cu.CmplUserId into cuGroup
            from cu in cuGroup.DefaultIfEmpty()

            join d in _db.Departments
                on cu.DeptId equals d.DeptId into deptGroup
            from d in deptGroup.DefaultIfEmpty()

            join h in _db.HodMasters
                on d.HodId equals h.IdRow into hodGroup
            from h in hodGroup.DefaultIfEmpty()

            select new
            {
                User = u,
                CmplUser = cu,
                Department = d,
                Hod = h
            };

        if (userId.HasValue)
        {
            query = query.Where(x =>
                x.User.UserId == userId.Value);
        }
        else if (!string.IsNullOrWhiteSpace(employeeId))
        {
            query = query.Where(x =>
                x.CmplUser != null &&
                x.CmplUser.EmpId == employeeId);
        }
        else if (!string.IsNullOrWhiteSpace(emailId))
        {
            query = query.Where(x =>
                x.CmplUser != null &&
                x.CmplUser.MailId == emailId);
        }
        else
        {
            return BadRequest(
                Result.Failure<LoginResponseDto>(
                    new Error("400",
                        "Provide userId, employeeId, or emailId")));
        }

        var result = await query.FirstOrDefaultAsync();

        if (result == null)
        {
            return NotFound(
                Result.Failure<LoginResponseDto>(
                    new Error("404", "User not found")));
        }

        var response = new LoginResponseDto
        {
            CmplUser = new CmplUserDto(
                result.CmplUser?.CmplUserId ?? result.User.UserId,
                result.CmplUser?.CmplUserName ?? "",
                result.CmplUser?.EmpId,
                result.CmplUser?.MailId,
                result.CmplUser?.MobNo,
                result.CmplUser?.DeptId
            ),

            User = new UserDto(
                result.User.UserId,
                result.User.Role,
                result.User.Location
            ),

            Department = result.Department == null
                ? null
                : new DepartmentDto(
                    result.Department.DeptId,
                    result.Department.DeptName
                ),

            Hod = result.Hod == null
                ? null
                : new HodDto(
                    result.Hod.IdRow,
                    result.Hod.HodName,
                    result.Hod.Id,
                    result.Hod.EmailId,
                    result.Hod.MobNo
                )
        };

        return Ok(Result.Success(response));
    }

    [HttpPut("{userId}")]
    public async Task<ActionResult<Result<LoginResponseDto>>> UpdateUser(int userId, [FromBody] UpdateUserRequest request)
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
        var cmplUser = await _db.CmplUsers.FindAsync(userId);
        var response = BuildUserResponse(user, cmplUser, null, null);
        return Ok(Result.Success(response));
    }

    [HttpGet("hods")]
    public async Task<ActionResult<Result<List<HodDto>>>> GetAllHods()
    {
        var hods = await _db.HodMasters
            .Select(h => new HodDto(h.IdRow, h.HodName, h.Id, h.EmailId, h.MobNo))
            .ToListAsync();
        return Ok(Result.Success(hods));
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
