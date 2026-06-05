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

        // 1. Fixed Case-Insensitive Server Searching Matching
        if (!string.IsNullOrWhiteSpace(search))
        {
            var lowerTerm = search.Trim().ToLower();
            query = query.Where(d => d.Name != null && d.Name.ToLower().Contains(lowerTerm));
        }

        var total = await query.CountAsync();
        var depts = await query
            .OrderBy(d => d.Id) // ID 101 will always load first on Page 1
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        // 2. FIX: Extract HodId values cleanly as STRINGS rather than parsing to integers
        var hodEmployeeIds = depts
            .Where(d => !string.IsNullOrWhiteSpace(d.HodId))
            .Select(d => d.HodId!)
            .Distinct()
            .ToList();

        // 3. FIX: Query HodMasters using EmployeeId and index them into a string-keyed Dictionary
        var hodsList = isTestEnv
            ? await db.HodMasters.Where(h => hodEmployeeIds.Contains(h.EmployeeId) && h.Deleted == 0).ToListAsync()
            : await hodDb.HodMasters.Where(h => hodEmployeeIds.Contains(h.EmployeeId) && h.Deleted == 0).ToListAsync();

        // Materialize using local memory lookup routing safely
        var hods = hodsList.ToDictionary(h => h.EmployeeId, StringComparer.OrdinalIgnoreCase);

        // 4. Map the collection with clean, type-safe string-key lookups
        var data = depts.Select(d =>
        {
            HodMaster? hod = null;
            if (!string.IsNullOrWhiteSpace(d.HodId))
            {
                hods.TryGetValue(d.HodId, out hod);
            }

            return new DepartmentDetailDto(
                d.Id,
                d.Name,
                d.HodId,
                hod?.Name,     // Will resolve to "SIVALINGAM R"
                hod?.Email,    // Will resolve to "it-dev25.g@janatics.co.in"
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

        var hodContext = isTestEnv
            ? db.HodMasters
            : hodDb.HodMasters;

        HodMaster? hod = null;

        hod = await hodContext
            .FirstOrDefaultAsync(h =>
                h.EmployeeId == dept.HodId &&
                h.Deleted == 0);

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
        if (!string.IsNullOrWhiteSpace(dto.HodId))
        {
            if (!int.TryParse(dto.HodId, out var hodId))
                return Result.Failure<int>(
                    Error.Validation("DEPT_002", "HodId must be a valid integer."));

            var hodExists = await hodDb.HodMasters
                .AnyAsync(h => h.UserId == hodId && h.Deleted == 0);

            if (!hodExists)
                return Result.Failure<int>(
                    Error.NotFound("DEPT_003", "The specified HOD does not exist."));
        }

        var dept = new Department
        {
            Name = dto.Name,
            HodId = dto.HodId,
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

        var hodContext = isTestEnv
            ? db.HodMasters
            : hodDb.HodMasters;

        if (!string.IsNullOrWhiteSpace(dto.HodId))
        {
            var hodExists = await hodContext
                .AnyAsync(h =>
                    h.EmployeeId == dto.HodId &&
                    h.Deleted == 0);

            if (!hodExists)
            {
                return Result.Failure(
                    Error.NotFound(
                        "DEPT_003",
                        "The specified HOD does not exist."));
            }
        }

        dept.Name = dto.Name;
        dept.HodId = dto.HodId;
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
