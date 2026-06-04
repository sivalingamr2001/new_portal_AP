using Microsoft.AspNetCore.Mvc;
using Web.Application.Services;
using Web.Domain.Common;
using Web.Domain.Entities;

namespace Web.API.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IAuthService authService) : ControllerBase
{
    // POST api/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Identifier) || string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest(new { message = "Identifier and password are required." });

        var result = await authService.LoginAsync(dto);

        if (result.IsFailure)
            return result.Error!.Type == ErrorType.NotFound
                ? Unauthorized(new { message = result.Error.Message })
                : BadRequest(new { message = result.Error.Message });

        return Ok(result.Value);
    }

    // POST api/auth/logout  (stateless JWT — client discards token)
    [HttpPost("logout")]
    public IActionResult Logout() => Ok(new { message = "Logged out." });
}
