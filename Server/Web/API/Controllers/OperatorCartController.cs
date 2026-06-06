using Microsoft.AspNetCore.Mvc;
using Web.Application.Interfaces;
using Web.Domain.Common;
using Web.Domain.Dto.AccessRequest;
using Web.Domain.Enums;

namespace Web.API.Controllers;

[ApiController]
[Route("api/operator-cart")]
public sealed class OperatorCartController(IOperatorCartService service) : ControllerBase
{
    // GET api/operator-cart?page=1&pageSize=20
    [HttpGet]
    public async Task<IActionResult> GetCart(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] RequestStatus? status = null)
    {
        var result = await service.GetCartAsync(page, pageSize, status);
        return Ok(result);
    }


    // POST api/operator-cart/items/{itemId}/approve
    [HttpPost("items/{itemId:int}/approve")]
    public async Task<IActionResult> Approve(int itemId, [FromBody] ItemActionDto dto)
    {
        var result = await service.ApproveItemAsync(itemId, dto.Comments ?? "", GetCallerUserId());
        return result.IsSuccess ? Ok() : HandleFailure(result);
    }

    // POST api/operator-cart/items/{itemId}/reject
    [HttpPost("items/{itemId:int}/reject")]
    public async Task<IActionResult> Reject(int itemId, [FromBody] ItemActionDto dto)
    {
        var result = await service.RejectItemAsync(itemId, dto.Reason, GetCallerUserId());
        return result.IsSuccess ? Ok() : HandleFailure(result);
    }

    // POST api/operator-cart/items/{itemId}/revoke
    [HttpPost("items/{itemId:int}/revoke")]
    public async Task<IActionResult> Revoke(int itemId, [FromBody] ItemActionDto dto)
    {
        var result = await service.RevokeItemAsync(itemId, dto.Reason, GetCallerUserId());
        return result.IsSuccess ? Ok() : HandleFailure(result);
    }

    // PATCH api/operator-cart/items/{itemId}/access-type
    [HttpPatch("items/{itemId:int}/access-type")]
    public async Task<IActionResult> OverrideAccessType(
        int itemId, [FromBody] OverrideAccessTypeDto dto)
    {
        var result = await service.OverrideAccessTypeAsync(itemId, dto.AccessType, GetCallerUserId());
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
