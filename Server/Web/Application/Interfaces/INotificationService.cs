using Web.Domain.Dto;

namespace Web.Application.Interfaces;

public interface INotificationService
{
    Task SendStageNotificationAsync(
        int accessReqId,
        int? accessItemId,
        string eventType,
        string message,
        IReadOnlyCollection<int> recipientUserIds,
        int? actorUserId = null);

    Task<IReadOnlyList<AccessNotificationDto>> GetNotificationsAsync(int userId);
    Task<bool> MarkAsReadAsync(int auditId, int userId);
}
