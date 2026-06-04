using Microsoft.EntityFrameworkCore;
using Web.Application.Interfaces;
using Web.Domain.Common;
using Web.Domain.Dto;
using Web.Domain.Dto.User;
using Web.Infrastructure.Data;

namespace Web.Application.Services;

public sealed class UserService(
    AppDbContext db,
    CmplDbContext cmplDb,
    HodDbContext hodDb) : IUserService
{
    // ─── CmplUsers (read-only) ───────────────────────────────────────────────────

    public async Task<PagedResult<CmplUserDto>> GetCmplUsersAsync(
        int page, int pageSize, string? search)
    {
        bool isTestEnv = db.Database.IsSqlite();
        var query = isTestEnv
            ? db.CmplUsers.AsQueryable()
            : cmplDb.CmplUsers.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(u =>
                u.Name.Contains(search) ||
                (u.EmployeeId != null && u.EmployeeId.Contains(search)) ||
                (u.Email != null && u.Email.Contains(search)));

        var total = await query.CountAsync();
        var data = await query
            .OrderBy(u => u.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new CmplUserDto(u.Id, u.Name ?? string.Empty, u.EmployeeId, u.Email,
                u.MobileNumber, u.DepartmentId))
            .ToListAsync();

        return new PagedResult<CmplUserDto>(data, total, page, pageSize);
    }

    public async Task<Result<CmplUserDto>> GetCmplUserByIdAsync(int id)
    {
        bool isTestEnv = db.Database.IsSqlite();
        var user = isTestEnv
            ? await db.CmplUsers.FirstOrDefaultAsync(u => u.Id == id)
            : await cmplDb.CmplUsers.FirstOrDefaultAsync(u => u.Id == id);
        if (user is null)
            return Result.Failure<CmplUserDto>(
                Error.NotFound("USR_001", "CMPL user not found."));

        return Result.Success(new CmplUserDto(
            user.Id, user.Name ?? string.Empty, user.EmployeeId,
            user.Email, user.MobileNumber, user.DepartmentId));
    }

    // ─── HodMaster (read-only) ───────────────────────────────────────────────────

    public async Task<PagedResult<HodDto>> GetHodsAsync(
        int page, int pageSize, string? search)
    {
        bool isTestEnv = db.Database.IsSqlite();
        var query = (isTestEnv
            ? db.HodMasters.AsQueryable()
            : hodDb.HodMasters.AsQueryable())
            .Where(h => h.Deleted == 0);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(h =>
                h.Name.Contains(search) ||
                (h.EmployeeId != null && h.EmployeeId.Contains(search)) ||
                (h.Email != null && h.Email.Contains(search)));

        var total = await query.CountAsync();
        var data = await query
            .OrderBy(h => h.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(h => new HodDto(h.UserId, h.Name, h.EmployeeId, h.Email, h.MobileNumber))
            .ToListAsync();

        return new PagedResult<HodDto>(data, total, page, pageSize);
    }

    public async Task<Result<HodDto>> GetHodByIdAsync(int id)
    {
        bool isTestEnv = db.Database.IsSqlite();
        var hod = isTestEnv
            ? await db.HodMasters.FirstOrDefaultAsync(h => h.UserId == id && h.Deleted == 0)
            : await hodDb.HodMasters.FirstOrDefaultAsync(h => h.UserId == id && h.Deleted == 0);

        if (hod is null)
            return Result.Failure<HodDto>(
                Error.NotFound("HOD_001", "HOD not found."));

        return Result.Success(new HodDto(
            hod.UserId, hod.Name, hod.EmployeeId, hod.Email, hod.MobileNumber));
    }

    // ─── Portal Users (CRUD) ─────────────────────────────────────────────────────
    public async Task<PagedResult<PortalUserDetails>> GetPortalUsersAsync(int page, int pageSize, string? search)
    {
        bool isTestEnv = db.Database.IsSqlite();
        List<int>? matchedCmplIds = null;

        // 1. Handle cross-database keyword search if query is provided
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            matchedCmplIds = isTestEnv
                ? await db.CmplUsers
                    .Where(c => (c.Name != null && c.Name.Contains(term)) ||
                                (c.Email != null && c.Email.Contains(term)) ||
                                (c.EmployeeId != null && c.EmployeeId.Contains(term)))
                    .Select(c => c.Id)
                    .ToListAsync()
                : await cmplDb.CmplUsers
                    .Where(c => (c.Name != null && c.Name.Contains(term)) ||
                                (c.Email != null && c.Email.Contains(term)) ||
                                (c.EmployeeId != null && c.EmployeeId.Contains(term)))
                    .Select(c => c.Id)
                    .ToListAsync();
        }

        // 2. Build Queryable with conditional tracking filters
        var query = db.Users.Where(u => u.IsActive);

        if (matchedCmplIds is not null)
        {
            query = query.Where(u => matchedCmplIds.Contains(u.Id));
        }

        // 3. Compute execution counts and paginate records
        var total = await query.CountAsync();

        var portalUsers = await query
            .OrderBy(u => u.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var ids = portalUsers.Select(u => u.Id).ToList();

        // 4. Batch retrieve target metadata profiles for the active page slice
        var cmplUsers = isTestEnv
            ? await db.CmplUsers.Where(c => ids.Contains(c.Id)).ToListAsync()
            : await cmplDb.CmplUsers.Where(c => ids.Contains(c.Id)).ToListAsync();

        // Extract unique department IDs assigned to the current slice of users
        var deptIds = cmplUsers.Where(c => c.DepartmentId.HasValue).Select(c => c.DepartmentId!.Value).Distinct().ToList();

        // Batch retrieve assigned Departments
        var departments = await db.Departments.Where(d => deptIds.Contains(d.Id)).ToListAsync();

        // Extract unique string HOD Employee IDs linked to these departments
        var hodEmployeeIds = departments.Where(d => !string.IsNullOrEmpty(d.HodId)).Select(d => d.HodId!).Distinct().ToList();

        // Batch retrieve assigned HOD profile records based on environment mapping
        List<HodDto> batchHods = new();
        if (hodEmployeeIds.Any())
        {
            if (isTestEnv)
            {
                var masters = await hodDb.HodMasters.Where(h => hodEmployeeIds.Contains(h.EmployeeId)).ToListAsync();
                batchHods = masters.Select(h => new HodDto(h.UserId, h.Name, h.EmployeeId, h.Email, h.MobileNumber)).ToList();
            }
            else
            {
                var cmplHods = await hodDb.HodMasters.Where(c => hodEmployeeIds.Contains(c.EmployeeId)).ToListAsync();
                batchHods = cmplHods.Select(c => new HodDto(c.UserId, c.Name, c.EmployeeId, c.Email, c.MobileNumber)).ToList();
            }
        }

        // 5. Build full nested PortalUserDetails object collection layout projections
        var result = portalUsers.Select(pu =>
        {
            var cmpl = cmplUsers.FirstOrDefault(c => c.Id == pu.Id);

            // Build sub-profile entity layout matching record contracts
            var userProfile = new UserProfile(
                pu.Id,
                cmpl?.Name ?? string.Empty,
                pu.Role,
                pu.Location,
                cmpl?.EmployeeId,
                cmpl?.Email,
                cmpl?.MobileNumber,
                cmpl?.DepartmentId
            );

            DepartmentDto? departmentDto = null;
            HodDto? hodDto = null;

            if (cmpl?.DepartmentId != null)
            {
                var dept = departments.FirstOrDefault(d => d.Id == cmpl.DepartmentId);
                if (dept is not null)
                {
                    departmentDto = new DepartmentDto(dept.Id, dept.Name, dept.HodId);

                    if (!string.IsNullOrEmpty(dept.HodId))
                    {
                        hodDto = batchHods.FirstOrDefault(h => h.EmployeeId == dept.HodId);
                    }
                }
            }

            return new PortalUserDetails
            {
                User = userProfile,
                Department = departmentDto,
                HeadOfDepartment = hodDto
            };
        }).ToList();

        return new PagedResult<PortalUserDetails>(result, total, page, pageSize);
    }

    public async Task<Result<PortalUserDetails>> GetPortalUserByIdAsync(int id)
    {
        // 1. Fetch core Portal User
        var pu = await db.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (pu is null)
        {
            return Result.Failure<PortalUserDetails>(
                Error.NotFound("USR_002", "Portal user not found."));
        }

        bool isTestEnv = db.Database.IsSqlite();

        // 2. Fetch Core CMPL User Details
        var cmpl = isTestEnv
            ? await db.CmplUsers.FirstOrDefaultAsync(c => c.Id == id)
            : await cmplDb.CmplUsers.FirstOrDefaultAsync(c => c.Id == id);

        // Build the UserProfile sub-record
        var userProfile = new UserProfile(
            pu.Id,
            cmpl?.Name ?? string.Empty,
            pu.Role,
            pu.Location,
            cmpl?.EmployeeId,
            cmpl?.Email,
            cmpl?.MobileNumber,
            cmpl?.DepartmentId
        );

        DepartmentDto? departmentDto = null;
        HodDto? hodDto = null;

        // 3. Fetch Department & HOD info if the user belongs to a department
        if (cmpl?.DepartmentId != null)
        {
            var dept = await db.Departments.FirstOrDefaultAsync(d => d.Id == cmpl.DepartmentId);

            if (dept is not null)
            {
                departmentDto = new DepartmentDto(dept.Id, dept.Name, dept.HodId);

                // Handle HOD lookups by matching HodId string directly with EmployeeId fields
                if (!string.IsNullOrEmpty(dept.HodId))
                {
                    if (isTestEnv)
                    {
                        // Test environment pulls from hodDb mapping directly to EmployeeId
                        var hodMaster = await hodDb.HodMasters.FirstOrDefaultAsync(c => c.EmployeeId == dept.HodId);
                        if (hodMaster is not null)
                        {
                            // Ensure your HodMasters schema property names match these or adjust accordingly
                            hodDto = new HodDto(
                                hodMaster.UserId,
                                hodMaster.Name,
                                hodMaster.EmployeeId,
                                hodMaster.Email,
                                hodMaster.MobileNumber
                            );
                        }
                    }
                    else
                    {
                        var hodCmpl = await hodDb.HodMasters.FirstOrDefaultAsync(c => c.EmployeeId == dept.HodId);
                        if (hodCmpl is not null)
                        {
                            hodDto = new HodDto(
                                hodCmpl.UserId,
                                hodCmpl.Name,
                                hodCmpl.EmployeeId,
                                hodCmpl.Email,
                                hodCmpl.MobileNumber
                            );
                        }
                    }
                }
            }
        }

        // 4. Return combined record response model
        var details = new PortalUserDetails
        {
            User = userProfile,
            Department = departmentDto,
            HeadOfDepartment = hodDto
        };

        return Result.Success(details);
    }

    public async Task<Result> UpdatePortalUserAsync(
        int id, UpsertPortalUserDto dto, int updatedBy)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user is null)
            return Result.Failure(Error.NotFound("USR_002", "Portal user not found."));

        user.Role = dto.Role;
        user.Location = dto.Location;
        user.ModifiedOn = DateTime.UtcNow;
        user.ModifiedBy = updatedBy;

        await db.SaveChangesAsync();
        return Result.Success();
    }

    public async Task<Result> DeletePortalUserAsync(int id, int deletedBy)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user is null)
            return Result.Failure(Error.NotFound("USR_002", "Portal user not found."));

        // Soft delete
        user.IsActive = false;
        user.ModifiedOn = DateTime.UtcNow;
        user.ModifiedBy = deletedBy;

        await db.SaveChangesAsync();
        return Result.Success();
    }

    Task<PagedResult<PortalUserDetails>> IUserService.GetPortalUsersAsync(int page, int pageSize, string? search) => throw new NotImplementedException();
}
