using Microsoft.AspNetCore.Mvc;
using Web.Application.Services;
using Web.Domain.Common;
using Web.Domain.Dto.AccessRequest;

namespace Web.API.Controllers;

[ApiController]
[Route("api/access-requests")]
public sealed class AccessRequestController(IAccessRequestService service) : ControllerBase
{
    // POST api/access-requests
    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] SubmitAccessRequestDto dto)
    {
        var userId = GetCallerUserId(); // extract from JWT/header
        var result = await service.SubmitRequestAsync(dto, userId);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetDetail), new { id = result.Value }, result.Value)
            : HandleFailure(result);
    }

    // POST api/access-requests/hod
    [HttpPost("hod")]
    public async Task<IActionResult> SubmitAsHod([FromBody] SubmitAccessRequestDto dto)
    {
        var hodUserId = GetCallerUserId();
        var result = await service.SubmitHodRequestAsync(dto, hodUserId);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetDetail), new { id = result.Value }, result.Value)
            : HandleFailure(result);
    }

    // GET api/access-requests/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetDetail(int id)
    {
        var result = await service.GetRequestDetailAsync(id, GetCallerUserId());
        return result.IsSuccess ? Ok(result.Value) : HandleFailure(result);
    }

    // GET api/access-requests/my?page=1&pageSize=20
    [HttpGet("my")]
    public async Task<IActionResult> GetMyRequests(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await service.GetMyRequestsAsync(GetCallerUserId(), page, pageSize);
        return Ok(result);
    }

    // POST api/access-requests/items/{itemId}/resubmit
    [HttpPost("items/{itemId:int}/resubmit")]
    public async Task<IActionResult> ResubmitItem(int itemId, [FromBody] ItemActionDto dto)
    {
        var result = await service.ResubmitItemAsync(itemId, dto.Reason, GetCallerUserId());
        return result.IsSuccess ? Ok() : HandleFailure(result);
    }

    // POST api/access-requests/items/{itemId}/renew
    [HttpPost("items/{itemId:int}/renew")]
    public async Task<IActionResult> RenewItem(int itemId, [FromBody] ItemActionDto dto)
    {
        var result = await service.RenewItemAsync(itemId, dto.Reason, GetCallerUserId());
        return result.IsSuccess ? Ok() : HandleFailure(result);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────
    private int GetCallerUserId()
        => int.Parse(User.FindFirst("sub")?.Value
            ?? HttpContext.Request.Headers["X-User-Id"].ToString());

    private IActionResult HandleFailure(Result result) =>
        result.Error!.Type switch
        {
            ErrorType.NotFound   => NotFound(result.Error),
            ErrorType.Validation => BadRequest(result.Error),
            ErrorType.Conflict   => Conflict(result.Error),
            _                    => StatusCode(500, result.Error)
        };
}
