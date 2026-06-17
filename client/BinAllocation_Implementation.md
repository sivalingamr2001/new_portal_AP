# B3 Bin Allocation — Full Implementation Guide

> **Stack:** ASP.NET Core Web API · Oracle DB · Dapper ORM  
> **Tables:** `JAN_B3_HEADER` · `JAN_B3_LINES` · `JAN_B3_CANCELLATION`  
> *(JAN_BE_VS_SO_TAB is read-only reference — skipped from create)*

---

## Table of Contents

1. [Oracle DDL — Create 3 Tables + Sequences](#1-oracle-ddl)
2. [Models / DTOs](#2-models--dtos)
3. [IBinAllocationService — Interface](#3-ibinallocationservice--interface)
4. [BinAllocationService — Implementation](#4-binallocationservice--implementation)
5. [BinAllocationController](#5-binallocationcontroller)
6. [Program.cs / DI Registration](#6-programcs--di-registration)
7. [API Endpoint Reference](#7-api-endpoint-reference)

---

## 1. Oracle DDL

### Sequences

```sql
CREATE SEQUENCE JAN_B3_HEADER_SEQ       START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE JAN_B3_LINES_SEQ        START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE JAN_B3_CANCELLATION_SEQ START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
```

### JAN_B3_HEADER

```sql
CREATE TABLE JAN_B3_HEADER (
    HEADER_ID                NUMBER          PRIMARY KEY,
    TRANSACTION_DATE         DATE            NOT NULL,
    CUSTOMER_OR_ITEM_SPECIFIC NUMBER,
    CUSTOMER_ID              NUMBER,
    TERRITORY_ID             NUMBER,
    BILL_TO_CUSTOMER         NUMBER,
    SHIP_TO_CUSTOMER         NUMBER,
    CREATED_BY               VARCHAR2(100)   NOT NULL,
    CREATED_DATE             DATE            DEFAULT SYSDATE NOT NULL,
    UPDATED_BY               VARCHAR2(100),
    UPDATED_DATE             DATE,
    REMARKS                  VARCHAR2(250)
);
```

### JAN_B3_LINES

> Includes `REVISION` and `PARENT_LINE_ID` for the quantity revision pattern.

```sql
CREATE TABLE JAN_B3_LINES (
    LINE_ID              NUMBER          PRIMARY KEY,
    HEADER_ID            NUMBER          NOT NULL REFERENCES JAN_B3_HEADER(HEADER_ID),
    ORGANIZATION_ID      NUMBER,
    INVENTORY_ITEM_ID    NUMBER          NOT NULL,
    B3_QUANTITY          NUMBER          NOT NULL,
    TARGET_DATE          DATE,
    B3_APPROVED_QUANTITY NUMBER,
    APPROVAL_FLAG        VARCHAR2(1)     DEFAULT 'N' NOT NULL,
    APPROVED_DATE        DATE,
    APPROVED_BY          VARCHAR2(100),
    CLOSURE_FLAG         VARCHAR2(1)     DEFAULT 'N' NOT NULL,
    REVISION             NUMBER          DEFAULT 0,
    PARENT_LINE_ID       NUMBER          REFERENCES JAN_B3_LINES(LINE_ID)
);
```

### JAN_B3_CANCELLATION

```sql
CREATE TABLE JAN_B3_CANCELLATION (
    CANCEL_ID       NUMBER          PRIMARY KEY,
    LINE_ID         NUMBER          NOT NULL REFERENCES JAN_B3_LINES(LINE_ID),
    CANCELLED_QTY   NUMBER          NOT NULL,
    CANCELLED_DATE  DATE            DEFAULT SYSDATE NOT NULL,
    CANCEL_REASON   VARCHAR2(250),
    CREATED_BY      VARCHAR2(100)   NOT NULL,
    CREATED_DATE    DATE            DEFAULT SYSDATE NOT NULL
);
```

---

## 2. Models / DTOs

```csharp
// ---------------------------------------------------------------
// File: Models/BinAllocationModels.cs
// ---------------------------------------------------------------
namespace BinAllocation.Models
{
    // ── Header ──────────────────────────────────────────────────
    public class B3Header
    {
        public decimal HeaderId               { get; set; }
        public DateTime TransactionDate       { get; set; }
        public decimal? CustomerOrItemSpecific { get; set; }
        public decimal? CustomerId            { get; set; }
        public decimal? TerritoryId           { get; set; }
        public decimal? BillToCustomer        { get; set; }
        public decimal? ShipToCustomer        { get; set; }
        public string   CreatedBy             { get; set; }
        public DateTime CreatedDate           { get; set; }
        public string   UpdatedBy             { get; set; }
        public DateTime? UpdatedDate          { get; set; }
        public string   Remarks               { get; set; }
    }

    // ── Line ────────────────────────────────────────────────────
    public class B3Line
    {
        public decimal  LineId               { get; set; }
        public decimal  HeaderId             { get; set; }
        public decimal? OrganizationId       { get; set; }
        public decimal  InventoryItemId      { get; set; }
        public decimal  B3Quantity           { get; set; }
        public DateTime? TargetDate          { get; set; }
        public decimal? B3ApprovedQuantity   { get; set; }
        public string   ApprovalFlag         { get; set; }   // 'Y' | 'N'
        public DateTime? ApprovedDate        { get; set; }
        public string   ApprovedBy           { get; set; }
        public string   ClosureFlag          { get; set; }   // 'Y' | 'N'
        public decimal  Revision             { get; set; }
        public decimal? ParentLineId         { get; set; }
    }

    // ── Cancellation ────────────────────────────────────────────
    public class B3Cancellation
    {
        public decimal  CancelId       { get; set; }
        public decimal  LineId         { get; set; }
        public decimal  CancelledQty   { get; set; }
        public DateTime CancelledDate  { get; set; }
        public string   CancelReason   { get; set; }
        public string   CreatedBy      { get; set; }
        public DateTime CreatedDate    { get; set; }
    }

    // ── Flat result row (Header + Line joined) ───────────────────
    public class AllocationRow : B3Header
    {
        public decimal  LineId               { get; set; }
        public decimal? OrganizationId       { get; set; }
        public decimal  InventoryItemId      { get; set; }
        public decimal  B3Quantity           { get; set; }
        public DateTime? TargetDate          { get; set; }
        public decimal? B3ApprovedQuantity   { get; set; }
        public string   ApprovalFlag         { get; set; }
        public DateTime? ApprovedDate        { get; set; }
        public string   ApprovedBy           { get; set; }
        public string   ClosureFlag          { get; set; }
        public decimal  Revision             { get; set; }
    }

    // ── Summary row ─────────────────────────────────────────────
    public class AllocationSummary
    {
        public decimal  HeaderId           { get; set; }
        public DateTime TransactionDate    { get; set; }
        public decimal? CustomerId         { get; set; }
        public int      TotalLines         { get; set; }
        public decimal  TotalRequestedQty  { get; set; }
        public decimal  TotalApprovedQty   { get; set; }
        public int      ApprovedLines      { get; set; }
        public int      PendingLines       { get; set; }
        public int      CancelledLines     { get; set; }
    }

    // ── Request DTOs ─────────────────────────────────────────────
    public class CreateAllocationRequest
    {
        public DateTime TransactionDate        { get; set; }
        public decimal? CustomerOrItemSpecific { get; set; }
        public decimal? CustomerId             { get; set; }
        public decimal? TerritoryId            { get; set; }
        public decimal? BillToCustomer         { get; set; }
        public decimal? ShipToCustomer         { get; set; }
        public string   CreatedBy              { get; set; }
        public string   Remarks                { get; set; }
        public List<CreateLineRequest> Lines   { get; set; }
    }

    public class CreateLineRequest
    {
        public decimal?  OrganizationId    { get; set; }
        public decimal   InventoryItemId   { get; set; }
        public decimal   B3Quantity        { get; set; }
        public DateTime? TargetDate        { get; set; }
    }

    public class ReviseQuantityRequest
    {
        public decimal OriginalLineId  { get; set; }
        public decimal NewB3Quantity   { get; set; }
    }

    public class ApproveLineRequest
    {
        public decimal LineId            { get; set; }
        public decimal ApprovedQuantity  { get; set; }
        public string  ApprovedBy        { get; set; }
    }

    public class AmendQuantityRequest
    {
        public decimal LineId           { get; set; }
        public decimal AmendedQuantity  { get; set; }
        public string  AmendedBy        { get; set; }
    }

    public class CancelLineRequest
    {
        public decimal LineId        { get; set; }
        public decimal CancelledQty  { get; set; }
        public string  CancelReason  { get; set; }
        public string  CreatedBy     { get; set; }
    }

    public class CancelHeaderRequest
    {
        public decimal HeaderId      { get; set; }
        public string  CancelReason  { get; set; }
        public string  CreatedBy     { get; set; }
    }
}
```

---

## 3. IBinAllocationService — Interface

```csharp
// ---------------------------------------------------------------
// File: Services/IBinAllocationService.cs
// ---------------------------------------------------------------
using BinAllocation.Models;

namespace BinAllocation.Services
{
    public interface IBinAllocationService
    {
        // ── CREATE ───────────────────────────────────────────────
        /// <summary>
        /// Creates one header + N line items in a single transaction.
        /// Returns the generated HEADER_ID.
        /// </summary>
        Task<decimal> CreateAllocationAsync(CreateAllocationRequest request);

        // ── READ ─────────────────────────────────────────────────
        /// <summary>All allocations — header + lines joined.</summary>
        Task<IEnumerable<AllocationRow>> GetAllAllocationsAsync();

        /// <summary>Single allocation by header ID.</summary>
        Task<IEnumerable<AllocationRow>> GetAllocationByHeaderIdAsync(decimal headerId);

        /// <summary>All lines currently pending HOD approval.</summary>
        Task<IEnumerable<B3Line>> GetPendingApprovalLinesAsync();

        /// <summary>All cancellation records with context.</summary>
        Task<IEnumerable<B3Cancellation>> GetAllCancellationsAsync();

        /// <summary>Per-header summary (totals, approved, pending, cancelled).</summary>
        Task<IEnumerable<AllocationSummary>> GetAllocationSummaryAsync();

        // ── REVISE (User role — new row, not update) ─────────────
        /// <summary>
        /// Creates a new revision row for the given line.
        /// Does NOT modify the original row.
        /// </summary>
        Task<decimal> ReviseQuantityAsync(ReviseQuantityRequest request);

        /// <summary>Full revision history for a line (all revisions).</summary>
        Task<IEnumerable<B3Line>> GetLineRevisionHistoryAsync(decimal originalLineId);

        // ── APPROVE (HOD) ─────────────────────────────────────────
        /// <summary>HOD approves a pending line with approved quantity.</summary>
        Task<bool> ApproveLineAsync(ApproveLineRequest request);

        // ── AMEND (HOD post-approval) ─────────────────────────────
        /// <summary>HOD amends the approved quantity of an already-approved line.</summary>
        Task<bool> AmendApprovedQuantityAsync(AmendQuantityRequest request);

        // ── CANCEL ────────────────────────────────────────────────
        /// <summary>Cancels a single line — inserts cancellation + closes line.</summary>
        Task<bool> CancelLineAsync(CancelLineRequest request);

        /// <summary>Cancels all open lines under a header.</summary>
        Task<bool> CancelAllLinesAsync(CancelHeaderRequest request);
    }
}
```

---

## 4. BinAllocationService — Implementation

```csharp
// ---------------------------------------------------------------
// File: Services/BinAllocationService.cs
// ---------------------------------------------------------------
using System.Data;
using BinAllocation.Data;
using BinAllocation.Models;
using Dapper;
using Oracle.ManagedDataAccess.Client;

namespace BinAllocation.Services
{
    public class BinAllocationService : IBinAllocationService
    {
        private readonly string _connectionString;

        public BinAllocationService(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("OracleDb")
                ?? throw new InvalidOperationException("OracleDb connection string missing.");
        }

        private IDbConnection CreateConnection() =>
            new OracleConnection(_connectionString);

        // ── CREATE ───────────────────────────────────────────────────────────

        public async Task<decimal> CreateAllocationAsync(CreateAllocationRequest req)
        {
            using var conn = CreateConnection();
            conn.Open();
            using var tx = conn.BeginTransaction();

            try
            {
                // 1. Insert Header
                var headerParams = new DynamicParameters();
                headerParams.Add("p_transaction_date",         req.TransactionDate);
                headerParams.Add("p_customer_or_item_specific", req.CustomerOrItemSpecific);
                headerParams.Add("p_customer_id",              req.CustomerId);
                headerParams.Add("p_territory_id",             req.TerritoryId);
                headerParams.Add("p_bill_to_customer",         req.BillToCustomer);
                headerParams.Add("p_ship_to_customer",         req.ShipToCustomer);
                headerParams.Add("p_created_by",               req.CreatedBy);
                headerParams.Add("p_remarks",                  req.Remarks);
                headerParams.Add("p_header_id", dbType: DbType.Decimal,
                                 direction: ParameterDirection.Output);

                await conn.ExecuteAsync(Queries.CreateBinAllocationHeader,
                                        headerParams, transaction: tx);
                decimal headerId = headerParams.Get<decimal>("p_header_id");

                // 2. Insert each Line
                foreach (var line in req.Lines)
                {
                    var lineParams = new DynamicParameters();
                    lineParams.Add("p_header_id",         headerId);
                    lineParams.Add("p_organization_id",   line.OrganizationId);
                    lineParams.Add("p_inventory_item_id", line.InventoryItemId);
                    lineParams.Add("p_b3_quantity",        line.B3Quantity);
                    lineParams.Add("p_target_date",        line.TargetDate);
                    lineParams.Add("p_line_id", dbType: DbType.Decimal,
                                   direction: ParameterDirection.Output);

                    await conn.ExecuteAsync(Queries.CreateBinAllocationLine,
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
            return await conn.QueryAsync<AllocationRow>(Queries.GetAllAllocations);
        }

        public async Task<IEnumerable<AllocationRow>> GetAllocationByHeaderIdAsync(decimal headerId)
        {
            using var conn = CreateConnection();
            return await conn.QueryAsync<AllocationRow>(
                Queries.GetAllocationByHeaderId,
                new { p_header_id = headerId });
        }

        public async Task<IEnumerable<B3Line>> GetPendingApprovalLinesAsync()
        {
            using var conn = CreateConnection();
            return await conn.QueryAsync<B3Line>(Queries.GetPendingApprovalLines);
        }

        public async Task<IEnumerable<B3Cancellation>> GetAllCancellationsAsync()
        {
            using var conn = CreateConnection();
            return await conn.QueryAsync<B3Cancellation>(Queries.GetAllCancellations);
        }

        public async Task<IEnumerable<AllocationSummary>> GetAllocationSummaryAsync()
        {
            using var conn = CreateConnection();
            return await conn.QueryAsync<AllocationSummary>(Queries.GetAllocationSummary);
        }

        // ── REVISE ───────────────────────────────────────────────────────────

        public async Task<decimal> ReviseQuantityAsync(ReviseQuantityRequest req)
        {
            using var conn = CreateConnection();
            conn.Open();

            var p = new DynamicParameters();
            p.Add("p_new_b3_quantity",    req.NewB3Quantity);
            p.Add("p_original_line_id",   req.OriginalLineId);

            // The INSERT..SELECT returns the new LINE_ID via RETURNING
            p.Add("p_line_id", dbType: DbType.Decimal,
                  direction: ParameterDirection.Output);

            await conn.ExecuteAsync(Queries.CreateQuantityRevision, p);
            return p.Get<decimal>("p_line_id");
        }

        public async Task<IEnumerable<B3Line>> GetLineRevisionHistoryAsync(decimal originalLineId)
        {
            using var conn = CreateConnection();
            return await conn.QueryAsync<B3Line>(
                Queries.GetLineRevisionHistory,
                new { p_original_line_id = originalLineId });
        }

        // ── APPROVE ──────────────────────────────────────────────────────────

        public async Task<bool> ApproveLineAsync(ApproveLineRequest req)
        {
            using var conn = CreateConnection();
            var rows = await conn.ExecuteAsync(
                Queries.HodApproveAllocationLine,
                new
                {
                    p_approved_quantity = req.ApprovedQuantity,
                    p_approved_by       = req.ApprovedBy,
                    p_line_id           = req.LineId
                });
            return rows > 0;
        }

        // ── AMEND ────────────────────────────────────────────────────────────

        public async Task<bool> AmendApprovedQuantityAsync(AmendQuantityRequest req)
        {
            using var conn = CreateConnection();
            var rows = await conn.ExecuteAsync(
                Queries.AmendApprovedQuantity,
                new
                {
                    p_amended_quantity = req.AmendedQuantity,
                    p_amended_by       = req.AmendedBy,
                    p_line_id          = req.LineId
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
                    Queries.InsertCancellationRecord,
                    new
                    {
                        p_line_id       = req.LineId,
                        p_cancelled_qty = req.CancelledQty,
                        p_cancel_reason = req.CancelReason,
                        p_created_by    = req.CreatedBy
                    },
                    transaction: tx);

                // 2. Close the line
                await conn.ExecuteAsync(
                    Queries.CloseCancelledLine,
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
                var p = new { p_header_id = req.HeaderId,
                              p_cancel_reason = req.CancelReason,
                              p_created_by    = req.CreatedBy };

                // 1. Insert cancellation rows for all open lines
                await conn.ExecuteAsync(
                    Queries.InsertCancellationForAllLines, p, transaction: tx);

                // 2. Close all open lines
                await conn.ExecuteAsync(
                    Queries.CloseAllLinesForHeader, p, transaction: tx);

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
```

---

## 5. BinAllocationController

```csharp
// ---------------------------------------------------------------
// File: Controllers/BinAllocationController.cs
// ---------------------------------------------------------------
using BinAllocation.Models;
using BinAllocation.Services;
using Microsoft.AspNetCore.Mvc;

namespace BinAllocation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BinAllocationController : ControllerBase
    {
        private readonly IBinAllocationService _service;
        private readonly ILogger<BinAllocationController> _logger;

        public BinAllocationController(IBinAllocationService service,
                                       ILogger<BinAllocationController> logger)
        {
            _service = service;
            _logger  = logger;
        }

        // ── POST /api/binallocation ───────────────────────────────
        /// <summary>
        /// Create a bin allocation — one header with multiple line items.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateAllocation(
            [FromBody] CreateAllocationRequest request)
        {
            if (request?.Lines == null || !request.Lines.Any())
                return BadRequest("At least one line item is required.");

            var headerId = await _service.CreateAllocationAsync(request);
            return CreatedAtAction(nameof(GetAllocationByHeaderId),
                                   new { headerId }, new { HeaderId = headerId });
        }

        // ── GET /api/binallocation ────────────────────────────────
        /// <summary>Get all bin allocations (header + lines).</summary>
        [HttpGet]
        public async Task<IActionResult> GetAllAllocations()
        {
            var data = await _service.GetAllAllocationsAsync();
            return Ok(data);
        }

        // ── GET /api/binallocation/{headerId} ─────────────────────
        /// <summary>Get a single allocation by header ID.</summary>
        [HttpGet("{headerId:decimal}")]
        public async Task<IActionResult> GetAllocationByHeaderId(decimal headerId)
        {
            var data = await _service.GetAllocationByHeaderIdAsync(headerId);
            if (!data.Any()) return NotFound();
            return Ok(data);
        }

        // ── GET /api/binallocation/summary ────────────────────────
        /// <summary>Dashboard summary per header.</summary>
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var data = await _service.GetAllocationSummaryAsync();
            return Ok(data);
        }

        // ── GET /api/binallocation/pending-approval ───────────────
        /// <summary>All lines pending HOD approval.</summary>
        [HttpGet("pending-approval")]
        public async Task<IActionResult> GetPendingApproval()
        {
            var data = await _service.GetPendingApprovalLinesAsync();
            return Ok(data);
        }

        // ── POST /api/binallocation/revise ────────────────────────
        /// <summary>
        /// User role: update requested quantity.
        /// Creates a NEW revision row — does NOT modify the original.
        /// </summary>
        [HttpPost("revise")]
        public async Task<IActionResult> ReviseQuantity(
            [FromBody] ReviseQuantityRequest request)
        {
            var newLineId = await _service.ReviseQuantityAsync(request);
            return Ok(new { NewLineId = newLineId,
                            Message   = "Revision created successfully." });
        }

        // ── GET /api/binallocation/revisions/{lineId} ─────────────
        /// <summary>Get full revision history for a line.</summary>
        [HttpGet("revisions/{lineId:decimal}")]
        public async Task<IActionResult> GetRevisionHistory(decimal lineId)
        {
            var data = await _service.GetLineRevisionHistoryAsync(lineId);
            return Ok(data);
        }

        // ── PUT /api/binallocation/approve ────────────────────────
        /// <summary>HOD approves a pending line with approved quantity.</summary>
        [HttpPut("approve")]
        public async Task<IActionResult> ApproveLine(
            [FromBody] ApproveLineRequest request)
        {
            var success = await _service.ApproveLineAsync(request);
            if (!success)
                return BadRequest("Line not found, already approved, or closed.");
            return Ok(new { Message = "Line approved successfully." });
        }

        // ── PUT /api/binallocation/amend ──────────────────────────
        /// <summary>HOD amends approved quantity of an approved line.</summary>
        [HttpPut("amend")]
        public async Task<IActionResult> AmendQuantity(
            [FromBody] AmendQuantityRequest request)
        {
            var success = await _service.AmendApprovedQuantityAsync(request);
            if (!success)
                return BadRequest("Line not found, not yet approved, or already closed.");
            return Ok(new { Message = "Approved quantity amended successfully." });
        }

        // ── POST /api/binallocation/cancel/line ───────────────────
        /// <summary>Cancel a single allocation line.</summary>
        [HttpPost("cancel/line")]
        public async Task<IActionResult> CancelLine(
            [FromBody] CancelLineRequest request)
        {
            await _service.CancelLineAsync(request);
            return Ok(new { Message = "Line cancelled successfully." });
        }

        // ── POST /api/binallocation/cancel/header ─────────────────
        /// <summary>Cancel all open lines under a header.</summary>
        [HttpPost("cancel/header")]
        public async Task<IActionResult> CancelAllLines(
            [FromBody] CancelHeaderRequest request)
        {
            await _service.CancelAllLinesAsync(request);
            return Ok(new { Message = "All lines for header cancelled successfully." });
        }

        // ── GET /api/binallocation/cancellations ──────────────────
        /// <summary>Fetch all cancellation records with context.</summary>
        [HttpGet("cancellations")]
        public async Task<IActionResult> GetCancellations()
        {
            var data = await _service.GetAllCancellationsAsync();
            return Ok(data);
        }
    }
}
```

---

## 6. Program.cs / DI Registration

```csharp
// ---------------------------------------------------------------
// File: Program.cs
// ---------------------------------------------------------------
using BinAllocation.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register service
builder.Services.AddScoped<IBinAllocationService, BinAllocationService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthorization();
app.MapControllers();
app.Run();
```

```json
// appsettings.json — connection string
{
  "ConnectionStrings": {
    "OracleDb": "User Id=YOUR_USER;Password=YOUR_PASS;Data Source=YOUR_HOST:1521/YOUR_SERVICE;"
  }
}
```

**NuGet packages required:**

```xml
<PackageReference Include="Dapper"                              Version="2.1.35" />
<PackageReference Include="Oracle.ManagedDataAccess.Core"       Version="23.5.1" />
<PackageReference Include="Microsoft.Extensions.Configuration"  Version="8.0.0" />
```

---

## 7. API Endpoint Reference

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/api/binallocation` | Create allocation (header + lines) |
| `GET` | `/api/binallocation` | Get all allocations |
| `GET` | `/api/binallocation/{headerId}` | Get allocation by header ID |
| `GET` | `/api/binallocation/summary` | Dashboard summary |
| `GET` | `/api/binallocation/pending-approval` | Lines pending HOD approval |
| `POST` | `/api/binallocation/revise` | User revises quantity (new revision row) |
| `GET` | `/api/binallocation/revisions/{lineId}` | Revision history for a line |
| `PUT` | `/api/binallocation/approve` | HOD approves a line |
| `PUT` | `/api/binallocation/amend` | HOD amends approved quantity |
| `POST` | `/api/binallocation/cancel/line` | Cancel a single line |
| `POST` | `/api/binallocation/cancel/header` | Cancel all lines under a header |
| `GET` | `/api/binallocation/cancellations` | All cancellation records |

---

## Business Rules Summary

| Scenario | Rule |
|----------|------|
| Create allocation | Header first → lines in loop, single transaction |
| User revises qty | INSERT new row with `REVISION + 1`, link via `PARENT_LINE_ID` — never UPDATE original |
| HOD approve | Only lines where `APPROVAL_FLAG = 'N'` AND `CLOSURE_FLAG = 'N'` |
| HOD amend | Only lines where `APPROVAL_FLAG = 'Y'` AND `CLOSURE_FLAG = 'N'` |
| Cancel line | Insert to `JAN_B3_CANCELLATION` + set `CLOSURE_FLAG = 'Y'` in one transaction |
| Cancel header | Bulk cancel all open lines under header in one transaction |
