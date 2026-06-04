using Microsoft.AspNetCore.Mvc;
using Web.Application.Services;

namespace Web.API.Controllers;

[ApiController]
[Route("api/notifications")]
public sealed class NotificationController(INotificationService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool unreadOnly = false)
    {
        var userId = GetCallerUserId();
        var notifications = await service.GetUserNotificationsAsync(userId, unreadOnly);
        return Ok(notifications);
    }

    // GET api/notifications/unread-count
    [HttpGet("unread-count")]
    public async Task<IActionResult> UnreadCount()
    {
        var count = await service.GetUnreadCountAsync(GetCallerUserId());
        return Ok(new { count });
    }

    // PATCH api/notifications/{id}/mark-read
    [HttpPatch("{id:int}/mark-read")]
    public async Task<IActionResult> MarkRead(int id)
    {
        var result = await service.MarkAsReadAsync(id, GetCallerUserId());
        return result.IsSuccess ? Ok() : NotFound(result.Error);
    }

    // PATCH api/notifications/mark-all-read
    [HttpPatch("mark-all-read")]
    public async Task<IActionResult> MarkAllRead()
    {
        await service.MarkAllAsReadAsync(GetCallerUserId());
        return Ok();
    }

    private int GetCallerUserId()
        => int.Parse(User.FindFirst("sub")?.Value
            ?? HttpContext.Request.Headers["X-User-Id"].ToString());
}
