using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Web.Domain.Dto;
using Web.Domain.Entities;
using Web.Infrastructure.Data;

namespace Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DepartmentController : ControllerBase
{
    private readonly AppDbContext _db;

    public DepartmentController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var departments = await _db.Departments
            .OrderBy(d => d.DeptId)
            .ToListAsync();

        var hodIds = departments
            .Where(d => d.HodId != null && d.HodId != 0)
            .Select(d => d.HodId!.Value)
            .Distinct()
            .ToList();

        var hods = await _db.HodMasters
            .Where(h => hodIds.Contains(h.IdRow))
            .ToDictionaryAsync(h => h.IdRow);

        var deptIds = departments.Select(d => d.DeptId).ToList();

        var usersByDepartment = await _db.CmplUsers
            .Where(c => c.DeptId != null && deptIds.Contains(c.DeptId.Value))
            .GroupBy(c => c.DeptId!.Value)
            .ToDictionaryAsync(
                group => group.Key,
                group => (IReadOnlyList<CmplUserDto>)group
                    .OrderBy(c => c.CmplUserName)
                    .Select(c => new CmplUserDto(
                        c.CmplUserId,
                        c.CmplUserName,
                        c.EmpId,
                        c.MailId,
                        c.MobNo,
                        c.DeptId
                    ))
                    .ToList());

        var response = departments
            .Select(department => BuildDepartmentResponse(department, hods, usersByDepartment))
            .ToList();

        return Ok(response);
    }

    [HttpGet("{deptId:int}")]
    public async Task<IActionResult> GetById(int deptId)
    {
        var department = await _db.Departments.FindAsync(deptId);

        if (department is null)
            return NotFound();

        HodMaster? hod = null;
        if (department.HodId is > 0)
            hod = await _db.HodMasters.FindAsync(department.HodId.Value);

        var users = await _db.CmplUsers
            .Where(c => c.DeptId == deptId)
            .OrderBy(c => c.CmplUserName)
            .Select(c => new CmplUserDto(
                c.CmplUserId,
                c.CmplUserName,
                c.EmpId,
                c.MailId,
                c.MobNo,
                c.DeptId
            ))
            .ToListAsync();

        return Ok(BuildDepartmentResponse(department, hod, users));
    }

    [HttpPut("{deptId}")]
    public async Task<IActionResult> UpdateDepartment(int deptId, [FromBody] UpdateDepartmentRequest request)
    {
        var dept = await _db.Departments.FindAsync(deptId);
        if (dept is null)
        {
            dept = new Department { DeptId = deptId, DeptName = request.DeptName, HodId = request.HodId };
            _db.Departments.Add(dept);
        }
        else
        {
            dept.DeptName = request.DeptName ?? dept.DeptName;
            dept.HodId = request.HodId ?? dept.HodId;
            _db.Departments.Update(dept);
        }

        await _db.SaveChangesAsync();

        HodMaster? hod = null;
        if (dept.HodId is > 0)
            hod = await _db.HodMasters.FindAsync(dept.HodId.Value);

        var users = await _db.CmplUsers
            .Where(c => c.DeptId == deptId)
            .OrderBy(c => c.CmplUserName)
            .Select(c => new CmplUserDto(
                c.CmplUserId,
                c.CmplUserName,
                c.EmpId,
                c.MailId,
                c.MobNo,
                c.DeptId
            ))
            .ToListAsync();

        return Ok(BuildDepartmentResponse(dept, hod, users));
    }

    private static DepartmentResponseDto BuildDepartmentResponse(
        Department department,
        IReadOnlyDictionary<int, HodMaster> hods,
        IReadOnlyDictionary<int, IReadOnlyList<CmplUserDto>> usersByDepartment)
    {
        HodMaster? hod = null;
        if (department.HodId is > 0)
            hods.TryGetValue(department.HodId.Value, out hod);

        usersByDepartment.TryGetValue(department.DeptId, out var users);
        return BuildDepartmentResponse(department, hod, users ?? Array.Empty<CmplUserDto>());
    }

    private static DepartmentResponseDto BuildDepartmentResponse(
        Department department,
        HodMaster? hod,
        IReadOnlyList<CmplUserDto> users)
    {
        return new DepartmentResponseDto(
            new DepartmentDto(department.DeptId, department.DeptName),
            hod is null ? null : new HodDto(hod.IdRow, hod.HodName, hod.Id, hod.EmailId, hod.MobNo),
            users
        );
    }

    public sealed record UpdateDepartmentRequest(string? DeptName, int? HodId);
}
