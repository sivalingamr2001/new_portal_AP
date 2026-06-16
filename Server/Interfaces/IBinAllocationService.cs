using Backend.Models;

namespace Backend.Interfaces;

/// <summary>
/// Service contract for bin allocation CRUD, demand metrics, and inventory lookups.
/// </summary>
public interface IBinAllocationService
{
    Task<IEnumerable<OrganizationDto>> GetInventoryOrganizationsAsync(CancellationToken cancellationToken = default);
    Task<PagedResult<InventoryItemDto>> GetInventoryItemDetailsAsync(int page, int pageSize, string? search, CancellationToken cancellationToken = default);
    Task<string?> GetSalesRrsCategoryAsync(int organizationId, int inventoryItemId, CancellationToken cancellationToken = default);
    Task<int> CreateAllocationAsync(CreateAllocationRequest request, CancellationToken cancellationToken = default);
    Task UpdateAllocationAsync(int headerId, CreateAllocationRequest request, CancellationToken cancellationToken = default);
    Task ProcessApprovalAsync(ApprovalRequest request, CancellationToken cancellationToken = default);
    Task ProcessCancellationAsync(CancellationRequest request, CancellationToken cancellationToken = default);
    Task RejectAllocationAsync(RejectRequest request, CancellationToken cancellationToken = default);
    Task<DemandMetricsDto?> GetDemandMetricsAsync(int customerId, int organizationId, int inventoryItemId, CancellationToken cancellationToken = default);
    Task<IEnumerable<AllocationDetailsDto>> GetAllocationsAsync(CancellationToken cancellationToken = default);
    Task ProcessAmendmentAsync(AmendRequest request, CancellationToken cancellationToken = default);
}
