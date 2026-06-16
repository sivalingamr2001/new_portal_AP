using Backend.Exceptions;
using Backend.Interfaces;
using Backend.Models;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/allocations")]
[Produces("application/json")]
public sealed class BinAllocationController(IBinAllocationService allocationService) : ControllerBase
{
    private readonly IBinAllocationService _allocationService = allocationService;

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<AllocationDetailsDto>))]
    public async Task<ActionResult<IEnumerable<AllocationDetailsDto>>> GetAllocations(
        CancellationToken cancellationToken)
    {
        var result = await _allocationService.GetAllocationsAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("demand-metrics")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(DemandMetricsDto))]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<DemandMetricsDto>> GetDemandMetrics(
        [FromQuery] int customerId,
        [FromQuery] int organizationId,
        [FromQuery] int inventoryItemId,
        CancellationToken cancellationToken)
    {
        if (customerId <= 0 || organizationId <= 0 || inventoryItemId <= 0)
            throw new ValidationException("Invalid lookup query parameters supplied.");

        var metrics = await _allocationService.GetDemandMetricsAsync(
            customerId, organizationId, inventoryItemId, cancellationToken);

        return Ok(metrics ?? new DemandMetricsDto());
    }

    [HttpGet("organizations")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<OrganizationDto>))]
    public async Task<ActionResult<IEnumerable<OrganizationDto>>> GetOrganizations(
        CancellationToken cancellationToken)
    {
        var result = await _allocationService.GetInventoryOrganizationsAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("items")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(PagedResult<InventoryItemDto>))]
    public async Task<ActionResult<PagedResult<InventoryItemDto>>> GetItemDetails(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _allocationService.GetInventoryItemDetailsAsync(page, pageSize, search, cancellationToken);
        return Ok(result);
    }

    [HttpGet("rrs-category")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRrsCategory(
        [FromQuery] int organizationId,
        [FromQuery] int inventoryItemId,
        CancellationToken cancellationToken)
    {
        var result = await _allocationService.GetSalesRrsCategoryAsync(organizationId, inventoryItemId, cancellationToken);
        return Ok(new { rrsCategory = result });
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateAllocation(
        [FromBody] CreateAllocationRequest request,
        CancellationToken cancellationToken)
    {
        var headerId = await _allocationService.CreateAllocationAsync(request, cancellationToken);
        return Created($"/api/allocations/{headerId}", new { message = "Allocation created successfully", headerId });
    }

    [HttpPut("{headerId:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateAllocation(
        int headerId,
        [FromBody] CreateAllocationRequest request,
        CancellationToken cancellationToken)
    {
        await _allocationService.UpdateAllocationAsync(headerId, request, cancellationToken);
        return Ok(new { message = "Allocation updated successfully" });
    }

    [HttpPost("approve")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApproveAllocation(
        [FromBody] ApprovalRequest request,
        CancellationToken cancellationToken)
    {
        await _allocationService.ProcessApprovalAsync(request, cancellationToken);
        return Ok(new { message = "Item approved successfully" });
    }

    [HttpPost("cancel")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CancelAllocation(
        [FromBody] CancellationRequest request,
        CancellationToken cancellationToken)
    {
        await _allocationService.ProcessCancellationAsync(request, cancellationToken);
        return Ok(new { message = "Item cancelled successfully" });
    }

    [HttpPost("reject")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RejectAllocation(
        [FromBody] RejectRequest request,
        CancellationToken cancellationToken)
    {
        await _allocationService.RejectAllocationAsync(request, cancellationToken);
        return Ok(new { message = "Item rejected successfully" });
    }

    [HttpPost("amend")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AmendAllocation(
        [FromBody] AmendRequest request,
        CancellationToken cancellationToken)
    {
        await _allocationService.ProcessAmendmentAsync(request, cancellationToken);
        return Ok(new { message = "Item amendment requested successfully" });
    }
}
