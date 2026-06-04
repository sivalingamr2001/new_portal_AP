using Web.Domain.Enums;

namespace Web.Domain.Dto;

public sealed record SubmitAccessRequestDto(
    int UserId,
    bool IsAgreed,
    string? ItsrNo,
    IReadOnlyList<SubmitAccessRequestItemDto> Items
);
public sealed record SubmitAccessRequestItemDto(
    string FolderPath,
    AccessTypes AccessType,
    AccessTypes ConfirmAccessType,
    string Reason
);

public sealed record ApprovalActionRequestDto(
    int ApproverId,
    string? Comments,
    AccessTypes? ConfirmAccessType
);

public sealed record ResubmitAccessRequestDto(
    int UserId,
    string? FolderPath,
    AccessTypes? AccessType,
    AccessTypes? ConfirmAccessType,
    string Reason
);

public sealed record AccessApprovalDto(
    int AccessApproveId,
    int AccessItemId,
    int ApproverId,
    string ApprovalLevel,
    RequestStatus ApprovalStatus,
    string Comments,
    DateTime CreatedOn
);

public sealed record AccessAuditDto(
    int AuditId,
    int AccessReqId,
    int? AccessItemId,
    string EventType,
    string Message,
    int RecipientUserId,
    string RecipientName,
    string RecipientRole,
    bool IsRead,
    int? ActorUserId,
    DateTime CreatedOn
);

public sealed record AccessRequestItemDto(
    int AccessItemId,
    string TicketNumber,
    string FolderPath,
    AccessTypes AccessType,
    AccessTypes ConfirmAccessType,
    string Reason,
    string? RejectionReason,
    RequestStatus Status,
    int? HodApproverId,
    int? ItApproverId,
    DateTime CreatedOn,
    DateTime ModifiedOn,
    DateTime? ApprovedAtUtc,
    DateTime? ExpiresAtUtc,
    IReadOnlyList<AccessApprovalDto> Approvals
);

public sealed record AccessRequestDto(
    int AccessReqId,
    int UserId,
    string UserName,
    string? UserEmail,
    int ReqTo,
    bool IsAgreed,
    string? ItsrNo,
    RequestStatus CurrentStatus,
    int? CurrentApproverId,
    DateTime CreatedOn,
    DateTime ModifiedOn,
    IReadOnlyList<AccessRequestItemDto> Items
);

public sealed record AccessNotificationDto(
    int AuditId,
    string EventType,
    string Message,
    bool IsRead,
    DateTime CreatedOn
);
