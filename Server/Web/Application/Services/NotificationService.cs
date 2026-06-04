using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Web.Application.Common;
using Web.Application.Interfaces;
using Web.Domain.Dto;
using Web.Infrastructure.Data;

namespace Web.Application.Services;

public sealed class NotificationService : INotificationService
{
    private readonly AppDbContext _db;
    private readonly CmplDbContext _cmplDb;
    private readonly IAuditService _auditService;
    private readonly IEmailService _emailService;
    private readonly IHubContext<NotificationHub> _hubContext;

    public NotificationService(
        AppDbContext db,
        CmplDbContext cmplDb,
        IAuditService auditService,
        IEmailService emailService,
        IHubContext<NotificationHub> hubContext)
    {
        _db = db;
        _auditService = auditService;
        _emailService = emailService;
        _hubContext = hubContext;
    }

    public async Task SendStageNotificationAsync(
        int accessReqId,
        int? accessItemId,
        string eventType,
        string message,
        IReadOnlyCollection<int> recipientUserIds,
        int? actorUserId = null)
    {
        foreach (var recipientUserId in recipientUserIds.Distinct())
        {
            var user = await _db.Users.FindAsync(recipientUserId);
            var cmplUser = await _cmplDb.CmplUsers.FindAsync(recipientUserId);

            if (user is null || cmplUser is null)
                continue;

            var audit = await _auditService.AddAsync(
                accessReqId,
                accessItemId,
                null,
                eventType,
                message,
                recipientUserId,
                cmplUser.Name,
                user.Role,
                actorUserId);

            await _hubContext.Clients
                .Group(NotificationHub.GroupName(recipientUserId))
                .SendAsync("ReceiveNotification", new AccessNotificationDto(
                    audit.AuditId,
                    audit.EventType,
                    audit.Message,
                    audit.IsRead,
                    audit.CreatedOn));

            if (!string.IsNullOrWhiteSpace(cmplUser.Email))
            {
                await _emailService.SendAsync(
                    new[] { cmplUser.Email! },
                    $"Access Request Update - {eventType}",
                    message);
            }
        }
    }

    public async Task<IReadOnlyList<AccessNotificationDto>> GetNotificationsAsync(int userId)
    {
        return await _db.AccessReqAudits
            .Where(a => a.RecipientUserId == userId)
            .OrderByDescending(a => a.CreatedOn)
            .Select(a => new AccessNotificationDto(
                a.AuditId,
                a.EventType,
                a.Message,
                a.IsRead,
                a.CreatedOn))
            .ToListAsync();
    }

    public async Task<bool> MarkAsReadAsync(int auditId, int userId)
    {
        var audit = await _db.AccessReqAudits
            .FirstOrDefaultAsync(a => a.AuditId == auditId && a.RecipientUserId == userId);

        if (audit is null)
            return false;

        audit.IsRead = true;
        await _db.SaveChangesAsync();
        return true;
    }
}
