using Web.Domain.Dto;

namespace Web.Application.Interfaces;

public interface IAccessRequestService
{
    Task<AccessRequestDto> SubmitAsync(SubmitAccessRequestDto request);
    Task<IReadOnlyList<AccessRequestDto>> GetAllAsync(int? userId = null);
    Task<AccessRequestDto?> GetByIdAsync(int accessReqId);
    Task<IReadOnlyList<AccessRequestDto>> GetPendingHodCartAsync(int approverId);
    Task<IReadOnlyList<AccessRequestDto>> GetPendingItCartAsync();
}
