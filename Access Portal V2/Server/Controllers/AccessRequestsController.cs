using Microsoft.AspNetCore.Mvc;
using Server.Core.Domain.Dto;
using Server.Core.Domain.Enums;
using Server.Core.Interfaces;

namespace Server.Controllers;

[ApiController]
[Route("api/access-requests")]
public sealed class AccessRequestsController(IAccessRequestWorkflow workflowEngine) : ControllerBase
{
    private const string UserIdHeader = "X-User-Id";

    // ── Queries ──────────────────────────────────────────────────────────────────

    /// <summary>
    /// GET api/access-requests
    /// Admin / IT: full paginated list of all access items.
    /// Query params: page, pageSize, status (int), search
    /// </summary>
    [HttpGet]
    [ProducesResponseType<PaginatedListDto<AccessRequestSummaryDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] RequestStatus? status = null,
        [FromQuery] string? search = null)
    {
        var result = await workflowEngine.GetAllRequestsAsync(page, pageSize, status, search);
        return Ok(result);
    }

    /// <summary>
    /// GET api/access-requests/my
    /// Requester: their own submission history.
    /// </summary>
    [HttpGet("my")]
    [ProducesResponseType<PaginatedListDto<AccessRequestSummaryDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMy(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] RequestStatus? status = null)
    {
        int userId = GetUserId();
        var result = await workflowEngine.GetRequestsByUserIdAsync(userId, page, pageSize, status);
        return Ok(result);
    }

    /// <summary>
    /// GET api/access-requests/by-user/{userId}
    /// Admin: access history of any specific user.
    /// </summary>
    [HttpGet("by-user/{userId:int}")]
    [ProducesResponseType<PaginatedListDto<AccessRequestSummaryDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByUser(
        [FromRoute] int userId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] RequestStatus? status = null)
    {
        var result = await workflowEngine.GetRequestsByUserIdAsync(userId, page, pageSize, status);
        return Ok(result);
    }

    /// <summary>
    /// GET api/access-requests/by-department/{deptId}
    /// HOD: all requests from their department.
    /// </summary>
    [HttpGet("by-department/{deptId:int}")]
    [ProducesResponseType<PaginatedListDto<AccessRequestSummaryDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByDepartment(
        [FromRoute] int deptId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] RequestStatus? status = null)
    {
        var result = await workflowEngine.GetRequestsByDepartmentAsync(deptId, page, pageSize, status);
        return Ok(result);
    }

    /// <summary>
    /// GET api/access-requests/my-folder-queue
    /// Folder-owner HOD: requests targeting folders they own.
    /// </summary>
    [HttpGet("my-folder-queue")]
    [ProducesResponseType<PaginatedListDto<AccessRequestSummaryDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyFolderQueue(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] RequestStatus? status = null)
    {
        int hodUserId = GetUserId();
        var result = await workflowEngine.GetRequestsByFolderOwnerAsync(hodUserId, page, pageSize, status);
        return Ok(result);
    }

    // ── Stage 0: Create ──────────────────────────────────────────────────────────

    /// <summary>
    /// POST api/access-requests
    /// User: submit a new multi-item access request batch.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateRequestDto dto)
    {
        int userId = GetUserId();
        var items  = dto.Items.Select(i => (i.FolderPath, i.AccessType, i.Reason)).ToList();
        int masterId = await workflowEngine.CreateMultiItemRequestAsync(
            userId,
            items,
            dto.IsAgreed.GetValueOrDefault(),
            dto.ItsrNo);

        return StatusCode(StatusCodes.Status201Created,
            new { masterRequestId = masterId, message = "Request batch submitted successfully." });
    }

    // ── Stage 1: HOD Approve / Reject ────────────────────────────────────────────

    /// <summary>
    /// POST api/access-requests/items/{itemId}/approve
    /// HOD: approve or reject an individual item ticket.
    /// Body: { decision: 1|2, comments: "..." }
    /// </summary>
    [HttpPost("items/{itemId:int}/approve")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> HodApprove(
        [FromRoute] int itemId, [FromBody] ProcessApprovalDto dto)
    {
        int approverId = GetUserId();
        await workflowEngine.ProcessItemApprovalAsync(approverId, itemId, dto.Decision, dto.Comments);
        return Ok(new { message = $"Ticket #{itemId} evaluation recorded." });
    }

    // ── Stage 2: IT Provision / Reject ───────────────────────────────────────────

    /// <summary>
    /// POST api/access-requests/items/{itemId}/provision
    /// IT: finalise provisioning (Completed) or reject.
    /// Body: { finalDecision: 4|2, confirmedAccessType: ..., operationalComments: "..." }
    /// </summary>
    [HttpPost("items/{itemId:int}/provision")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Provision(
        [FromRoute] int itemId, [FromBody] FinalizeProvisioningDto dto)
    {
        int agentId = GetUserId();
        await workflowEngine.FinalizeItemProvisioningAsync(
            agentId, itemId, dto.FinalDecision, dto.ConfirmedAccessType, dto.OperationalComments);
        return Ok(new { message = $"Provisioning for ticket #{itemId} completed." });
    }

    // ── Revoke ────────────────────────────────────────────────────────────────────

    /// <summary>
    /// POST api/access-requests/items/{itemId}/revoke
    /// IT: force-terminate an active access item.
    /// Body: { revocationReason: "..." }
    /// </summary>
    [HttpPost("items/{itemId:int}/revoke")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Revoke(
        [FromRoute] int itemId, [FromBody] RevokeAccessDto dto)
    {
        int agentId = GetUserId();
        await workflowEngine.RevokeAccessAsync(agentId, itemId, dto.RevocationReason);
        return Ok(new { message = $"Access for ticket #{itemId} has been revoked." });
    }

    // ── Renew ─────────────────────────────────────────────────────────────────────

    /// <summary>
    /// POST api/access-requests/items/{itemId}/renew
    /// IT: extend an active access item by another 90 days.
    /// Body: { renewalNotes: "..." }
    /// </summary>
    [HttpPost("items/{itemId:int}/renew")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Renew(
        [FromRoute] int itemId, [FromBody] RenewAccessDto dto)
    {
        int agentId = GetUserId();
        await workflowEngine.RenewAccessAsync(agentId, itemId, dto.RenewalNotes);
        return Ok(new { message = $"Access for ticket #{itemId} renewed by 90 days." });
    }

    // ── Resubmit ──────────────────────────────────────────────────────────────────

    /// <summary>
    /// POST api/access-requests/items/{itemId}/resubmit
    /// User: clone a rejected/expired/revoked ticket into a fresh workflow cycle.
    /// Body: { updatedReason: "..." }  (optional)
    /// </summary>
    [HttpPost("items/{itemId:int}/resubmit")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Resubmit(
        [FromRoute] int itemId, [FromBody] ResubmitRequestDto dto)
    {
        int userId = GetUserId();
        int newMasterId = await workflowEngine.ResubmitExpiredOrFailedRequestAsync(userId, itemId, dto.UpdatedReason);
        return Ok(new { message = "Resubmission successful.", newMasterRequestId = newMasterId });
    }

    // ── Private ───────────────────────────────────────────────────────────────────

    private int GetUserId()
    {
        if (Request.Headers.TryGetValue(UserIdHeader, out var val)
            && int.TryParse(val, out var id) && id > 0)
            return id;

        throw new BadHttpRequestException(
            "Missing or invalid X-User-Id header.", StatusCodes.Status401Unauthorized);
    }
}

// ── Additional DTOs (add to AccessRequestDtos.cs) ────────────────────────────────

public sealed class RenewAccessDto
{
    [System.ComponentModel.DataAnnotations.Required]
    [System.ComponentModel.DataAnnotations.StringLength(500, MinimumLength = 5)]
    public string RenewalNotes { get; set; } = string.Empty;
}