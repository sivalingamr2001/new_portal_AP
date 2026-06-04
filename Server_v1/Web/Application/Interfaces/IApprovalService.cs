using Web.Domain.Dto;

namespace Web.Application.Interfaces;

public interface IApprovalService
{
    Task<AccessRequestDto?> ApproveByHodAsync(int accessReqId, int accessItemId, ApprovalActionRequestDto request);
    Task<AccessRequestDto?> RejectByHodAsync(int accessReqId, int accessItemId, ApprovalActionRequestDto request);
    Task<AccessRequestDto?> ApproveByItAsync(int accessReqId, int accessItemId, ApprovalActionRequestDto request);
    Task<AccessRequestDto?> RejectByItAsync(int accessReqId, int accessItemId, ApprovalActionRequestDto request);
    Task<AccessRequestDto?> ResubmitAsync(int accessReqId, int accessItemId, ResubmitAccessRequestDto request);
    Task<AccessRequestDto?> RenewAsync(int accessReqId, int accessItemId, ResubmitAccessRequestDto request);
    Task<AccessRequestDto?> RevokeAsync(int accessReqId, int accessItemId, ApprovalActionRequestDto request);
    Task<int> ExpireApprovedRequestsAsync(DateTime utcNow);
}
