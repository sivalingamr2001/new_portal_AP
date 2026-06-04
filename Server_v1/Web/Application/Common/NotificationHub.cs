using Microsoft.AspNetCore.SignalR;

namespace Web.Application.Common;

public sealed class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userIdValue = Context.GetHttpContext()?.Request.Query["userId"].ToString();

        if (!int.TryParse(userIdValue, out var userId) || userId <= 0)
        {
            throw new HubException("A valid userId query parameter is required.");
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(userId));
        await base.OnConnectedAsync();
    }

    public static string GroupName(int userId) => $"userId:{userId}";
}
