using Microsoft.AspNetCore.Mvc;
using Web.Application.Interfaces;
using Web.Domain.Dto;

namespace Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AccessRequestController : ControllerBase
{
    private readonly IAccessRequestService _accessRequestService;
    private readonly IApprovalService _approvalService;
    private readonly INotificationService _notificationService;

    public AccessRequestController(
        IAccessRequestService accessRequestService,
        IApprovalService approvalService,
        INotificationService notificationService)
    {
        _accessRequestService = accessRequestService;
        _approvalService = approvalService;
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? userId)
    {
        return Ok(await _accessRequestService.GetAllAsync(userId));
    }

    [HttpGet("{accessReqId:int}")]
    public async Task<IActionResult> GetById(int accessReqId)
    {
        var request = await _accessRequestService.GetByIdAsync(accessReqId);
        return request is null ? NotFound() : Ok(request);
    }

    [HttpGet("cart/hod/{approverId:int}")]
    public async Task<IActionResult> GetHodCart(int approverId)
    {
        return Ok(await _accessRequestService.GetPendingHodCartAsync(approverId));
    }

    [HttpGet("cart/it")]
    public async Task<IActionResult> GetItCart()
    {
        return Ok(await _accessRequestService.GetPendingItCartAsync());
    }

    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] SubmitAccessRequestDto request)
    {
        try
        {
            var result = await _accessRequestService.SubmitAsync(request);
            return CreatedAtAction(nameof(GetById), new { accessReqId = result.AccessReqId }, result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{accessReqId:int}/items/{accessItemId:int}/hod/approve")]
    public Task<IActionResult> ApproveByHod(int accessReqId, int accessItemId, [FromBody] ApprovalActionRequestDto request) =>
        ExecuteApproval(() => _approvalService.ApproveByHodAsync(accessReqId, accessItemId, request));

    [HttpPost("{accessReqId:int}/items/{accessItemId:int}/hod/reject")]
    public Task<IActionResult> RejectByHod(int accessReqId, int accessItemId, [FromBody] ApprovalActionRequestDto request) =>
        ExecuteApproval(() => _approvalService.RejectByHodAsync(accessReqId, accessItemId, request));

    [HttpPost("{accessReqId:int}/items/{accessItemId:int}/it/approve")]
    public Task<IActionResult> ApproveByIt(int accessReqId, int accessItemId, [FromBody] ApprovalActionRequestDto request) =>
        ExecuteApproval(() => _approvalService.ApproveByItAsync(accessReqId, accessItemId, request));

    [HttpPost("{accessReqId:int}/items/{accessItemId:int}/it/reject")]
    public Task<IActionResult> RejectByIt(int accessReqId, int accessItemId, [FromBody] ApprovalActionRequestDto request) =>
        ExecuteApproval(() => _approvalService.RejectByItAsync(accessReqId, accessItemId, request));

    [HttpPost("{accessReqId:int}/items/{accessItemId:int}/resubmit")]
    public Task<IActionResult> Resubmit(int accessReqId, int accessItemId, [FromBody] ResubmitAccessRequestDto request) =>
        ExecuteApproval(() => _approvalService.ResubmitAsync(accessReqId, accessItemId, request));

    [HttpPost("{accessReqId:int}/items/{accessItemId:int}/revoke")]
    public Task<IActionResult> Revoke(int accessReqId, int accessItemId, [FromBody] ApprovalActionRequestDto request) =>
        ExecuteApproval(() => _approvalService.RevokeAsync(accessReqId, accessItemId, request));

    [HttpGet("notifications/{userId:int}")]
    public async Task<IActionResult> GetNotifications(int userId)
    {
        return Ok(await _notificationService.GetNotificationsAsync(userId));
    }

    [HttpPost("notifications/{auditId:int}/read")]
    public async Task<IActionResult> MarkNotificationAsRead(int auditId, [FromQuery] int userId)
    {
        var updated = await _notificationService.MarkAsReadAsync(auditId, userId);
        return updated ? NoContent() : NotFound();
    }

    private async Task<IActionResult> ExecuteApproval(Func<Task<AccessRequestDto?>> operation)
    {
        try
        {
            var result = await operation();
            return result is null ? NotFound() : Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
