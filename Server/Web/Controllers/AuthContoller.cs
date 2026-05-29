using Microsoft.AspNetCore.Mvc;
using Web.Domain.Common;
using Web.Domain.Dto;
using Web.Application.Interfaces;

namespace Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ILogger<AuthController> _logger;
    private readonly IAuthService _authService;

    public AuthController(ILogger<AuthController> logger, IAuthService authService)
    {
        _logger = logger;
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<Result<LoginResponseDto>> Login([FromBody] Web.Domain.Entities.LoginRequestDto request)
    {
        _logger.LogInformation("Login attempt for identifier: {Identifier}", request.Identifier);

        if (string.IsNullOrWhiteSpace(request.Identifier) || string.IsNullOrWhiteSpace(request.Password))
        {
            _logger.LogWarning("Login failed for identifier: {Identifier} - Missing credentials", request.Identifier);
            return Result.Failure<LoginResponseDto>(new Error("InvalidInput", "Identifier and password are required."));
        }

        var response = await _authService.LoginAsync(request.Identifier, request.Password);
        if (response is null)
            return Result.Failure<LoginResponseDto>(Error.NotFound("UserNotFound", "User not found."));

        return Result.Success(response);
    }
}