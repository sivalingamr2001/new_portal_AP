using Web.Application.Interfaces;
using Web.Domain.Entities;
using Web.Infrastructure.Data;

namespace Web.Application.Services;

public sealed class AuditService : IAuditService
{
    private readonly AppDbContext _db;

    public AuditService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<AccessReqAuditEntity> AddAsync(
        int accessReqId,
        int? accessItemId,
        int? accessApproveId,
        string eventType,
        string message,
        int recipientUserId,
        string recipientName,
        string recipientRole,
        int? actorUserId = null)
    {
        var entity = new AccessReqAuditEntity
        {
            AccessReqId = accessReqId,
            AccessItemId = accessItemId,
            AccessApproveId = accessApproveId,
            EventType = eventType,
            Message = message,
            RecipientUserId = recipientUserId,
            RecipientName = recipientName,
            RecipientRole = recipientRole,
            ActorUserId = actorUserId,
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.AccessReqAudits.Add(entity);
        await _db.SaveChangesAsync();
        return entity;
    }
}
