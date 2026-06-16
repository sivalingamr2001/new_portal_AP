using Backend.Exceptions;
using Backend.Interfaces;
using Backend.Models;
using Backend.Shared;

namespace Backend.Services;

/// <summary>
/// Bin allocation business logic backed by <see cref="IDynamicQueryExecutor"/>.
/// </summary>
public sealed class BinAllocationService(IDynamicQueryExecutor queryExecutor) : IBinAllocationService
{
    private readonly IDynamicQueryExecutor _query = queryExecutor;

    public Task<IEnumerable<OrganizationDto>> GetInventoryOrganizationsAsync(CancellationToken cancellationToken = default)
        => _query.QueryAsync<OrganizationDto>(Queries.GetInventoryOrganizations, cancellationToken: cancellationToken);

    public async Task<PagedResult<InventoryItemDto>> GetInventoryItemDetailsAsync(
        int page, int pageSize, string? search, CancellationToken cancellationToken = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Max(pageSize, 1);
        int offset = (page - 1) * pageSize;
        string? searchParam = string.IsNullOrWhiteSpace(search) ? null : $"%{search.Trim()}%";

        var parameters = new { Offset = offset, PageSize = pageSize, Search = searchParam };

        var (data, totalCount) = await _query.QueryPagedAsync<InventoryItemDto>(
            Queries.GetInventoryItemDetails,
            Queries.CountInventoryItems,
            parameters,
            cancellationToken: cancellationToken);

        return new PagedResult<InventoryItemDto>(data.ToList(), totalCount, page, pageSize);
    }

    public Task<string?> GetSalesRrsCategoryAsync(
        int organizationId, int inventoryItemId, CancellationToken cancellationToken = default)
        => _query.QuerySingleOrDefaultAsync<string>(
            Queries.GetSalesRrsCategory,
            new { OrganizationId = organizationId, InventoryItemId = inventoryItemId },
            cancellationToken: cancellationToken);

    public async Task<int> CreateAllocationAsync(CreateAllocationRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(request.Header);

        int headerId = 0;

        await _query.ExecuteInTransactionAsync(async tx =>
        {
            headerId = await _query.ExecuteScalarAsync<int>(
                Queries.InsertAllocationHeader,
                new
                {
                    request.Header.RequestDate,
                    request.Header.AllocationBasis,
                    request.Header.CustomerId,
                    request.Header.TerritoryId,
                    request.Header.Remarks,
                    request.Header.CreatedBy
                },
                transaction: tx,
                cancellationToken: cancellationToken);

            foreach (var line in request.Lines)
            {
                await _query.ExecuteAsync(
                    Queries.InsertAllocationLine,
                    new
                    {
                        HeaderId = headerId,
                        line.ItemCode,
                        line.WarehouseId,
                        line.RequestedQty,
                        line.TargetDate
                    },
                    transaction: tx,
                    cancellationToken: cancellationToken);
            }
        }, cancellationToken: cancellationToken);

        return headerId;
    }

    public Task<DemandMetricsDto?> GetDemandMetricsAsync(
        int customerId, int organizationId, int inventoryItemId, CancellationToken cancellationToken = default)
        => _query.QuerySingleOrDefaultAsync<DemandMetricsDto>(
            Queries.GetDemandMetrics,
            new { CustomerId = customerId, OrganizationId = organizationId, InventoryItemId = inventoryItemId },
            cancellationToken: cancellationToken);

    public async Task UpdateAllocationAsync(
        int headerId, CreateAllocationRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var rowsUpdated = 0;

        await _query.ExecuteInTransactionAsync(async tx =>
        {
            foreach (var line in request.Lines.Where(l => l.LineId > 0))
            {
                rowsUpdated += await _query.ExecuteAsync(
                    Queries.UpdateAllocationLine,
                    new { line.LineId, line.RequestedQty, line.TargetDate },
                    transaction: tx,
                    cancellationToken: cancellationToken);
            }
        }, cancellationToken: cancellationToken);

        if (rowsUpdated == 0)
            throw new BusinessException($"No pending allocation lines were updated for header {headerId}.");
    }

    public async Task ProcessApprovalAsync(ApprovalRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var status = request.Decision == "Approve" ? "Approved" : "Hold";

        await _query.ExecuteInTransactionAsync(async tx =>
        {
            await _query.ExecuteAsync(
                Queries.InsertApprovalRecord,
                new
                {
                    request.LineId,
                    request.ApproverId,
                    request.ApprovedQty,
                    request.Decision,
                    request.Remarks
                },
                transaction: tx,
                cancellationToken: cancellationToken);

            var affected = await _query.ExecuteAsync(
                Queries.UpdateLineStatus,
                new { Status = status, request.ApprovedQty, request.LineId },
                transaction: tx,
                cancellationToken: cancellationToken);

            if (affected == 0)
                throw new NotFoundException($"Allocation line {request.LineId} was not found.");
        }, cancellationToken: cancellationToken);
    }

    public async Task ProcessCancellationAsync(CancellationRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        await _query.ExecuteInTransactionAsync(async tx =>
        {
            await _query.ExecuteAsync(
                Queries.InsertCancellationRecord,
                new
                {
                    request.LineId,
                    request.CancelledQty,
                    request.Reason,
                    request.CancelledBy
                },
                transaction: tx,
                cancellationToken: cancellationToken);

            var affected = await _query.ExecuteAsync(
                Queries.UpdateLineStatus,
                new { Status = "Cancelled", ApprovedQty = 0, request.LineId },
                transaction: tx,
                cancellationToken: cancellationToken);

            if (affected == 0)
                throw new NotFoundException($"Allocation line {request.LineId} was not found.");
        }, cancellationToken: cancellationToken);
    }

    public async Task RejectAllocationAsync(RejectRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var affected = await _query.ExecuteAsync(
            Queries.RejectAllocationLine,
            new { request.LineId },
            cancellationToken: cancellationToken);

        if (affected == 0)
            throw new NotFoundException($"Allocation line {request.LineId} was not found.");
    }

    public Task<IEnumerable<AllocationDetailsDto>> GetAllocationsAsync(CancellationToken cancellationToken = default)
        => _query.QueryAsync<AllocationDetailsDto>(Queries.GetAllAllocations, cancellationToken: cancellationToken);

    public async Task ProcessAmendmentAsync(AmendRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var affected = await _query.ExecuteAsync(
            Queries.AmendAllocationLine,
            new { request.NewQty, request.LineId },
            cancellationToken: cancellationToken);

        if (affected == 0)
            throw new NotFoundException($"Allocation line {request.LineId} was not found.");
    }
}
