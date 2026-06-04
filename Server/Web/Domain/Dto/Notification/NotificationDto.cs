namespace Web.Domain.Dto;

public sealed record NotificationDto(
    int AuditId,
    string EventType,
    string Message,
    string? TicketNumber,
    int AccessReqId,
    int? AccessItemId,
    bool IsRead,
    DateTime? ReadAtUtc,
    DateTime CreatedOn
);
