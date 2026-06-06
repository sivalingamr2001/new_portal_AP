// SubmitAccessRequestDto.cs
using System.Text.Json.Serialization;
using Web.Domain.Enums;

namespace Web.Domain.Dto.AccessRequest;

public sealed record SubmitAccessRequestDto(
    [property: JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
    int? ReqTo,
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
    AccessItemDto Items,
    int ApprovedItems,
    int RejectedItems
);

// Cart DTOs
public sealed record HodCartItemDto(
    int ItemId,
    int RequestId,
    string TicketNumber,
    string FolderPath,
    RequestStatus Status,
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
    AccessTypes AccessType,
    AccessTypes ConfirmedAccessType,
    RequestStatus Status,
    string Reason,
    int? HodApproverId,
    int RequesterUserId,
    string DepartmentName,
    DateTime SubmittedAt
);

// Action DTOs
public sealed record ItemActionDto(
    string Reason,
    AccessTypes? ConfirmAccessType,
    string? Comments = null
);

public sealed record OverrideAccessTypeDto(AccessTypes AccessType);
