using Backend.Interfaces;
using Backend.Models;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

/// <summary>
/// Handles geographic allocations, customer site roles, address locations, and scheduling parameters.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public sealed class AllocationController(IAllocationService allocationService) : ControllerBase
{
    private readonly IAllocationService _allocationService = allocationService;

    [HttpGet("regions")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<RegionDetailsDto>))]
    public async Task<ActionResult<IEnumerable<RegionDetailsDto>>> GetAllRegions(
        CancellationToken cancellationToken)
    {
        var regions = await _allocationService.GetAllRegionDetailsAsync(cancellationToken);
        return Ok(regions);
    }

    [HttpGet("customers/bill-to")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<CustomerDto>))]
    public async Task<ActionResult<IEnumerable<CustomerDto>>> GetBillToCustomers(
        [FromQuery] string region,
        [FromQuery] string subRegion,
        CancellationToken cancellationToken = default)
    {
        var customers = await _allocationService.GetBillToCustomersAsync(region, subRegion, cancellationToken);
        return Ok(customers);
    }

    [HttpGet("customers/ship-to")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<CustomerDto>))]
    public async Task<ActionResult<IEnumerable<CustomerDto>>> GetShipToCustomers(
        [FromQuery] string region,
        [FromQuery] string subRegion,
        CancellationToken cancellationToken = default)
    {
        var customers = await _allocationService.GetShipToCustomersAsync(region, subRegion, cancellationToken);
        return Ok(customers);
    }

    [HttpGet("employees/prepared-by")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<EmployeeDto>))]
    public async Task<ActionResult<IEnumerable<EmployeeDto>>> GetPreparedByEmployees(
        [FromQuery] string region,
        CancellationToken cancellationToken = default)
    {
        var employees = await _allocationService.GetPreparedByEmployeesAsync(region, cancellationToken);
        return Ok(employees);
    }

    [HttpGet("customers/{customerId:long}/addresses")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<AddressDto>))]
    public async Task<ActionResult<IEnumerable<AddressDto>>> GetCustomerAddresses(
        long customerId,
        [FromQuery] string siteUseCode,
        [FromQuery] long orgId,
        CancellationToken cancellationToken = default)
    {
        var addresses = await _allocationService.GetCustomerAddressesAsync(
            siteUseCode, orgId, customerId, cancellationToken);
        return Ok(addresses);
    }

    [HttpGet("weeks/dropdown")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<string>))]
    public async Task<ActionResult<IEnumerable<string>>> GetWeeksDropdown(
        CancellationToken cancellationToken = default)
    {
        var weeks = await _allocationService.GetWeekDropdownListAsync(cancellationToken);
        return Ok(weeks);
    }

    [HttpGet("operating-units")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<OperatingUnitDto>))]
    public async Task<ActionResult<IEnumerable<OperatingUnitDto>>> GetOperatingUnits(
        CancellationToken cancellationToken = default)
    {
        var units = await _allocationService.GetOperatingUnitsAsync(cancellationToken);
        return Ok(units);
    }
}
