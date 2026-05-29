using Web.Domain.Entities;

namespace Web.Application.Interfaces;

public interface IAuditService
{
    Task<AccessReqAuditEntity> AddAsync(
        int accessReqId,
        int? accessItemId,
        int? accessApproveId,
        string eventType,
        string message,
        int recipientUserId,
        string recipientName,
        string recipientRole,
        int? actorUserId = null);
}
