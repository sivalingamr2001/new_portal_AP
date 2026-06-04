using Microsoft.AspNetCore.Mvc;
using Web.Application.Services;
using Web.Domain.Common;
using Web.Domain.Dto;
using Web.Domain.Enums;

namespace Web.API.Controllers;

[ApiController]
[Route("api/hod-cart")]
public sealed class HodCartController(IHodCartService service) : ControllerBase
{
    // GET api/hod-cart?page=1&pageSize=20
    [HttpGet]
    public async Task<IActionResult> GetCart(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await service.GetCartAsync(GetCallerUserId(), page, pageSize);
        return Ok(result);
    }

    [HttpPost("items/{itemId:int}/approve")]
    public async Task<IActionResult> Approve(int itemId, [FromBody] ItemActionDto dto)
    {
        AccessTypes accessType = dto.ConfirmAccessType ?? AccessTypes.NotApplicable;

        // Fallback empty string used to prevent null reference issues
        string approvalComments = dto.Comments ?? string.Empty;

        var result = await service.ApproveItemAsync(itemId, accessType, approvalComments, GetCallerUserId());

        return result.IsSuccess ? Ok() : HandleFailure(result);
    }


    // POST api/hod-cart/items/{itemId}/reject
    [HttpPost("items/{itemId:int}/reject")]
    public async Task<IActionResult> Reject(int itemId, [FromBody] ItemActionDto dto)
    {
        var result = await service.RejectItemAsync(itemId, dto.Reason, GetCallerUserId());
        return result.IsSuccess ? Ok() : HandleFailure(result);
    }

    // POST api/hod-cart/requests/{requestId}/approve-all
    [HttpPost("requests/{requestId:int}/approve-all")]
    public async Task<IActionResult> ApproveAll(int requestId, [FromBody] ItemActionDto dto)
    {
        var result = await service.ApproveAllInRequestAsync(
            requestId, dto.Comments ?? "", GetCallerUserId());
        return result.IsSuccess ? Ok() : HandleFailure(result);
    }

    private int GetCallerUserId()
        => int.Parse(User.FindFirst("sub")?.Value
            ?? HttpContext.Request.Headers["X-User-Id"].ToString());

    private IActionResult HandleFailure(Result result) =>
        result.Error!.Type switch
        {
            ErrorType.NotFound   => NotFound(result.Error),
            ErrorType.Validation => BadRequest(result.Error),
            _                    => StatusCode(500, result.Error)
        };
}
