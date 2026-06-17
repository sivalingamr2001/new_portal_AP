using Backend.Models;

namespace Backend.Interfaces;

/// <summary>
/// Service contract handling geographic allocations, customer site uses, operational address data, and scheduling.
/// </summary>
public interface IAllocationService
{
    /// <summary>
    /// Retrieves the assigned Region and SubRegion for a specific user after successful authentication.
    /// </summary>
    Task<RegionDetailsDto?> GetRegionDetailsAfterLoginAsync(string username, string password, CancellationToken cancellationToken = default);

    /// <summary>
    /// Retrieves a unique list of all available Regions and SubRegions within the system.
    /// </summary>
    Task<IEnumerable<RegionDetailsDto>> GetAllRegionDetailsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets unique customer billing assignments filtering by user-specified region and sub-region.
    /// </summary>
    Task<IEnumerable<CustomerDto>> GetBillToCustomersAsync(string region, string subRegion, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets unique shipping configurations filtering by user-specified region and sub-region.
    /// </summary>
    Task<IEnumerable<CustomerDto>> GetShipToCustomersAsync(string region, string subRegion, CancellationToken cancellationToken = default);

    /// <summary>
    /// Pulls qualified executive employee profiles working out of a dynamic region.
    /// </summary>
    Task<IEnumerable<EmployeeDto>> GetPreparedByEmployeesAsync(string region, CancellationToken cancellationToken = default);

    /// <summary>
    /// Queries multi-location structures matching a specific client context, organization, and site use role.
    /// </summary>
    Task<IEnumerable<AddressDto>> GetCustomerAddressesAsync(string siteUseCode, long orgId, long customerId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Generates system standard upcoming sequence loops bound by operational organization and customer context.
    /// </summary>
    Task<IEnumerable<string>> GetWeekDropdownListAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Retrieves targeted corporate operational unit profiles filtered by core organization identifiers.
    /// </summary>
    Task<IEnumerable<OperatingUnitDto>> GetOperatingUnitsAsync(CancellationToken cancellationToken = default);

    Task<IEnumerable<OrganizationDto>> GetInventoryOrganizationsAsync(CancellationToken cancellationToken = default);
    Task<PagedResult<InventoryItemDto>> GetInventoryItemDetailsAsync(int page, int pageSize, string? search, CancellationToken cancellationToken = default);
    Task<string?> GetSalesRrsCategoryAsync(int organizationId, int inventoryItemId, CancellationToken cancellationToken = default);
    Task<DemandMetricsDto?> GetDemandMetricsAsync(int customerId, int organizationId, int inventoryItemId, CancellationToken cancellationToken = default);
}
