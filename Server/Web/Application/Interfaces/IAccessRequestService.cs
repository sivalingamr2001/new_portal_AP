using System.Threading.Tasks;
using Web.Domain.Common;
using Web.Domain.Dto.AccessRequest;

namespace Web.Application.Services;

public interface IAccessRequestService
{
    /// <summary>User submits a new access request (moves to PendingWithHod).</summary>
    Task<Result<int>> SubmitRequestAsync(SubmitAccessRequestDto dto, int submittedByUserId);

    /// <summary>HOD submits their own request — moves directly to PendingWithIt.</summary>
    Task<Result<int>> SubmitHodRequestAsync(SubmitAccessRequestDto dto, int hodUserId);

    /// <summary>Get full request detail with all items.</summary>
    Task<Result<AccessRequestDetailDto>> GetRequestDetailAsync(int requestId, int callerUserId, int? itemId = null);

    /// <summary>
    /// Get all requests matching role permissions. 
    /// Restricts regular Users/Operators to their own submissions, 
    /// while opening global visibility for HODs across their departments and folder scopes.
    /// </summary>
    /// <param name="userId">The system database user primary key integer.</param>
    /// <param name="identifier">Optional HOD Employee ID or Email string filter.</param>
    /// <param name="page">The requested target list page integer index.</param>
    /// <param name="pageSize">The maximum count limit parameter for the list rows.</param>
    Task<PagedResult<AccessRequestSummaryDto>> GetMyRequestsAsync(int userId, string? identifier, int page, int pageSize);

    /// <summary>User resubmits a rejected item (moves back to PendingWithHod).</summary>
    Task<Result> ResubmitItemAsync(int accessItemId, string reason, int userId);

    /// <summary>User renews an approved or expired item (new 90-day window).</summary>
    Task<Result> RenewItemAsync(int accessItemId, string reason, int userId);
}
