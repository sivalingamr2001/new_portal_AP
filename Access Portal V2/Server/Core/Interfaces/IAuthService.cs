using Server.Core.Domain.Dto;
using Server.Core.Domain.Entities;

namespace Server.Core.Interfaces;

public interface IAuthService
{
    /// <summary>
    /// Validates credentials against Connection 1 and enriches the response profile 
    /// with role and location fields from Connection 2.
    /// </summary>
    Task<AuthSessionResponseDto?> AuthenticateUserAsync(string userName, string userKey);
}

