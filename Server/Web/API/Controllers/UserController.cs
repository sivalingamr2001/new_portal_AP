using Microsoft.AspNetCore.Mvc;
using Web.Application.Interfaces;
using Web.Domain.Common;
using Web.Domain.Dto.User;

namespace Web.API.Controllers;

[ApiController]
[Route("api/users")]
public sealed class UsersController(IUserService userService) : ControllerBase
{
    // ─── CMPL Users (GET only) ───────────────────────────────────────────────────

    // GET api/users/cmpl?page=1&pageSize=20&search=
    [HttpGet("cmpl")]
    public async Task<IActionResult> GetCmplUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
        => Ok(await userService.GetCmplUsersAsync(page, pageSize, search));

    // GET api/users/cmpl/{id}
    [HttpGet("cmpl/{id:int}")]
    public async Task<IActionResult> GetCmplUser(int id)
    {
        var result = await userService.GetCmplUserByIdAsync(id);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    // ─── HOD Master (GET only) ───────────────────────────────────────────────────

    // GET api/users/hods?page=1&pageSize=20&search=
    [HttpGet("hods")]
    public async Task<IActionResult> GetHods(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
        => Ok(await userService.GetHodsAsync(page, pageSize, search));

    // GET api/users/hods/{id}
    [HttpGet("hods/{id:int}")]
    public async Task<IActionResult> GetHod(int id)
    {
        var result = await userService.GetHodByIdAsync(id);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    // ─── Portal Users (full CRUD) ─────────────────────────────────────────────────

    // GET api/users?page=1&pageSize=20&search=
    [HttpGet]
    public async Task<IActionResult> GetPortalUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
        => Ok(await userService.GetPortalUsersAsync(page, pageSize, search));

    // GET api/users/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetPortalUser(int id)
    {
        var result = await userService.GetPortalUserByIdAsync(id);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    // PUT api/users/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdatePortalUser(int id, [FromBody] UpsertPortalUserDto dto)
    {
        var result = await userService.UpdatePortalUserAsync(id, dto, GetCallerId());
        return result.IsSuccess ? Ok() : HandleFailure(result);
    }

    // DELETE api/users/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeletePortalUser(int id)
    {
        var result = await userService.DeletePortalUserAsync(id, GetCallerId());
        return result.IsSuccess ? NoContent() : HandleFailure(result);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    private int GetCallerId()
        => int.Parse(User.FindFirst("sub")?.Value
            ?? HttpContext.Request.Headers["X-User-Id"].ToString());

    private IActionResult HandleFailure(Result result) =>
        result.Error!.Type switch
        {
            ErrorType.NotFound => NotFound(result.Error),
            ErrorType.Validation => BadRequest(result.Error),
            ErrorType.Conflict => Conflict(result.Error),
            _ => StatusCode(500, result.Error)
        };
}
