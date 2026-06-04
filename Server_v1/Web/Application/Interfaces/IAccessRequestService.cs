using Web.Domain.Dto;

namespace Web.Application.Interfaces;

public interface IAccessRequestService
{
    Task<AccessRequestDto> SubmitAsync(SubmitAccessRequestDto request);
    Task<(IReadOnlyList<AccessRequestDto> Items, int TotalCount)> GetAllPagedAsync(int? userId, int page, int pageSize);
    Task<IReadOnlyList<AccessRequestDto>> GetAllAsync(int? userId = null);
    Task<AccessRequestDto?> GetByIdAsync(int accessReqId);
    Task<(IReadOnlyList<AccessRequestDto> Items, int TotalCount)> GetPendingHodCartPagedAsync(int approverId, int page, int pageSize);
    Task<IReadOnlyList<AccessRequestDto>> GetPendingHodCartAsync(int approverId);
    Task<(IReadOnlyList<AccessRequestDto> Items, int TotalCount)> GetPendingItCartPagedAsync(int page, int pageSize);
    Task<IReadOnlyList<AccessRequestDto>> GetPendingItCartAsync();
}
