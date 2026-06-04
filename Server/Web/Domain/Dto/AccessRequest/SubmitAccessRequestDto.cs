// SubmitAccessRequestDto.cs
using Web.Domain.Enums;

namespace Web.Domain.Dto;

public sealed record SubmitAccessRequestDto(
    int ReqTo,
    bool IsAgreed,
    IEnumerable<AccessItemRequestDto> Items
);

public sealed record AccessItemRequestDto(
    string FolderPath,
    AccessTypes AccessType,
    string Reason
);

// AccessRequestDetailDto.cs
public sealed record AccessRequestDetailDto(
    int RequestId,
    int UserId,
    RequestStatus CurrentStatus,
    string? ItsrNo,
    DateTime CreatedOn,
    List<AccessItemDto> Items
);

public sealed record AccessItemDto(
    int ItemId,
    string TicketNumber,
    string FolderPath,
    AccessTypes AccessType,
    AccessTypes ConfirmAccessType,
    RequestStatus Status,
    string Reason,
    string? RejectionReason,
    DateTime? ApprovedAtUtc,
    DateTime? ExpiresAtUtc
);

// AccessRequestSummaryDto.cs
public sealed record AccessRequestSummaryDto(
    int RequestId,
    RequestStatus CurrentStatus,
    string? ItsrNo,
    DateTime CreatedOn,
    int TotalItems,
    int ApprovedItems,
    int RejectedItems
);

// Cart DTOs
public sealed record HodCartItemDto(
    int ItemId,
    int RequestId,
    string TicketNumber,
    string FolderPath,
    AccessTypes AccessType,
    string Reason,
    int RequesterUserId,
    DateTime SubmittedAt
);

public sealed record OperatorCartItemDto(
    int ItemId,
    int RequestId,
    string TicketNumber,
    string FolderPath,
    AccessTypes RequestedAccessType,
    AccessTypes ConfirmedAccessType,
    string Reason,
    int? HodApproverId,
    int RequesterUserId,
    DateTime SubmittedAt
);

// Action DTOs
public sealed record ItemActionDto(
    string Reason,
    AccessTypes? ConfirmAccessType, // Moved up (Required or Nullable, but has no default value)
    string? Comments = null         // Moved to the absolute end (Optional with default value)
);

public sealed record OverrideAccessTypeDto(AccessTypes AccessType);
