using Web.Domain.Common;
using Web.Domain.Dto;

namespace Web.Application.Services;

public interface IAccessRequestService
{
    /// <summary>User submits a new access request (moves to PendingWithHod).</summary>
    Task<Result<int>> SubmitRequestAsync(SubmitAccessRequestDto dto, int submittedByUserId);

    /// <summary>HOD submits their own request — moves directly to PendingWithIt.</summary>
    Task<Result<int>> SubmitHodRequestAsync(SubmitAccessRequestDto dto, int hodUserId);

    /// <summary>Get full request detail with all items.</summary>
    Task<Result<AccessRequestDetailDto>> GetRequestDetailAsync(int requestId, int callerUserId);

    /// <summary>Get all requests submitted by a user.</summary>
    Task<PagedResult<AccessRequestSummaryDto>> GetMyRequestsAsync(int userId, int page, int pageSize);

    /// <summary>User resubmits a rejected item (moves back to PendingWithHod).</summary>
    Task<Result> ResubmitItemAsync(int accessItemId, string reason, int userId);

    /// <summary>User renews an approved or expired item (new 90-day window).</summary>
    Task<Result> RenewItemAsync(int accessItemId, string reason, int userId);
}
