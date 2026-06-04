using Microsoft.AspNetCore.Mvc;
using Web.Application.Services;

namespace Web.API.Controllers;

[ApiController]
[Route("api/dashboard")]
public sealed class DashboardController(IDashboardService service) : ControllerBase
{
    // GET api/dashboard
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var userId = int.Parse(User.FindFirst("sub")?.Value
            ?? HttpContext.Request.Headers["X-User-Id"].ToString());
        var role   = User.FindFirst("role")?.Value
            ?? HttpContext.Request.Headers["X-User-Role"].ToString();

        var result = await service.GetDashboardAsync(userId, role);
        return Ok(result);
    }
}