using System.Linq;
using Microsoft.EntityFrameworkCore;
using Web.Domain.Common;
using Web.Domain.Dto;
using Web.Domain.Dto.Department;
using Web.Domain.Entities;
using Web.Infrastructure.Data;

namespace Web.Application.Services;

public sealed class DepartmentService(
    AppDbContext db,
    HodDbContext hodDb) : IDepartmentService
{
    public async Task<PagedResult<DepartmentDetailDto>> GetAllAsync(
        int page, int pageSize, string? search)
    {
        bool isTestEnv = db.Database.IsSqlite();

        var query = db.Departments.Where(d => d.IsActive);

        // 1. Case-Insensitive Server Searching
        if (!string.IsNullOrWhiteSpace(search))
        {
            var lowerTerm = search.Trim().ToLower();
            query = query.Where(d => d.Name != null && d.Name.ToLower().Contains(lowerTerm));
        }

        var total = await query.CountAsync();
        var depts = await query
            .OrderBy(d => d.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        // 2. Extract valid HOD employee IDs from department records.
        var hodEmployeeIds = depts
            .Where(d => !string.IsNullOrWhiteSpace(d.HodId))
            .Select(d => d.HodId!.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        // 3. Query HodMasters by employee ID (the department HOD field is stored as CMPL employee ID).
        var hodsList = isTestEnv
            ? await db.HodMasters
                .Where(h => hodEmployeeIds.Contains(h.EmployeeId ?? string.Empty) && h.Deleted == 0)
                .ToListAsync()
            : await hodDb.HodMasters
                .Where(h => hodEmployeeIds.Contains(h.EmployeeId ?? string.Empty) && h.Deleted == 0)
                .ToListAsync();

        // Map into a string-keyed dictionary for employee-ID lookups.
        var hods = hodsList.ToDictionary(h => (h.EmployeeId ?? string.Empty).Trim(), StringComparer.OrdinalIgnoreCase);

        // 4. Map the collections using integer lookups
        var data = depts.Select(d =>
        {
            HodMaster? hod = null;

            // Check if HodId contains a valid CMPL employee ID.
            if (!string.IsNullOrWhiteSpace(d.HodId))
            {
                hods.TryGetValue(d.HodId.Trim(), out hod);
            }

            return new DepartmentDetailDto(
                d.Id,
                d.Name,
                d.HodId,
                hod?.Name,
                hod?.Email,
                d.IsActive,
                d.CreatedOn);
        }).ToList();

        return new PagedResult<DepartmentDetailDto>(data, total, page, pageSize);
    }

    public async Task<Result<DepartmentDetailDto>> GetByIdAsync(int id)
    {
        bool isTestEnv = db.Database.IsSqlite();

        var dept = await db.Departments
            .FirstOrDefaultAsync(d => d.Id == id && d.IsActive);

        if (dept is null)
        {
            return Result.Failure<DepartmentDetailDto>(
                Error.NotFound("DEPT_001", "Department not found."));
        }

        var hodContext = isTestEnv ? db.HodMasters : hodDb.HodMasters;
        HodMaster? hod = null;

        if (!string.IsNullOrWhiteSpace(dept.HodId))
        {
            hod = await hodContext.FirstOrDefaultAsync(h =>
                h.EmployeeId != null &&
                h.EmployeeId.ToLower() == dept.HodId.Trim().ToLower() &&
                h.Deleted == 0);
        }

        return Result.Success(
            new DepartmentDetailDto(
                dept.Id,
                dept.Name,
                dept.HodId,
                hod?.Name,
                hod?.Email,
                dept.IsActive,
                dept.CreatedOn));
    }

    public async Task<Result<int>> CreateAsync(UpsertDepartmentDto dto, int createdBy)
    {
        var targetHodId = dto.HodId?.Trim();

        if (!string.IsNullOrWhiteSpace(targetHodId))
        {
            var hodRecord = await hodDb.HodMasters
                .FirstOrDefaultAsync(h => h.EmployeeId != null
                    && h.EmployeeId.ToLower() == targetHodId.ToLower()
                    && h.Deleted == 0);

            if (hodRecord is null)
                return Result.Failure<int>(
                    Error.NotFound("DEPT_003", "The specified HOD employee ID is not authorized."));
        }

        var dept = new Department
        {
            Name = dto.Name,
            HodId = targetHodId,
            IsActive = true,
            CreatedOn = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        db.Departments.Add(dept);
        await db.SaveChangesAsync();
        return Result.Success(dept.Id);
    }

    public async Task<Result> UpdateAsync(int id, UpsertDepartmentDto dto, int updatedBy)
    {
        bool isTestEnv = db.Database.IsSqlite();
        var dept = await db.Departments
            .FirstOrDefaultAsync(d => d.Id == id && d.IsActive);

        if (dept is null)
        {
            return Result.Failure(
                Error.NotFound("DEPT_001", "Department not found."));
        }

        var targetHodId = dto.HodId?.Trim();

        if (!string.IsNullOrWhiteSpace(targetHodId))
        {
            var hodRecord = isTestEnv ?  await db.HodMasters
                .FirstOrDefaultAsync(h => h.EmployeeId != null
                    && h.EmployeeId.ToLower() == targetHodId.ToLower()
                    && h.Deleted == 0) : await hodDb.HodMasters
                .FirstOrDefaultAsync(h => h.EmployeeId != null
                    && h.EmployeeId.ToLower() == targetHodId.ToLower()
                    && h.Deleted == 0);

            if (hodRecord is null)
            {
                return Result.Failure(
                    Error.NotFound("DEPT_003", "The specified HOD employee ID is not authorized."));
            }
        }

        dept.Name = dto.Name;
        dept.HodId = targetHodId;
        dept.ModifiedOn = DateTime.UtcNow;
        dept.ModifiedBy = updatedBy;

        await db.SaveChangesAsync();
        return Result.Success();
    }

    public async Task<Result> DeleteAsync(int id, int deletedBy)
    {
        var dept = await db.Departments
            .FirstOrDefaultAsync(d => d.Id == id && d.IsActive);

        if (dept is null)
            return Result.Failure(Error.NotFound("DEPT_001", "Department not found."));

        dept.IsActive = false;
        dept.ModifiedOn = DateTime.UtcNow;
        dept.ModifiedBy = deletedBy;

        await db.SaveChangesAsync();
        return Result.Success();
    }
}
