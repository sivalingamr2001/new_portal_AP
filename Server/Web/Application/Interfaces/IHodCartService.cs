using Web.Domain.Common;
using Web.Domain.Dto;
using Web.Domain.Enums;

namespace Web.Application.Interfaces;

public interface IHodCartService
{
    /// <summary>
    /// Returns items pending HOD approval.
    /// HOD sees items from:
    ///   (a) users whose dept.hod_id == this HOD's userId
    ///   (b) folder mappings where primary_hod_id or secondary_hod_id == this HOD's userId
    /// </summary>
    Task<PagedResult<HodCartItemDto>> GetCartAsync(int hodUserId, int page, int pageSize);

    /// <summary>Approve a single access item — moves to PendingWithIt.</summary>
    Task<Result> ApproveItemAsync(int accessItemId, AccessTypes confirmAccessType, string comments, int hodUserId);

    /// <summary>Reject a single access item — moves back to user (HodRejected).</summary>
    Task<Result> RejectItemAsync(int accessItemId, string rejectionReason, int hodUserId);

    /// <summary>Bulk approve all items in a request visible to this HOD.</summary>
    Task<Result> ApproveAllInRequestAsync(int accessRequestId, string comments, int hodUserId);
}
