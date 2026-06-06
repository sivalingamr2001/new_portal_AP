using Web.Domain.Common;
using Web.Domain.Dto.Notification;

namespace Web.Application.Services;

public interface INotificationService
{
    Task NotifyUserAsync(int userId, string role, string title, string message,
        string type, int? requestId = null, int? itemId = null, string? ticketNumber = null);

    Task NotifyRoleGroupAsync(string role, string title, string message,
        string type, int? requestId = null, int? itemId = null, string? ticketNumber = null);

    Task NotifyMultipleUsersAsync(IEnumerable<(int UserId, string Role)> recipients,
        string title, string message, string type,
        int? requestId = null, int? itemId = null, string? ticketNumber = null);

    Task<List<NotificationDto>> GetUserNotificationsAsync(int userId, bool unreadOnly = false);
    Task<Result> MarkAsReadAsync(int notificationId, int userId);
    Task<Result> MarkAllAsReadAsync(int userId);
    Task<int> GetUnreadCountAsync(int userId);
}
