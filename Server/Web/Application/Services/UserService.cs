using System;
using Microsoft.EntityFrameworkCore;
using Web.Application.Interfaces;
using Web.Domain.Common;
using Web.Domain.Dto.Department;
using Web.Domain.Dto.Login;
using Web.Domain.Dto.User;
using Web.Domain.Entities;
using Web.Infrastructure.Data;

namespace Web.Application.Services;

public sealed class UserService(
    AppDbContext db,
    CmplDbContext cmplDb,
    IDepartmentService departmentService,
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

        if (!string.IsNullOrWhiteSpace(search))
        {
            var lowerTerm = search.Trim().ToLower();

            matchedCmplIds = isTestEnv
                ? await db.CmplUsers
                    .Where(c => (c.Name != null && c.Name.ToLower().Contains(lowerTerm)) ||
                                (c.Email != null && c.Email.ToLower().Contains(lowerTerm)) ||
                                (c.EmployeeId != null && c.EmployeeId.ToLower().Contains(lowerTerm)))
                    .Select(c => c.Id)
                    .ToListAsync()
                : await cmplDb.CmplUsers
                    .Where(c => (c.Name != null && c.Name.ToLower().Contains(lowerTerm)) ||
                                (c.Email != null && c.Email.ToLower().Contains(lowerTerm)) ||
                                (c.EmployeeId != null && c.EmployeeId.ToLower().Contains(lowerTerm)))
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

        // Extract unique HOD user IDs linked to these departments
        var hodEmployeeIds = departments
            .Where(d => !string.IsNullOrWhiteSpace(d.HodId))
            .Select(d => d.HodId!.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        // Batch retrieve assigned HOD profile records by CMPL employee ID.
        List<HodDto> batchHods = new();
        if (hodEmployeeIds.Any())
        {
            if (isTestEnv)
            {
                var masters = await db.HodMasters
                    .Where(h => hodEmployeeIds.Contains(h.EmployeeId ?? string.Empty) && h.Deleted == 0)
                    .ToListAsync();
                batchHods = masters.Select(h => new HodDto(h.UserId, h.Name, h.EmployeeId, h.Email, h.MobileNumber)).ToList();
            }
            else
            {
                var cmplHods = await hodDb.HodMasters
                    .Where(c => hodEmployeeIds.Contains(c.EmployeeId ?? string.Empty) && c.Deleted == 0)
                    .ToListAsync();
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

                    if (!string.IsNullOrWhiteSpace(dept.HodId))
                    {
                        hodDto = batchHods.FirstOrDefault(h =>
                            !string.IsNullOrWhiteSpace(h.EmployeeId) &&
                            string.Equals(h.EmployeeId, dept.HodId, StringComparison.OrdinalIgnoreCase));
                    }

                            // Fallback: if department HodId did not yield a HOD, try matching by CMPL EmployeeId
                            if (hodDto is null && !string.IsNullOrWhiteSpace(cmpl?.EmployeeId))
                            {
                                hodDto = batchHods.FirstOrDefault(h => !string.IsNullOrWhiteSpace(h.EmployeeId) &&
                                                                      string.Equals(h.EmployeeId, cmpl.EmployeeId, StringComparison.OrdinalIgnoreCase));
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
                if (!string.IsNullOrWhiteSpace(dept.HodId))
                {
                    if (isTestEnv)
                    {
                        var hodMaster = await db.HodMasters
                            .FirstOrDefaultAsync(c => c.EmployeeId != null &&
                                                      c.EmployeeId.ToLower() == dept.HodId.Trim().ToLower() &&
                                                      c.Deleted == 0);
                        if (hodMaster is not null)
                        {
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
                        var hodCmpl = await hodDb.HodMasters
                            .FirstOrDefaultAsync(c => c.EmployeeId != null &&
                                                      c.EmployeeId.ToLower() == dept.HodId.Trim().ToLower() &&
                                                      c.Deleted == 0);
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

                    // Fallback: if no HOD found by HodId, try matching by CMPL EmployeeId
                    if (hodDto is null && !string.IsNullOrWhiteSpace(cmpl?.EmployeeId))
                    {
                        if (isTestEnv)
                        {
                            var fallback = await db.HodMasters
                                .FirstOrDefaultAsync(h => h.EmployeeId != null &&
                                                          h.EmployeeId.ToLower() == cmpl.EmployeeId.ToLower() &&
                                                          h.Deleted == 0);
                            if (fallback is not null)
                            {
                                hodDto = new HodDto(fallback.UserId, fallback.Name, fallback.EmployeeId, fallback.Email, fallback.MobileNumber);
                            }
                        }
                        else
                        {
                            var fallback = await hodDb.HodMasters
                                .FirstOrDefaultAsync(h => h.EmployeeId != null &&
                                                          h.EmployeeId.ToLower() == cmpl.EmployeeId.ToLower() &&
                                                          h.Deleted == 0);
                            if (fallback is not null)
                            {
                                hodDto = new HodDto(fallback.UserId, fallback.Name, fallback.EmployeeId, fallback.Email, fallback.MobileNumber);
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

        // Update user properties
        user.Role = dto.Role;
        user.Location = dto.Location;
        user.ModifiedOn = DateTime.UtcNow;
        user.ModifiedBy = updatedBy;

        // Persist user changes first so department service gets fresh data
        await db.SaveChangesAsync();

        // Check role safely using string comparison
        if (dto.Role == "Hod")
        {
            // Find compliance user to get their department details
            var cmplUser = await db.CmplUsers.FindAsync(dto.CmplUserId);
            if (cmplUser is null)
            {
                return Result.Failure(Error.NotFound("USR_003", "Compliance user details not found."));
            }

            // Validate that the compliance user is assigned to a department
            if (cmplUser.DepartmentId.HasValue && cmplUser.DepartmentId.Value > 0)
            {
                // FIX: Identify department using the foreign key relationship (DEPT_ID)
                var department = await db.Departments
                    .FirstOrDefaultAsync(d => d.Id == cmplUser.DepartmentId.Value);

                if (department != null)
                {
                    // Map the compliance user details to the department DTO
                    var departmentDto = new UpsertDepartmentDto(
                        Name: department.Name ?? string.Empty,
                        HodId: cmplUser.EmployeeId,
                        Email: cmplUser.Email
                    );

                    // Invoke the department service
                    var deptResult = await departmentService.UpdateAsync(
                        department.Id,
                        departmentDto,
                        updatedBy
                    );

                    // Handle potential downstream service failures
                    if (!deptResult.IsSuccess)
                    {
                        return Result.Failure(deptResult.Error);
                    }
                }
                else
                {
                    return Result.Failure(Error.NotFound("DEPT_001", "Associated department not found."));
                }
            }
        }

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
}
