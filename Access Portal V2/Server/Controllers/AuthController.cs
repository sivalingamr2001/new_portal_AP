using Microsoft.AspNetCore.Mvc;
using Server.Core.Domain.Dto;
using Server.Core.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace Server.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IAuthService authService) : ControllerBase
{
    /// <summary>
    /// POST: api/auth/login
    /// Authenticates a platform profile and issues a compiled access session descriptor.
    /// </summary>
    [HttpPost("login")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(AuthSessionResponseDto))]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        var sessionResult = await authService.AuthenticateUserAsync(request.UserName, request.UserKey);

        if (sessionResult == null)
        {
            return Unauthorized(new { error = "Invalid credential parameters. Verification failed." });
        }

        return Ok(sessionResult);
    }
}

/// <summary>
/// Strict request validation constraints for endpoint parameters parsing.
/// </summary>
public sealed class LoginRequestDto
{
    [Required(ErrorMessage = "User login identification string is required.")]
    [StringLength(100)]
    public string UserName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Verification secret key string is required.")]
    [StringLength(25)]
    public string UserKey { get; set; } = string.Empty;
}
