using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Web.Application.Interfaces;
using Web.Domain.Common;
using Web.Domain.Dto.Notification;
using Web.Domain.Entities;
using Web.Infrastructure.Data;
using Web.Infrastructure.Hubs;
using Web.Shared.Utilites.EmailService;

namespace Web.Application.Services;

public sealed class NotificationService(
    AppDbContext db,
    IHubContext<NotificationHub> hubContext,
    IEmailService emailService) : INotificationService
{
    public async Task NotifyUserAsync(int userId, string role, string title, string message,
        string type, int? requestId = null, int? itemId = null, string? ticketNumber = null)
    {
        var notification = await PersistAsync(userId, role, title, message, type,
            requestId, itemId, ticketNumber);

        var dto = MapToDto(notification);

        //await QueueEmailNotificationAsync(userId, requestId, itemId, title, message, type);

        // Push to the user's personal SignalR group
        await hubContext.Clients
            .Group($"user_{userId}")
            .SendAsync("ReceiveNotification", dto);
    }

    public async Task NotifyRoleGroupAsync(string role, string title, string message,
        string type, int? requestId = null, int? itemId = null, string? ticketNumber = null)
    {
        // Persist a notification for each user in that role
        var usersInRole = await db.Users
            .Where(u => u.Role == role && u.IsActive)
            .Select(u => u.Id)
            .ToListAsync();

        foreach (var uid in usersInRole)
        {
            await PersistAsync(uid, role, title, message, type, requestId, itemId, ticketNumber);
            //await QueueEmailNotificationAsync(uid, requestId, itemId, title, message, type);
        }

        await hubContext.Clients
            .Group($"role_{role}")
            .SendAsync("ReceiveNotification", new
            {
                Title = title,
                Message = message,
                Type = type,
                TicketNumber = ticketNumber
            });
    }

    public async Task NotifyMultipleUsersAsync(IEnumerable<(int UserId, string Role)> recipients,
        string title, string message, string type,
        int? requestId = null, int? itemId = null, string? ticketNumber = null)
    {
        foreach (var (uid, role) in recipients)
        {
            await NotifyUserAsync(uid, role, title, message, type,
                requestId, itemId, ticketNumber);
        }
    }

    public async Task<List<NotificationDto>> GetUserNotificationsAsync(int userId, bool unreadOnly = false)
    {
        var query = db.AccessReqAudits
            .Where(n => n.RecipientUserId == userId);

        if (unreadOnly)
            query = query.Where(n => !n.IsRead);

        // Bring data into memory before mapping to avoid EF conversion errors with [NotMapped] properties
        var entities = await query
            .OrderByDescending(n => n.CreatedOn)
            .Take(100)
            .ToListAsync();

        return entities.Select(MapToDto).ToList();
    }

    public async Task<Result> MarkAsReadAsync(int notificationId, int userId)
    {
        var notification = await db.AccessReqAudits
            .FirstOrDefaultAsync(n => n.AuditId == notificationId
                                   && n.RecipientUserId == userId);

        if (notification is null)
            return Result.Failure(Error.NotFound("NOTIF_001", "Notification not found."));

        notification.IsRead = true;
        notification.ModifiedOn = DateTime.UtcNow; // Act as ReadAtUtc
        notification.ModifiedBy = userId;

        await db.SaveChangesAsync();
        return Result.Success();
    }

    public async Task<Result> MarkAllAsReadAsync(int userId)
    {
        await db.AccessReqAudits
            .Where(n => n.RecipientUserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(s => s
                .SetProperty(n => n.IsRead, true)
                .SetProperty(n => n.ModifiedOn, DateTime.UtcNow) // Bulk act as ReadAtUtc
                .SetProperty(n => n.ModifiedBy, userId));

        return Result.Success();
    }

    public async Task<int> GetUnreadCountAsync(int userId)
        => await db.AccessReqAudits.CountAsync(n => n.RecipientUserId == userId && !n.IsRead);

    // ─── Private Helpers ────────────────────────────────────────────────────────

    private async Task<AccessReqAuditEntity> PersistAsync(int userId, string role,
        string title, string message, string type,
        int? requestId, int? itemId, string? ticketNumber)
    {
        var entity = new AccessReqAuditEntity
        {
            RecipientUserId = userId,
            RecipientRole = role,
            Message = message,
            EventType = type,          // Map 'type' to 'EventType'
            AccessReqId = requestId ?? 0, // Map 'requestId' to non-nullable 'AccessReqId'
            AccessItemId = itemId,
            TicketNumber = ticketNumber,
            IsActive = true,
            CreatedOn = DateTime.UtcNow,
            CreatedBy = userId
        };

        db.AccessReqAudits.Add(entity);
        await db.SaveChangesAsync();
        return entity;
    }

    private async Task QueueEmailNotificationAsync(int userId, int? requestId, int? itemId, string title, string message, string type)
    {
        if (requestId is not { } validRequestId || validRequestId <= 0)
            return;

        var user = await db.CmplUsers.FirstOrDefaultAsync(u => u.Id == userId);
        if (string.IsNullOrWhiteSpace(user?.Email))
            return;

        var request = await db.AccessRequests
            .Include(r => r.AccessItems)
            .FirstOrDefaultAsync(r => r.AccessReqId == validRequestId);

        if (request is null)
            return;

        var requester = await db.CmplUsers
            .FirstOrDefaultAsync(u => u.Id == request.UserId)
            ?? new CmplUser { Id = request.UserId, Name = "Unknown Requester" };

        var requestItem = itemId.HasValue
            ? request.AccessItems.FirstOrDefault(i => i.AccessItemId == itemId.Value)
            : request.AccessItems.FirstOrDefault();

        var notification = new AccessRequestEmailNotification(
            MailProgramSuffix: type,
            Subject: message,
            Heading: "Access Request Notification",
            Summary: message,
            Request: request,
            Requester: requester,
            Recipients: new[] { user },
            Item: requestItem,
            Comments: "No comments",
            ExpirationDateUtc: requestItem?.ExpiresAtUtc
        );

        var emailRequest = new EmailNotificationRequest
        {
            MailFrom = "feedback@janatics.co.in",
            MailTo = user.Email.Trim(),
            MailCc = string.Empty,
            MailSubject = title,
            MailBody = EmailTemplateUtility.BuildAccessRequestEmailBody(notification),
            MailProgram = $"PortalNotification_{type}"
        };

        await emailService.SendEmailAsync(emailRequest, CancellationToken.None);
    }

    private static NotificationDto MapToDto(AccessReqAuditEntity n) => new(
        n.AuditId,
        n.EventType,
        n.Message,
        n.TicketNumber,
        n.AccessReqId,
        n.AccessItemId,
        n.IsRead,
        n.ReadAtUtc,
        n.CreatedOn
    );
}
