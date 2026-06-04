using Web.Domain.Common;
using Web.Domain.Dto;
using Web.Domain.Enums;

namespace Web.Application.Interfaces;

public interface IOperatorCartService
{
    /// <summary>Returns all items pending IT/Operator approval.</summary>
    Task<PagedResult<OperatorCartItemDto>> GetCartAsync(int page, int pageSize);

    /// <summary>Grant access — marks item ItApproved, sets expiry +90 days.</summary>
    Task<Result> ApproveItemAsync(int accessItemId, string comments, int operatorUserId);

    /// <summary>Reject item — moves back to user (ItRejected).</summary>
    Task<Result> RejectItemAsync(int accessItemId, string rejectionReason, int operatorUserId);

    /// <summary>Revoke a previously approved item.</summary>
    Task<Result> RevokeItemAsync(int accessItemId, string reason, int operatorUserId);

    /// <summary>Override the confirmed access type before approving.</summary>
    Task<Result> OverrideAccessTypeAsync(int accessItemId, AccessTypes accessType, int operatorUserId);
}
