namespace CWM.CleanArchitecture.Infrastructure.Identity;

using System.Security.Claims;
using CWM.CleanArchitecture.Application.Abstractions.Identity;
using Microsoft.AspNetCore.Http;

public sealed class CurrentUser(IHttpContextAccessor httpContextAccessor) : ICurrentUser
{
    public string? UserId => httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
    public string? Email => httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.Email);
    public bool IsAuthenticated => httpContextAccessor.HttpContext?.User.Identity?.IsAuthenticated ?? false;
}
