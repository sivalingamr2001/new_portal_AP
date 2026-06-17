using Backend.DB;
using Backend.Interfaces;
using Backend.Models;
using Backend.Shared;
using Dapper;
using Oracle.ManagedDataAccess.Client;
using System.Data;

namespace Backend.Services
{
    public class BinAllocationService(OracleService oracleService) : IBinAllocationService
    {
        private readonly string _connectionString = oracleService.GetConnectionString()
                ?? throw new InvalidOperationException("OracleDb connection string missing.");

        private IDbConnection CreateConnection()
        {
            return new OracleConnection(_connectionString);
        }

        // ── CREATE ───────────────────────────────────────────────────────────

        public async Task<decimal> CreateAllocationAsync(CreateAllocationRequestV2 req)
        {
            using var conn = CreateConnection();
            conn.Open();
            using var tx = conn.BeginTransaction();

            try
            {
                // 1. Insert Header
                var headerParams = new DynamicParameters();
                headerParams.Add("p_transaction_date", req.TransactionDate);
                headerParams.Add("p_customer_or_item_specific", req.CustomerOrItemSpecific);
                headerParams.Add("p_customer_id", req.CustomerId);
                headerParams.Add("p_territory_id", req.TerritoryId);
                headerParams.Add("p_bill_to_customer", req.BillToCustomer);
                headerParams.Add("p_ship_to_customer", req.ShipToCustomer);
                headerParams.Add("p_created_by", req.CreatedBy);
                headerParams.Add("p_remarks", req.Remarks);
                headerParams.Add("p_header_id", dbType: DbType.Decimal,
                                 direction: ParameterDirection.Output);

                await conn.ExecuteAsync(QueriesV2.CreateBinAllocationHeader,
                                        headerParams, transaction: tx);
                decimal headerId = headerParams.Get<decimal>("p_header_id");

                // 2. Insert each Line
                foreach (var line in req.Lines)
                {
                    var lineParams = new DynamicParameters();
                    lineParams.Add("p_header_id", headerId);
                    lineParams.Add("p_organization_id", line.OrganizationId);
                    lineParams.Add("p_inventory_item_id", line.InventoryItemId);
                    lineParams.Add("p_b3_quantity", line.B3Quantity);
                    lineParams.Add("p_target_date", line.TargetDate);
                    lineParams.Add("p_line_id", dbType: DbType.Decimal,
                                   direction: ParameterDirection.Output);

                    await conn.ExecuteAsync(QueriesV2.CreateBinAllocationLine,
                                            lineParams, transaction: tx);
                }

                tx.Commit();
                return headerId;
            }
            catch
            {
                tx.Rollback();
                throw;
            }
        }

        // ── READ ─────────────────────────────────────────────────────────────

        public async Task<IEnumerable<AllocationRow>> GetAllAllocationsAsync()
        {
            using var conn = CreateConnection();
            return await conn.QueryAsync<AllocationRow>(QueriesV2.GetAllAllocations);
        }

        public async Task<IEnumerable<AllocationRow>> GetAllocationByHeaderIdAsync(decimal headerId)
        {
            using var conn = CreateConnection();
            return await conn.QueryAsync<AllocationRow>(
                QueriesV2.GetAllocationByHeaderId,
                new { p_header_id = headerId });
        }

        public async Task<IEnumerable<B3Line>> GetPendingApprovalLinesAsync()
        {
            using var conn = CreateConnection();
            return await conn.QueryAsync<B3Line>(QueriesV2.GetPendingApprovalLines);
        }

        public async Task<IEnumerable<B3Cancellation>> GetAllCancellationsAsync()
        {
            using var conn = CreateConnection();
            return await conn.QueryAsync<B3Cancellation>(QueriesV2.GetAllCancellations);
        }

        public async Task<IEnumerable<AllocationSummary>> GetAllocationSummaryAsync()
        {
            using var conn = CreateConnection();
            return await conn.QueryAsync<AllocationSummary>(QueriesV2.GetAllocationSummary);
        }

        // ── REVISE ───────────────────────────────────────────────────────────

        public async Task<decimal> ReviseQuantityAsync(ReviseQuantityRequest req)
        {
            using var conn = CreateConnection();
            conn.Open();

            var p = new DynamicParameters();
            p.Add("p_new_b3_quantity", req.NewB3Quantity);
            p.Add("p_original_line_id", req.OriginalLineId);

            // The INSERT..SELECT returns the new LINE_ID via RETURNING
            p.Add("p_line_id", dbType: DbType.Decimal,
                  direction: ParameterDirection.Output);

            await conn.ExecuteAsync(QueriesV2.CreateQuantityRevision, p);
            return p.Get<decimal>("p_line_id");
        }

        public async Task<IEnumerable<B3Line>> GetLineRevisionHistoryAsync(decimal originalLineId)
        {
            using var conn = CreateConnection();
            return await conn.QueryAsync<B3Line>(
                QueriesV2.GetLineRevisionHistory,
                new { p_original_line_id = originalLineId });
        }

        // ── APPROVE ──────────────────────────────────────────────────────────

        public async Task<bool> ApproveLineAsync(ApproveLineRequest req)
        {
            using var conn = CreateConnection();
            var rows = await conn.ExecuteAsync(
                QueriesV2.HodApproveAllocationLine,
                new
                {
                    p_approved_quantity = req.ApprovedQuantity,
                    p_approved_by = req.ApprovedBy,
                    p_line_id = req.LineId
                });
            return rows > 0;
        }

        // ── AMEND ────────────────────────────────────────────────────────────

        public async Task<bool> AmendApprovedQuantityAsync(AmendQuantityRequest req)
        {
            using var conn = CreateConnection();
            var rows = await conn.ExecuteAsync(
                QueriesV2.AmendApprovedQuantity,
                new
                {
                    p_amended_quantity = req.AmendedQuantity,
                    p_amended_by = req.AmendedBy,
                    p_line_id = req.LineId
                });
            return rows > 0;
        }

        // ── CANCEL ───────────────────────────────────────────────────────────

        public async Task<bool> CancelLineAsync(CancelLineRequest req)
        {
            using var conn = CreateConnection();
            conn.Open();
            using var tx = conn.BeginTransaction();

            try
            {
                // 1. Insert cancellation record
                await conn.ExecuteAsync(
                    QueriesV2.InsertCancellationRecord,
                    new
                    {
                        p_line_id = req.LineId,
                        p_cancelled_qty = req.CancelledQty,
                        p_cancel_reason = req.CancelReason,
                        p_created_by = req.CreatedBy
                    },
                    transaction: tx);

                // 2. Close the line
                await conn.ExecuteAsync(
                    QueriesV2.CloseCancelledLine,
                    new { p_line_id = req.LineId },
                    transaction: tx);

                tx.Commit();
                return true;
            }
            catch
            {
                tx.Rollback();
                throw;
            }
        }

        public async Task<bool> CancelAllLinesAsync(CancelHeaderRequest req)
        {
            using var conn = CreateConnection();
            conn.Open();
            using var tx = conn.BeginTransaction();

            try
            {
                var p = new
                {
                    p_header_id = req.HeaderId,
                    p_cancel_reason = req.CancelReason,
                    p_created_by = req.CreatedBy
                };

                // 1. Insert cancellation rows for all open lines
                await conn.ExecuteAsync(
                    QueriesV2.InsertCancellationForAllLines, p, transaction: tx);

                // 2. Close all open lines
                await conn.ExecuteAsync(
                    QueriesV2.CloseAllLinesForHeader, p, transaction: tx);

                tx.Commit();
                return true;
            }
            catch
            {
                tx.Rollback();
                throw;
            }
        }
    }
}