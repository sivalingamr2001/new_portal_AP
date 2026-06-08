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

        // 2. Extract valid HodId values (greater than 0)
        var hodUserIds = depts
            .Where(d => d.HodId > 0)
            .Select(d => d.HodId)
            .Distinct()
            .ToList();

        // 3. Query HodMasters using the integer UserId, not EmployeeId
        var hodsList = isTestEnv
            ? await db.HodMasters.Where(h => hodUserIds.Contains(h.UserId) && h.Deleted == 0).ToListAsync()
            : await hodDb.HodMasters.Where(h => hodUserIds.Contains(h.UserId) && h.Deleted == 0).ToListAsync();

        // Map into an integer-keyed Dictionary
        var hods = hodsList.ToDictionary(h => h.UserId);

        // 4. Map the collections using integer lookups
        var data = depts.Select(d =>
        {
            HodMaster? hod = null;

            // Check if HodId has a valid value greater than 0
            if (d.HodId.HasValue && d.HodId.Value > 0)
            {
                // Use .Value to safely convert int? to int for the dictionary lookup
                hods.TryGetValue(d.HodId.Value, out hod);
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

        if (dept.HodId > 0)
        {
            hod = await hodContext.FirstOrDefaultAsync(h => h.UserId == dept.HodId && h.Deleted == 0);
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
        // Assuming dto.HodId arrives as a string/int from request, convert cleanly to integer
        int targetHodId = 0;
        if (dto.HodId != null)
        {
            int.TryParse(dto.HodId.ToString(), out targetHodId);
        }

        if (targetHodId > 0)
        {
            // Validate that the target HOD is a portal user with Role = "Hod"
            var hodPortalUser = await db.Users
                .FirstOrDefaultAsync(u => u.Id == targetHodId && u.Role == "Hod");

            if (hodPortalUser is null)
                return Result.Failure<int>(
                    Error.NotFound("DEPT_003", "The specified user is not authorized as an HOD."));
        }

        var dept = new Department
        {
            Name = dto.Name,
            HodId = targetHodId, // Stores integer directly (0 if invalid/empty)
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

        int targetHodId = 0;
        if (dto.HodId != null)
        {
            int.TryParse(dto.HodId.ToString(), out targetHodId);
        }

        if (targetHodId > 0)
        {
            // Validate that the target HOD is a portal user with Role = "Hod"
            var hodPortalUser = await db.Users
                .FirstOrDefaultAsync(u => u.Id == targetHodId && u.Role == "Hod");

            if (hodPortalUser is null)
            {
                return Result.Failure(
                    Error.NotFound("DEPT_003", "The specified user is not authorized as an HOD."));
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
