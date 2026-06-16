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

    public async Task<RegionDetailsDto?> GetRegionDetailsAfterLoginAsync(string username, string password, CancellationToken cancellationToken = default)
    {
        return await _queryExecutor.QuerySingleOrDefaultAsync<RegionDetailsDto>(
            Queries.GetRegionDetailsAfterLogin,
            new { Uname = username, Password = password },
            cancellationToken: cancellationToken);
    }

    public async Task<IEnumerable<RegionDetailsDto>> GetAllRegionDetailsAsync(CancellationToken cancellationToken = default)
    {
        return await _queryExecutor.QueryAsync<RegionDetailsDto>(
            Queries.GetAllRegionDetails,
            cancellationToken: cancellationToken);
    }

    public async Task<IEnumerable<CustomerDto>> GetBillToCustomersAsync(string region, string subRegion, CancellationToken cancellationToken = default)
    {
        return await _queryExecutor.QueryAsync<CustomerDto>(
            Queries.GetBillToCustomersByRegion,
            new { Region = region, SubRegion = subRegion },
            cancellationToken: cancellationToken);
    }

    public async Task<IEnumerable<CustomerDto>> GetShipToCustomersAsync(string region, string subRegion, CancellationToken cancellationToken = default)
    {
        return await _queryExecutor.QueryAsync<CustomerDto>(
            Queries.GetShipToCustomersByRegion,
            new { Region = region, SubRegion = subRegion },
            cancellationToken: cancellationToken);
    }

    public async Task<IEnumerable<EmployeeDto>> GetPreparedByEmployeesAsync(string region, CancellationToken cancellationToken = default)
    {
        return await _queryExecutor.QueryAsync<EmployeeDto>(
            Queries.GetPreparedByEmployees,
            new { Region = region },
            cancellationToken: cancellationToken);
    }

    public async Task<IEnumerable<AddressDto>> GetCustomerAddressesAsync(string siteUseCode, long orgId, long customerId, CancellationToken cancellationToken = default)
    {
        return await _queryExecutor.QueryAsync<AddressDto>(
            Queries.GetCustomerMultipleLocations,
            new { SiteUseCode = siteUseCode, OrgId = orgId, CustomerId = customerId },
            cancellationToken: cancellationToken);
    }

    public async Task<IEnumerable<string>> GetWeekDropdownListAsync(CancellationToken cancellationToken = default)
    {
        return await _queryExecutor.QueryAsync<string>(
            Queries.GetWeekDropdownList,
            cancellationToken: cancellationToken);
    }

    public async Task<IEnumerable<OperatingUnitDto>> GetOperatingUnitsAsync(CancellationToken cancellationToken = default)
    {
        return await _queryExecutor.QueryAsync<OperatingUnitDto>(
            Queries.GetOperatingUnitDetails,
            cancellationToken: cancellationToken);
    }
}
