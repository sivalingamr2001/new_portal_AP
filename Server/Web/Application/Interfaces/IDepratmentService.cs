using Web.Domain.Common;
using Web.Domain.Dto;
using Web.Domain.Dto.Department;

namespace Web.Application.Services;

public interface IDepartmentService
{
    Task<PagedResult<DepartmentDetailDto>> GetAllAsync(int page, int pageSize, string? search);
    Task<Result<DepartmentDetailDto>> GetByIdAsync(int id);
    Task<Result<int>> CreateAsync(UpsertDepartmentDto dto, int createdBy);
    Task<Result> UpdateAsync(int id, UpsertDepartmentDto dto, int updatedBy);
    Task<Result> DeleteAsync(int id, int deletedBy);
}
