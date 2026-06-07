using Microsoft.EntityFrameworkCore;
using Server.Core.Domain.Dto;
using Server.Core.Interfaces;
using Server.Infrastructure.Data;

namespace Server.Infrastructure.Services;

public sealed class DepartmentService : IDepartmentService
{
    private readonly AppDbContext _context;
    private readonly IdentityDbContext _cmplDb;

    public DepartmentService(AppDbContext context, IdentityDbContext cmplDb)
    {
        _context = context;
        _cmplDb = cmplDb;
    }

    public async Task<PaginatedListDto<DepartmentDetailResponse>> GetAllBySearchParamsAsync(
        DepartmentSearchQueryParameters parameters)
    {
        var query = _context.Departments
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(parameters.SearchTerm))
        {
            query = query.Where(x =>
                x.DepartmentName.Contains(parameters.SearchTerm));
        }

        if (parameters.HodId.HasValue)
        {
            query = query.Where(x => x.HodId == parameters.HodId);
        }

        var totalCount = await query.CountAsync();

        var departments = await query
            .OrderBy(x => x.DepartmentName)
            .Skip((parameters.PageNumber - 1) * parameters.PageSize)
            .Take(parameters.PageSize)
            .ToListAsync();

        var items = new List<DepartmentDetailResponse>();

        foreach (var department in departments)
        {
            var hod = await GetHodByDepartmentIdAsync(department.DepartmentId);

            items.Add(new DepartmentDetailResponse
            {
                DepartmentId = department.DepartmentId,
                DepartmentName = department.DepartmentName,
                HodId = department.HodId,
                Hod = hod
            });
        }

        return new PaginatedListDto<DepartmentDetailResponse>(
            items,
            totalCount,
            parameters.PageNumber,
            parameters.PageSize);
    }

    public async Task<DepartmentDetailResponse?> GetByIdAsync(int departmentId)
    {
        var department = await _context.Departments
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.DepartmentId == departmentId);

        if (department == null)
            return null;

        var hod = await GetHodByDepartmentIdAsync(department.DepartmentId);

        return new DepartmentDetailResponse
        {
            DepartmentId = department.DepartmentId,
            DepartmentName = department.DepartmentName,
            HodId = department.HodId,
            Hod = hod
        };
    }

    public async Task<DepartmentDetailResponse?> UpdateAsync(
        UpdateDepartmentRequest request)
    {
        var department = await _context.Departments
            .FirstOrDefaultAsync(x => x.DepartmentId == request.DepartmentId);

        if (department == null)
            return null;

        department.DepartmentName = request.DepartmentName;
        department.HodId = request.HodId;

        await _context.SaveChangesAsync();

        return await GetByIdAsync(request.DepartmentId);
    }

    private async Task<HodDetailResponse?> GetHodByDepartmentIdAsync(int departmentId)
    {
        var department = await _context.Departments
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.DepartmentId == departmentId);

        if (department?.HodId is not { } hodId)
        {
            return null;
        }

        return await _cmplDb.Users
            .Where(x => x.UserId == hodId)
            .Select(x => new HodDetailResponse
            {
                HodName = x.UserName,
                HodEmployeeId = x.EmpId,
                HodEmail = x.MailId,
                HodMobileNumber = x.MobileNo
            })
            .FirstOrDefaultAsync();
    }
}
