using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Web.Domain.Common;
using Web.Domain.Dto;
using Web.Domain.Entities;
using Web.Infrastructure.Data;

namespace Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DepartmentController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly CmplDbContext _cmplDb;
    private readonly HodDbContext _hodDb;

    public DepartmentController(AppDbContext db, CmplDbContext cmplDb, HodDbContext hodDb)
    {
        _db = db;
        _cmplDb = cmplDb;
        _hodDb = hodDb;
    }

    [HttpGet]
    public async Task<ActionResult<Result<PagedResult<DepartmentResponseDto>>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        if (page < 1 || pageSize < 1 || pageSize > 100)
            return BadRequest(Result.Failure(new Error("InvalidPagination", "Invalid pagination parameters")));

        var totalCount = await _db.Departments.CountAsync();
        var skip = (page - 1) * pageSize;

        var departments = await _db.Departments
            .OrderBy(d => d.Id)
            .Skip(skip)
            .Take(pageSize)
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

        var deptIds = departments.Select(d => d.Id).ToList();

        var usersByDepartment = await _cmplDb.CmplUsers
            .Where(c => c.DepartmentId != null && deptIds.Contains(c.DepartmentId.Value))
            .GroupBy(c => c.DepartmentId!.Value)
            .ToDictionaryAsync(
                group => group.Key,
                group => (IReadOnlyList<UserProfile>)group
                    .OrderBy(c => c.Name)
                    .Select(c => new UserProfile(
                        c.Id,
                        c.Name,
                        string.Empty,
                        string.Empty,
                        c.EmployeeId,
                        c.Email,
                        c.MobileNumber,
                        c.DepartmentId
                    ))
                    .ToList());

        var response = departments
            .Select(department => BuildDepartmentResponse(department, hodLookup, usersByDepartment))
            .ToList();

        return Ok(Result.Success(new PagedResult<DepartmentResponseDto>(response, totalCount, page, pageSize)));
    }

    [HttpGet("{deptId:int}")]
    public async Task<ActionResult<Result<DepartmentResponseDto>>> GetById(int deptId)
    {
        var department = await _db.Departments.FindAsync(deptId);

        if (department is null)
            return NotFound(Result.Failure<DepartmentResponseDto>(new Error("NotFound", "Department not found")));

        HodMaster? hod = null;

        if (!string.IsNullOrWhiteSpace(department.HodId))
        {
            hod = await _hodDb.HodMasters
                .FirstOrDefaultAsync(h => h.EmployeeId == department.HodId || h.UserId.ToString() == department.HodId);
        }

        var users = await _cmplDb.CmplUsers
            .Where(c => c.DepartmentId == deptId)
            .OrderBy(c => c.Name)
            .Select(c => new UserProfile(
                c.Id,
                c.Name,
                string.Empty,
                string.Empty,
                c.EmployeeId,
                c.Email,
                c.MobileNumber,
                c.DepartmentId
            ))
            .ToListAsync();

        return Ok(Result.Success(BuildDepartmentResponse(department, hod, users)));
    }

    [HttpPut("{deptId}")]
    public async Task<ActionResult<Result<DepartmentResponseDto>>> UpdateDepartment(int deptId, [FromBody] UpdateDepartmentRequest request)
    {
        var dept = await _db.Departments.FindAsync(deptId);
        if (dept is null)
        {
            dept = new Department { Id = deptId, Name = request.DeptName, HodId = request.HodId };
            _db.Departments.Add(dept);
        }
        else
        {
            dept.Name = request.DeptName ?? dept.Name;
            dept.HodId = request.HodId ?? dept.HodId;
            _db.Departments.Update(dept);
        }

        await _db.SaveChangesAsync();

        HodMaster? hod = null;
        if (!string.IsNullOrWhiteSpace(dept.HodId))
            hod = await _hodDb.HodMasters
                .FirstOrDefaultAsync(h => h.EmployeeId == dept.HodId || h.UserId.ToString() == dept.HodId);

        var users = await _cmplDb.CmplUsers
            .Where(c => c.DepartmentId == deptId)
            .OrderBy(c => c.Name)
            .Select(c => new UserProfile(
                c.Id,
                c.Name,
                string.Empty,
                string.Empty,
                c.EmployeeId,
                c.Email,
                c.MobileNumber,
                c.DepartmentId
            ))
            .ToListAsync();

        return Ok(Result.Success(BuildDepartmentResponse(dept, hod, users)));
    }

    private static DepartmentResponseDto BuildDepartmentResponse(
        Department department,
        IReadOnlyDictionary<string, HodMaster> hods,
        IReadOnlyDictionary<int, IReadOnlyList<UserProfile>> usersByDepartment)
    {
        HodMaster? hod = null;
        if (!string.IsNullOrWhiteSpace(department.HodId))
            hods.TryGetValue(department.HodId, out hod);

        usersByDepartment.TryGetValue(department.Id, out var users);
        return BuildDepartmentResponse(department, hod, users ?? Array.Empty<UserProfile>());
    }

    private static DepartmentResponseDto BuildDepartmentResponse(
        Department department,
        HodMaster? hod,
        IReadOnlyList<UserProfile> users)
    {
        return new DepartmentResponseDto(
            new DepartmentDto(department.Id, department.Name, department.HodId ?? string.Empty),
            hod is null ? null : new HodDto(hod.UserId, hod.Name, hod.EmployeeId, hod.Email, hod.MobileNumber),
            users
        );
    }

    public sealed record UpdateDepartmentRequest(string? DeptName, string? HodId);
}
