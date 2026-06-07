using Server.Core.Domain.Dto;
using Server.Core.Domain.Entities;

namespace Server.Core.Interfaces;

public interface IDepartmentService
{
    Task<PaginatedListDto<DepartmentDetailResponse>> GetAllBySearchParamsAsync(
        DepartmentSearchQueryParameters parameters);

    Task<DepartmentDetailResponse?> GetByIdAsync(int departmentId);

    Task<DepartmentDetailResponse?> UpdateAsync(
        UpdateDepartmentRequest request);
}