using Server.Core.Domain.Common;

namespace Server.Infrastructure.Security;

public class HttpHeaderUserProvider(IHttpContextAccessor httpContextAccessor) : ICurrentUserProvider
{
    public int GetUserId()
    {
        var httpContext = httpContextAccessor.HttpContext;
        if (httpContext == null) return 0;

        if (httpContext.Request.Headers.TryGetValue("X-User-Id", out var headerValue) &&
            int.TryParse(headerValue, out var userId))
        {
            return userId;
        }

        return 0;
    }
}
