using Backend.Interfaces;
using Backend.Models;
using Backend.Shared;

namespace Backend.Services;

/// <summary>
/// Implements the allocation service layer using dynamic query execution with parameterised bindings.
/// </summary>
public sealed class AllocationService(IDynamicQueryExecutor dynamicQuery) : IAllocationService
{
    private readonly IDynamicQueryExecutor _queryExecutor = dynamicQuery;

    public Task<RegionDetailsDto?> GetRegionDetailsAfterLoginAsync(string username, string password, CancellationToken cancellationToken = default)
        => _queryExecutor.QuerySingleOrDefaultAsync<RegionDetailsDto>(
            Queries.GetRegionDetailsAfterLogin,
            new { Uname = username, Password = password },
            cancellationToken: cancellationToken);

    public Task<IEnumerable<RegionDetailsDto>> GetAllRegionDetailsAsync(CancellationToken cancellationToken = default)
        => _queryExecutor.QueryAsync<RegionDetailsDto>(
            Queries.GetAllRegionDetails,
            cancellationToken: cancellationToken);

    public Task<IEnumerable<CustomerDto>> GetBillToCustomersAsync(string region, string subRegion, CancellationToken cancellationToken = default)
        => _queryExecutor.QueryAsync<CustomerDto>(
            Queries.GetBillToCustomersByRegion,
            new { Region = region, SubRegion = subRegion },
            cancellationToken: cancellationToken);

    public Task<IEnumerable<CustomerDto>> GetShipToCustomersAsync(string region, string subRegion, CancellationToken cancellationToken = default)
        => _queryExecutor.QueryAsync<CustomerDto>(
            Queries.GetShipToCustomersByRegion,
            new { Region = region, SubRegion = subRegion },
            cancellationToken: cancellationToken);

    public Task<IEnumerable<EmployeeDto>> GetPreparedByEmployeesAsync(string region, CancellationToken cancellationToken = default)
        => _queryExecutor.QueryAsync<EmployeeDto>(
            Queries.GetPreparedByEmployees,
            new { Region = region },
            cancellationToken: cancellationToken);

    public Task<IEnumerable<AddressDto>> GetCustomerAddressesAsync(string siteUseCode, long orgId, long customerId, CancellationToken cancellationToken = default)
        => _queryExecutor.QueryAsync<AddressDto>(
            Queries.GetCustomerMultipleLocations,
            new { SiteUseCode = siteUseCode, OrgId = orgId, CustomerId = customerId },
            cancellationToken: cancellationToken);

    public Task<IEnumerable<string>> GetWeekDropdownListAsync(CancellationToken cancellationToken = default)
        => _queryExecutor.QueryAsync<string>(
            Queries.GetWeekDropdownList,
            cancellationToken: cancellationToken);

    public Task<IEnumerable<OperatingUnitDto>> GetOperatingUnitsAsync(CancellationToken cancellationToken = default)
        => _queryExecutor.QueryAsync<OperatingUnitDto>(
            Queries.GetOperatingUnitDetails,
            cancellationToken: cancellationToken);

    public Task<IEnumerable<OrganizationDto>> GetInventoryOrganizationsAsync(CancellationToken cancellationToken = default)
        => _queryExecutor.QueryAsync<OrganizationDto>(
            Queries.GetInventoryOrganizations,
            cancellationToken: cancellationToken);

    public async Task<PagedResult<InventoryItemDto>> GetInventoryItemDetailsAsync(
        int page, int pageSize, string? search, CancellationToken cancellationToken = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Max(pageSize, 1);

        var parameters = new
        {
            Offset = (page - 1) * pageSize,
            PageSize = pageSize,
            Search = string.IsNullOrWhiteSpace(search) ? null : $"%{search.Trim()}%"
        };

        var (data, totalCount) = await _queryExecutor.QueryPagedAsync<InventoryItemDto>(
            Queries.GetInventoryItemDetails,
            Queries.CountInventoryItems,
            parameters,
            cancellationToken: cancellationToken);

        return new PagedResult<InventoryItemDto>(data.ToList(), totalCount, page, pageSize);
    }

    public Task<string?> GetSalesRrsCategoryAsync(int organizationId, int inventoryItemId, CancellationToken cancellationToken = default)
        => _queryExecutor.QuerySingleOrDefaultAsync<string>(
            Queries.GetSalesRrsCategory,
            new { OrganizationId = organizationId, InventoryItemId = inventoryItemId },
            cancellationToken: cancellationToken);

    public Task<DemandMetricsDto?> GetDemandMetricsAsync(int customerId, int organizationId, int inventoryItemId, CancellationToken cancellationToken = default)
        => _queryExecutor.QuerySingleOrDefaultAsync<DemandMetricsDto>(
            Queries.GetDemandMetrics,
            new { CustomerId = customerId, OrganizationId = organizationId, InventoryItemId = inventoryItemId },
            cancellationToken: cancellationToken);
}
