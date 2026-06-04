# Enterprise File Access Request System — Implementation Guide

> **Scope:** This document covers all new files to create. Your uploaded entities, DbContexts, DTOs, enums, and base classes are unchanged — do not re-create them.

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [New Entities to Add](#2-new-entities-to-add)
3. [AppDbContext — New DbSets](#3-appdbcontext--new-dbsets)
4. [Enums — AccessTypes](#4-enums--accesstypes)
5. [SignalR Hub](#5-signalr-hub)
6. [Notification Service](#6-notification-service)
7. [Ticket Number Generator](#7-ticket-number-generator)
8. [Access Request Service Interface](#8-access-request-service-interface)
9. [Access Request Service — Implementation](#9-access-request-service--implementation)
10. [HOD Cart Service](#10-hod-cart-service)
11. [Operator Cart Service](#11-operator-cart-service)
12. [Dashboard Service](#12-dashboard-service)
13. [Controllers](#13-controllers)
14. [DTOs](#14-dtos)
15. [Program.cs Registration](#15-programcs-registration)
16. [Workflow State Machine Reference](#16-workflow-state-machine-reference)

---

## 1. Project Structure

```
Web/
├── Domain/
│   ├── Entities/
│   │   └── Notification.cs              ← NEW
│   ├── Enums/
│   │   └── AccessTypes.cs               ← NEW
│   └── Dto/
│       ├── AccessRequest/
│       │   ├── SubmitAccessRequestDto.cs ← NEW
│       │   ├── AccessRequestSummaryDto.cs← NEW
│       │   ├── AccessItemActionDto.cs    ← NEW
│       │   └── RenewAccessItemDto.cs     ← NEW
│       ├── Dashboard/
│       │   └── DashboardDto.cs           ← NEW
│       └── Notification/
│           └── NotificationDto.cs        ← NEW
├── Application/
│   └── Services/
│       ├── IAccessRequestService.cs      ← NEW
│       ├── AccessRequestService.cs       ← NEW
│       ├── IHodCartService.cs            ← NEW
│       ├── HodCartService.cs             ← NEW
│       ├── IOperatorCartService.cs       ← NEW
│       ├── OperatorCartService.cs        ← NEW
│       ├── IDashboardService.cs          ← NEW
│       ├── DashboardService.cs           ← NEW
│       ├── INotificationService.cs       ← NEW
│       └── NotificationService.cs        ← NEW
├── Infrastructure/
│   └── Hubs/
│       └── NotificationHub.cs            ← NEW
│   └── Utilities/
│       └── TicketNumberGenerator.cs      ← NEW
└── API/
    └── Controllers/
        ├── AccessRequestController.cs    ← NEW
        ├── HodCartController.cs          ← NEW
        ├── OperatorCartController.cs     ← NEW
        ├── DashboardController.cs        ← NEW
        └── NotificationController.cs     ← NEW
```

---

## 2. New Entities to Add

### `Domain/Entities/Notification.cs`

```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Web.Domain.Common;

namespace Web.Domain.Entities;

[Table("jan_notifications")]
public sealed class NotificationEntity : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [Column("id")]
    public int NotificationId { get; set; }

    [Column("recipient_user_id")]
    public int RecipientUserId { get; set; }

    [Column("recipient_role")]
    [MaxLength(100)]
    public string RecipientRole { get; set; } = string.Empty;

    [Column("access_request_id")]
    public int? AccessRequestId { get; set; }

    [Column("access_item_id")]
    public int? AccessItemId { get; set; }

    [Column("ticket_number")]
    [MaxLength(100)]
    public string? TicketNumber { get; set; }

    [Column("title")]
    [MaxLength(255)]
    public string Title { get; set; } = string.Empty;

    [Column("message")]
    [MaxLength(2000)]
    public string Message { get; set; } = string.Empty;

    [Column("notification_type")]
    [MaxLength(100)]
    public string NotificationType { get; set; } = string.Empty;

    [Column("is_read")]
    public bool IsRead { get; set; } = false;

    [Column("read_at_utc")]
    public DateTime? ReadAtUtc { get; set; }
}
```

> **AppDbContext addition:** Add `public DbSet<NotificationEntity> Notifications => Set<NotificationEntity>();` and configure `HasKey(n => n.NotificationId)` in `OnModelCreating`.

---

## 3. AppDbContext — New DbSets

Add these two lines to your existing `AppDbContext.cs`:

```csharp
// In AppDbContext class body — add alongside existing DbSets
public DbSet<NotificationEntity> Notifications => Set<NotificationEntity>();

// In OnModelCreating — add alongside existing key configs
modelBuilder.Entity<NotificationEntity>().HasKey(n => n.NotificationId);
```

---

## 4. Enums — AccessTypes

```csharp
// Domain/Enums/AccessTypes.cs
namespace Web.Domain.Enums;

public enum AccessTypes
{
    Read = 1,
    Write = 2,
    ReadWrite = 3,
    FullControl = 4
}
```

---

## 5. SignalR Hub

### `Infrastructure/Hubs/NotificationHub.cs`

```csharp
using Microsoft.AspNetCore.SignalR;

namespace Web.Infrastructure.Hubs;

public sealed class NotificationHub : Hub
{
    // Client connects and joins their personal group by userId
    public async Task JoinUserGroup(string userId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
    }

    // Client joins role group: "role_Hod", "role_It", "role_Admin"
    public async Task JoinRoleGroup(string role)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"role_{role}");
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }
}
```

**Client-side usage (React/TypeScript reference):**

```typescript
// On login, call both:
await connection.invoke("JoinUserGroup", userId.toString());
await connection.invoke("JoinRoleGroup", userRole); // "Hod" | "It" | "User"

// Listen for notifications:
connection.on("ReceiveNotification", (notification: NotificationDto) => {
    // show toast / update notification badge
});
```

---

## 6. Notification Service

### `Application/Services/INotificationService.cs`

```csharp
namespace Web.Application.Services;

public interface INotificationService
{
    Task NotifyUserAsync(int userId, string role, string title, string message,
        string type, int? requestId = null, int? itemId = null, string? ticketNumber = null);

    Task NotifyRoleGroupAsync(string role, string title, string message,
        string type, int? requestId = null, int? itemId = null, string? ticketNumber = null);

    Task NotifyMultipleUsersAsync(IEnumerable<(int UserId, string Role)> recipients,
        string title, string message, string type,
        int? requestId = null, int? itemId = null, string? ticketNumber = null);

    Task<List<NotificationDto>> GetUserNotificationsAsync(int userId, bool unreadOnly = false);
    Task<Result> MarkAsReadAsync(int notificationId, int userId);
    Task<Result> MarkAllAsReadAsync(int userId);
    Task<int> GetUnreadCountAsync(int userId);
}
```

### `Application/Services/NotificationService.cs`

```csharp
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Web.Domain.Common;
using Web.Domain.Dto;
using Web.Domain.Entities;
using Web.Infrastructure.Data;
using Web.Infrastructure.Hubs;

namespace Web.Application.Services;

public sealed class NotificationService(
    AppDbContext db,
    IHubContext<NotificationHub> hubContext) : INotificationService
{
    public async Task NotifyUserAsync(int userId, string role, string title, string message,
        string type, int? requestId = null, int? itemId = null, string? ticketNumber = null)
    {
        var notification = await PersistAsync(userId, role, title, message, type,
            requestId, itemId, ticketNumber);

        var dto = MapToDto(notification);

        // Push to the user's personal SignalR group
        await hubContext.Clients
            .Group($"user_{userId}")
            .SendAsync("ReceiveNotification", dto);
    }

    public async Task NotifyRoleGroupAsync(string role, string title, string message,
        string type, int? requestId = null, int? itemId = null, string? ticketNumber = null)
    {
        // Persist a notification for each user in that role
        var usersInRole = await db.Users
            .Where(u => u.Role == role && u.IsActive)
            .Select(u => u.Id)
            .ToListAsync();

        foreach (var uid in usersInRole)
        {
            await PersistAsync(uid, role, title, message, type, requestId, itemId, ticketNumber);
        }

        // Broadcast to role group
        await hubContext.Clients
            .Group($"role_{role}")
            .SendAsync("ReceiveNotification", new
            {
                Title = title,
                Message = message,
                Type = type,
                TicketNumber = ticketNumber
            });
    }

    public async Task NotifyMultipleUsersAsync(IEnumerable<(int UserId, string Role)> recipients,
        string title, string message, string type,
        int? requestId = null, int? itemId = null, string? ticketNumber = null)
    {
        foreach (var (uid, role) in recipients)
        {
            await NotifyUserAsync(uid, role, title, message, type,
                requestId, itemId, ticketNumber);
        }
    }

    public async Task<List<NotificationDto>> GetUserNotificationsAsync(int userId, bool unreadOnly = false)
    {
        var query = db.Notifications
            .Where(n => n.RecipientUserId == userId);

        if (unreadOnly)
            query = query.Where(n => !n.IsRead);

        return await query
            .OrderByDescending(n => n.CreatedOn)
            .Take(100)
            .Select(n => MapToDto(n))
            .ToListAsync();
    }

    public async Task<Result> MarkAsReadAsync(int notificationId, int userId)
    {
        var notification = await db.Notifications
            .FirstOrDefaultAsync(n => n.NotificationId == notificationId
                                   && n.RecipientUserId == userId);

        if (notification is null)
            return Result.Failure(Error.NotFound("NOTIF_001", "Notification not found."));

        notification.IsRead = true;
        notification.ReadAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Result.Success();
    }

    public async Task<Result> MarkAllAsReadAsync(int userId)
    {
        await db.Notifications
            .Where(n => n.RecipientUserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(s => s
                .SetProperty(n => n.IsRead, true)
                .SetProperty(n => n.ReadAtUtc, DateTime.UtcNow));
        return Result.Success();
    }

    public async Task<int> GetUnreadCountAsync(int userId)
        => await db.Notifications.CountAsync(n => n.RecipientUserId == userId && !n.IsRead);

    // ─── Private Helpers ────────────────────────────────────────────────────────

    private async Task<NotificationEntity> PersistAsync(int userId, string role,
        string title, string message, string type,
        int? requestId, int? itemId, string? ticketNumber)
    {
        var entity = new NotificationEntity
        {
            RecipientUserId = userId,
            RecipientRole   = role,
            Title           = title,
            Message         = message,
            NotificationType = type,
            AccessRequestId = requestId,
            AccessItemId    = itemId,
            TicketNumber    = ticketNumber,
            IsActive        = true,
            CreatedOn       = DateTime.UtcNow,
            CreatedBy       = userId
        };

        db.Notifications.Add(entity);
        await db.SaveChangesAsync();
        return entity;
    }

    private static NotificationDto MapToDto(NotificationEntity n) => new(
        n.NotificationId,
        n.Title,
        n.Message,
        n.NotificationType,
        n.TicketNumber,
        n.AccessRequestId,
        n.AccessItemId,
        n.IsRead,
        n.ReadAtUtc,
        n.CreatedOn
    );
}
```

---

## 7. Ticket Number Generator

### `Infrastructure/Utilities/TicketNumberGenerator.cs`

```csharp
namespace Web.Infrastructure.Utilities;

/// <summary>
/// Generates unique per-item ticket numbers.
/// Format: ITSR-YYYYMMDD-{6-char random alphanumeric}
/// Example: ITSR-20250604-A3X9K2
/// </summary>
public static class TicketNumberGenerator
{
    private static readonly char[] Chars =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".ToCharArray(); // removes ambiguous chars

    public static string Generate()
    {
        var datePart = DateTime.UtcNow.ToString("yyyyMMdd");
        var randomPart = GenerateRandomSegment(6);
        return $"ITSR-{datePart}-{randomPart}";
    }

    private static string GenerateRandomSegment(int length)
    {
        var result = new char[length];
        var buffer = new byte[length];
        System.Security.Cryptography.RandomNumberGenerator.Fill(buffer);
        for (int i = 0; i < length; i++)
            result[i] = Chars[buffer[i] % Chars.Length];
        return new string(result);
    }
}
```

---

## 8. Access Request Service Interface

### `Application/Services/IAccessRequestService.cs`

```csharp
using Web.Domain.Common;
using Web.Domain.Dto;

namespace Web.Application.Services;

public interface IAccessRequestService
{
    /// <summary>User submits a new access request (moves to PendingWithHod).</summary>
    Task<Result<int>> SubmitRequestAsync(SubmitAccessRequestDto dto, int submittedByUserId);

    /// <summary>HOD submits their own request — moves directly to PendingWithIt.</summary>
    Task<Result<int>> SubmitHodRequestAsync(SubmitAccessRequestDto dto, int hodUserId);

    /// <summary>Get full request detail with all items.</summary>
    Task<Result<AccessRequestDetailDto>> GetRequestDetailAsync(int requestId, int callerUserId);

    /// <summary>Get all requests submitted by a user.</summary>
    Task<PagedResult<AccessRequestSummaryDto>> GetMyRequestsAsync(int userId, int page, int pageSize);

    /// <summary>User resubmits a rejected item (moves back to PendingWithHod).</summary>
    Task<Result> ResubmitItemAsync(int accessItemId, string reason, int userId);

    /// <summary>User renews an approved or expired item (new 90-day window).</summary>
    Task<Result> RenewItemAsync(int accessItemId, string reason, int userId);
}
```

---

## 9. Access Request Service — Implementation

### `Application/Services/AccessRequestService.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using Web.Domain.Common;
using Web.Domain.Dto;
using Web.Domain.Entities;
using Web.Domain.Enums;
using Web.Infrastructure.Data;
using Web.Infrastructure.Utilities;

namespace Web.Application.Services;

public sealed class AccessRequestService(
    AppDbContext db,
    INotificationService notificationService,
    HodDbContext hodDb,
    CmplDbContext cmplDb) : IAccessRequestService
{
    // ─── Submit (User) ───────────────────────────────────────────────────────────

    public async Task<Result<int>> SubmitRequestAsync(
        SubmitAccessRequestDto dto, int submittedByUserId)
    {
        var user = await cmplDb.CmplUsers.FirstOrDefaultAsync(u => u.Id == submittedByUserId);
        if (user is null)
            return Result.Failure<int>(Error.NotFound("USR_001", "User not found."));

        if (!dto.IsAgreed)
            return Result.Failure<int>(Error.Validation("REQ_001",
                "You must agree to the terms before submitting."));

        var request = new AccessRequestEntity
        {
            UserId        = submittedByUserId,
            ReqTo         = dto.ReqTo,
            IsAgreed      = true,
            CurrentStatus = RequestStatus.PendingWithHod,
            IsActive      = true,
            CreatedOn     = DateTime.UtcNow,
            CreatedBy     = submittedByUserId
        };

        db.AccessRequests.Add(request);
        await db.SaveChangesAsync();

        var items = await CreateItemsAsync(dto.Items, request.AccessReqId, submittedByUserId);

        // Audit each item
        foreach (var item in items)
        {
            db.AccessReqAudits.Add(BuildAudit(request.AccessReqId, item.AccessItemId,
                "Submitted", $"Item {item.TicketNumber} submitted by user.", submittedByUserId));
        }

        await db.SaveChangesAsync();

        // ─── Notifications ────────────────────────────────────────────────────
        await SendSubmissionNotificationsAsync(request, items, user);

        return Result.Success(request.AccessReqId);
    }

    // ─── Submit (HOD — goes directly to IT) ─────────────────────────────────────

    public async Task<Result<int>> SubmitHodRequestAsync(
        SubmitAccessRequestDto dto, int hodUserId)
    {
        var hod = await hodDb.HodMasters.FirstOrDefaultAsync(h => h.UserId == hodUserId);
        if (hod is null)
            return Result.Failure<int>(Error.NotFound("HOD_001", "HOD not found."));

        var request = new AccessRequestEntity
        {
            UserId        = hodUserId,
            ReqTo         = dto.ReqTo,
            IsAgreed      = true,
            CurrentStatus = RequestStatus.PendingWithIt,
            IsActive      = true,
            CreatedOn     = DateTime.UtcNow,
            CreatedBy     = hodUserId
        };

        db.AccessRequests.Add(request);
        await db.SaveChangesAsync();

        var items = await CreateItemsAsync(dto.Items, request.AccessReqId, hodUserId,
            hodApproverId: hodUserId, initialStatus: RequestStatus.PendingWithIt);

        foreach (var item in items)
        {
            db.AccessReqAudits.Add(BuildAudit(request.AccessReqId, item.AccessItemId,
                "HodSelfSubmit", $"HOD submitted item {item.TicketNumber} — forwarded to IT.", hodUserId));
        }

        await db.SaveChangesAsync();

        // Notify IT operators
        await notificationService.NotifyRoleGroupAsync(
            role: "It",
            title: "New HOD Access Request",
            message: $"HOD {hod.Name} submitted an access request with {items.Count} item(s).",
            type: "HodRequest",
            requestId: request.AccessReqId);

        return Result.Success(request.AccessReqId);
    }

    // ─── Get Request Detail ──────────────────────────────────────────────────────

    public async Task<Result<AccessRequestDetailDto>> GetRequestDetailAsync(
        int requestId, int callerUserId)
    {
        var request = await db.AccessRequests
            .Include(r => r.AccessItems)
            .FirstOrDefaultAsync(r => r.AccessReqId == requestId);

        if (request is null)
            return Result.Failure<AccessRequestDetailDto>(
                Error.NotFound("REQ_002", "Request not found."));

        return Result.Success(MapToDetailDto(request));
    }

    // ─── My Requests (Paged) ─────────────────────────────────────────────────────

    public async Task<PagedResult<AccessRequestSummaryDto>> GetMyRequestsAsync(
        int userId, int page, int pageSize)
    {
        var query = db.AccessRequests
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CreatedOn);

        var total = await query.CountAsync();

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(r => r.AccessItems)
            .Select(r => MapToSummaryDto(r))
            .ToListAsync();

        return new PagedResult<AccessRequestSummaryDto>(items, total, page, pageSize);
    }

    // ─── Resubmit Rejected Item ──────────────────────────────────────────────────

    public async Task<Result> ResubmitItemAsync(int accessItemId, string reason, int userId)
    {
        var item = await db.AccessItems
            .Include(i => i.AccessRequest)
            .FirstOrDefaultAsync(i => i.AccessItemId == accessItemId);

        if (item is null)
            return Result.Failure(Error.NotFound("ITEM_001", "Access item not found."));

        if (item.AccessRequest.UserId != userId)
            return Result.Failure(Error.Validation("ITEM_002", "You do not own this item."));

        var allowedStatuses = new[] { RequestStatus.HodRejected, RequestStatus.ItRejected };
        if (!allowedStatuses.Contains(item.Status))
            return Result.Failure(Error.Validation("ITEM_003",
                "Only rejected items can be resubmitted."));

        // Reset item back to PendingWithHod
        item.Status           = RequestStatus.PendingWithHod;
        item.Reason           = reason;
        item.RejectionReason  = null;
        item.HodApproverId    = null;
        item.ItApproverId     = null;
        item.ModifiedOn       = DateTime.UtcNow;
        item.ModifiedBy       = userId;

        db.AccessReqAudits.Add(BuildAudit(item.AccessReqId, item.AccessItemId,
            "Resubmitted", $"Item {item.TicketNumber} resubmitted by user.", userId));

        await db.SaveChangesAsync();

        await NotifyHodsForItemAsync(item, "Item Resubmitted",
            $"Ticket {item.TicketNumber} has been resubmitted and awaits your review.", userId);

        return Result.Success();
    }

    // ─── Renew Item ──────────────────────────────────────────────────────────────

    public async Task<Result> RenewItemAsync(int accessItemId, string reason, int userId)
    {
        var item = await db.AccessItems
            .Include(i => i.AccessRequest)
            .FirstOrDefaultAsync(i => i.AccessItemId == accessItemId);

        if (item is null)
            return Result.Failure(Error.NotFound("ITEM_001", "Access item not found."));

        if (item.AccessRequest.UserId != userId)
            return Result.Failure(Error.Validation("ITEM_002", "You do not own this item."));

        var renewableStatuses = new[]
            { RequestStatus.ItApproved, RequestStatus.Expired };

        if (!renewableStatuses.Contains(item.Status))
            return Result.Failure(Error.Validation("ITEM_004",
                "Only approved or expired items can be renewed."));

        // Reset for re-approval cycle
        item.Status          = RequestStatus.PendingWithHod;
        item.Reason          = reason;
        item.RejectionReason = null;
        item.ApprovedAtUtc   = null;
        item.ExpiresAtUtc    = null;
        item.HodApproverId   = null;
        item.ItApproverId    = null;
        item.ModifiedOn      = DateTime.UtcNow;
        item.ModifiedBy      = userId;

        db.AccessReqAudits.Add(BuildAudit(item.AccessReqId, item.AccessItemId,
            "RenewalRequested", $"User requested renewal of ticket {item.TicketNumber}.", userId));

        await db.SaveChangesAsync();

        await NotifyHodsForItemAsync(item, "Renewal Request",
            $"Ticket {item.TicketNumber} renewal has been submitted.", userId);

        return Result.Success();
    }

    // ─── Private Helpers ─────────────────────────────────────────────────────────

    private async Task<List<AccessItemEntity>> CreateItemsAsync(
        IEnumerable<AccessItemRequestDto> itemDtos,
        int requestId,
        int createdBy,
        int? hodApproverId = null,
        RequestStatus initialStatus = RequestStatus.PendingWithHod)
    {
        var items = new List<AccessItemEntity>();

        foreach (var dto in itemDtos)
        {
            var item = new AccessItemEntity
            {
                AccessReqId        = requestId,
                TicketNumber       = TicketNumberGenerator.Generate(),
                Status             = initialStatus,
                FolderPath         = dto.FolderPath,
                AccessType         = dto.AccessType,
                ConfirmAccessType  = dto.AccessType,
                Reason             = dto.Reason,
                HodApproverId      = hodApproverId,
                IsActive           = true,
                CreatedOn          = DateTime.UtcNow,
                CreatedBy          = createdBy
            };

            db.AccessItems.Add(item);
            items.Add(item);
        }

        await db.SaveChangesAsync();
        return items;
    }

    private async Task SendSubmissionNotificationsAsync(
        AccessRequestEntity request,
        List<AccessItemEntity> items,
        CmplUser user)
    {
        // 1. Notify the user: confirm receipt with ticket numbers
        var ticketList = string.Join(", ", items.Select(i => i.TicketNumber));
        await notificationService.NotifyUserAsync(
            userId: user.Id,
            role: "User",
            title: "Access Request Submitted",
            message: $"Your request has been submitted. Tickets: {ticketList}",
            type: "RequestSubmitted",
            requestId: request.AccessReqId);

        // 2. Resolve HODs for each item and notify them
        foreach (var item in items)
        {
            await NotifyHodsForItemAsync(item,
                "New Access Request Awaiting Approval",
                $"Ticket {item.TicketNumber} from {user.Name} is pending your review.",
                user.Id);
        }

        // 3. Notify all IT Operators about new request
        await notificationService.NotifyRoleGroupAsync(
            role: "It",
            title: "New Access Request",
            message: $"{items.Count} new item(s) submitted by {user.Name} await HOD approval.",
            type: "NewRequest",
            requestId: request.AccessReqId);
    }

    /// <summary>
    /// Resolves the folder's HOD and the user's department HOD.
    /// If they differ, notifies both; otherwise notifies just one.
    /// </summary>
    private async Task NotifyHodsForItemAsync(
        AccessItemEntity item, string title, string message, int actorUserId)
    {
        var folderMapping = await db.FolderMappings
            .FirstOrDefaultAsync(f => f.FolderName == item.FolderPath);

        // Collect unique HOD userIds to notify
        var hodUserIds = new HashSet<int>();

        // Folder's primary HOD
        if (folderMapping?.PrimaryHodId is not null
            && int.TryParse(folderMapping.PrimaryHodId, out var foldPrimaryHodId))
            hodUserIds.Add(foldPrimaryHodId);

        // Folder's secondary HOD (if exists)
        if (folderMapping?.SecondaryHodId is not null
            && int.TryParse(folderMapping.SecondaryHodId, out var foldSecondHodId))
            hodUserIds.Add(foldSecondHodId);

        // User's department HOD
        var user = await cmplDb.CmplUsers.FirstOrDefaultAsync(u => u.Id == actorUserId);
        if (user?.DepartmentId is not null)
        {
            var dept = await db.Departments.FirstOrDefaultAsync(d => d.Id == user.DepartmentId);
            if (dept?.HodId is not null && int.TryParse(dept.HodId, out var deptHodId))
                hodUserIds.Add(deptHodId);
        }

        // If folder HOD ≠ user dept HOD, both already added above
        // Notify all resolved HODs
        foreach (var hodId in hodUserIds)
        {
            await notificationService.NotifyUserAsync(
                userId: hodId,
                role: "Hod",
                title: title,
                message: message,
                type: "HodAction",
                requestId: item.AccessReqId,
                itemId: item.AccessItemId,
                ticketNumber: item.TicketNumber);
        }
    }

    private static AccessReqAuditEntity BuildAudit(int requestId, int? itemId,
        string eventType, string message, int actorUserId) => new()
    {
        AccessReqId   = requestId,
        AccessItemId  = itemId,
        EventType     = eventType,
        Message       = message,
        ActorUserId   = actorUserId,
        RecipientUserId = actorUserId,
        RecipientName = string.Empty,
        RecipientRole = string.Empty,
        IsActive      = true,
        CreatedOn     = DateTime.UtcNow,
        CreatedBy     = actorUserId
    };

    private static AccessRequestDetailDto MapToDetailDto(AccessRequestEntity r) => new(
        r.AccessReqId,
        r.UserId,
        r.CurrentStatus,
        r.ItsrNo,
        r.CreatedOn,
        r.AccessItems.Select(i => new AccessItemDto(
            i.AccessItemId,
            i.TicketNumber,
            i.FolderPath,
            i.AccessType,
            i.ConfirmAccessType,
            i.Status,
            i.Reason,
            i.RejectionReason,
            i.ApprovedAtUtc,
            i.ExpiresAtUtc
        )).ToList()
    );

    private static AccessRequestSummaryDto MapToSummaryDto(AccessRequestEntity r) => new(
        r.AccessReqId,
        r.CurrentStatus,
        r.ItsrNo,
        r.CreatedOn,
        r.AccessItems.Count,
        r.AccessItems.Count(i => i.Status == RequestStatus.ItApproved),
        r.AccessItems.Count(i => i.Status is RequestStatus.HodRejected or RequestStatus.ItRejected)
    );
}
```

---

## 10. HOD Cart Service

### `Application/Services/IHodCartService.cs`

```csharp
using Web.Domain.Common;
using Web.Domain.Dto;

namespace Web.Application.Services;

public interface IHodCartService
{
    /// <summary>
    /// Returns items pending HOD approval.
    /// HOD sees items from:
    ///   (a) users whose dept.hod_id == this HOD's userId
    ///   (b) folder mappings where primary_hod_id or secondary_hod_id == this HOD's userId
    /// </summary>
    Task<PagedResult<HodCartItemDto>> GetCartAsync(int hodUserId, int page, int pageSize);

    /// <summary>Approve a single access item — moves to PendingWithIt.</summary>
    Task<Result> ApproveItemAsync(int accessItemId, string comments, int hodUserId);

    /// <summary>Reject a single access item — moves back to user (HodRejected).</summary>
    Task<Result> RejectItemAsync(int accessItemId, string rejectionReason, int hodUserId);

    /// <summary>Bulk approve all items in a request visible to this HOD.</summary>
    Task<Result> ApproveAllInRequestAsync(int accessRequestId, string comments, int hodUserId);
}
```

### `Application/Services/HodCartService.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using Web.Domain.Common;
using Web.Domain.Dto;
using Web.Domain.Entities;
using Web.Domain.Enums;
using Web.Infrastructure.Data;

namespace Web.Application.Services;

public sealed class HodCartService(
    AppDbContext db,
    CmplDbContext cmplDb,
    INotificationService notificationService) : IHodCartService
{
    public async Task<PagedResult<HodCartItemDto>> GetCartAsync(
        int hodUserId, int page, int pageSize)
    {
        var hodIdStr = hodUserId.ToString();

        // Items from users in HOD's department
        var deptIds = await db.Departments
            .Where(d => d.HodId == hodIdStr && d.IsActive)
            .Select(d => d.Id)
            .ToListAsync();

        var deptUserIds = await cmplDb.CmplUsers
            .Where(u => u.DepartmentId.HasValue && deptIds.Contains(u.DepartmentId!.Value))
            .Select(u => u.Id)
            .ToListAsync();

        // Folder paths owned by this HOD
        var hodOwnedFolderPaths = await db.FolderMappings
            .Where(f => f.PrimaryHodId == hodIdStr || f.SecondaryHodId == hodIdStr)
            .Select(f => f.FolderName)
            .ToListAsync();

        // Combine: items pending HOD approval for dept-users OR HOD-owned folders
        var query = db.AccessItems
            .Include(i => i.AccessRequest)
            .Where(i => i.Status == RequestStatus.PendingWithHod
                && (deptUserIds.Contains(i.AccessRequest.UserId)
                    || hodOwnedFolderPaths.Contains(i.FolderPath)))
            .OrderBy(i => i.CreatedOn);

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(i => new HodCartItemDto(
                i.AccessItemId,
                i.AccessReqId,
                i.TicketNumber,
                i.FolderPath,
                i.AccessType,
                i.Reason,
                i.AccessRequest.UserId,
                i.CreatedOn
            ))
            .ToListAsync();

        return new PagedResult<HodCartItemDto>(items, total, page, pageSize);
    }

    public async Task<Result> ApproveItemAsync(int accessItemId, string comments, int hodUserId)
    {
        var item = await GetOwnedItemAsync(accessItemId, hodUserId, RequestStatus.PendingWithHod);
        if (item is null)
            return Result.Failure(Error.NotFound("ITEM_005",
                "Item not found or not in your cart."));

        item.Status        = RequestStatus.PendingWithIt;
        item.HodApproverId = hodUserId;
        item.ModifiedOn    = DateTime.UtcNow;
        item.ModifiedBy    = hodUserId;

        db.AccessApprovals.Add(new AccessApprovalEntity
        {
            AccessReqId     = item.AccessReqId,
            AccessItemId    = item.AccessItemId,
            ApproverId      = hodUserId,
            ApprovalStatus  = RequestStatus.HodApproved,
            ApprovalLevel   = "HOD",
            Comments        = comments,
            IsActive        = true,
            CreatedOn       = DateTime.UtcNow,
            CreatedBy       = hodUserId
        });

        db.AccessReqAudits.Add(new AccessReqAuditEntity
        {
            AccessReqId     = item.AccessReqId,
            AccessItemId    = item.AccessItemId,
            EventType       = "HodApproved",
            Message         = $"HOD approved ticket {item.TicketNumber}. Forwarded to IT.",
            ActorUserId     = hodUserId,
            RecipientUserId = item.AccessRequest.UserId,
            RecipientName   = string.Empty,
            RecipientRole   = "It",
            IsActive        = true,
            CreatedOn       = DateTime.UtcNow,
            CreatedBy       = hodUserId
        });

        await db.SaveChangesAsync();

        // Notify IT
        await notificationService.NotifyRoleGroupAsync(
            role: "It",
            title: "HOD Approved — Action Required",
            message: $"Ticket {item.TicketNumber} has been approved by HOD and is pending IT review.",
            type: "HodApproved",
            requestId: item.AccessReqId,
            itemId: item.AccessItemId,
            ticketNumber: item.TicketNumber);

        return Result.Success();
    }

    public async Task<Result> RejectItemAsync(int accessItemId, string rejectionReason, int hodUserId)
    {
        var item = await GetOwnedItemAsync(accessItemId, hodUserId, RequestStatus.PendingWithHod);
        if (item is null)
            return Result.Failure(Error.NotFound("ITEM_005",
                "Item not found or not in your cart."));

        item.Status          = RequestStatus.HodRejected;
        item.RejectionReason = rejectionReason;
        item.HodApproverId   = hodUserId;
        item.ModifiedOn      = DateTime.UtcNow;
        item.ModifiedBy      = hodUserId;

        db.AccessApprovals.Add(new AccessApprovalEntity
        {
            AccessReqId    = item.AccessReqId,
            AccessItemId   = item.AccessItemId,
            ApproverId     = hodUserId,
            ApprovalStatus = RequestStatus.HodRejected,
            ApprovalLevel  = "HOD",
            Comments       = rejectionReason,
            IsActive       = true,
            CreatedOn      = DateTime.UtcNow,
            CreatedBy      = hodUserId
        });

        db.AccessReqAudits.Add(new AccessReqAuditEntity
        {
            AccessReqId     = item.AccessReqId,
            AccessItemId    = item.AccessItemId,
            EventType       = "HodRejected",
            Message         = $"HOD rejected ticket {item.TicketNumber}: {rejectionReason}",
            ActorUserId     = hodUserId,
            RecipientUserId = item.AccessRequest.UserId,
            RecipientName   = string.Empty,
            RecipientRole   = "User",
            IsActive        = true,
            CreatedOn       = DateTime.UtcNow,
            CreatedBy       = hodUserId
        });

        await db.SaveChangesAsync();

        // Notify the user
        await notificationService.NotifyUserAsync(
            userId: item.AccessRequest.UserId,
            role: "User",
            title: "Item Rejected by HOD",
            message: $"Ticket {item.TicketNumber} was rejected. Reason: {rejectionReason}. You may resubmit.",
            type: "HodRejected",
            requestId: item.AccessReqId,
            itemId: item.AccessItemId,
            ticketNumber: item.TicketNumber);

        return Result.Success();
    }

    public async Task<Result> ApproveAllInRequestAsync(
        int accessRequestId, string comments, int hodUserId)
    {
        var hodIdStr = hodUserId.ToString();

        var deptIds = await db.Departments
            .Where(d => d.HodId == hodIdStr && d.IsActive)
            .Select(d => d.Id)
            .ToListAsync();

        var deptUserIds = await cmplDb.CmplUsers
            .Where(u => u.DepartmentId.HasValue && deptIds.Contains(u.DepartmentId!.Value))
            .Select(u => u.Id)
            .ToListAsync();

        var hodOwnedPaths = await db.FolderMappings
            .Where(f => f.PrimaryHodId == hodIdStr || f.SecondaryHodId == hodIdStr)
            .Select(f => f.FolderName)
            .ToListAsync();

        var items = await db.AccessItems
            .Include(i => i.AccessRequest)
            .Where(i => i.AccessReqId == accessRequestId
                && i.Status == RequestStatus.PendingWithHod
                && (deptUserIds.Contains(i.AccessRequest.UserId)
                    || hodOwnedPaths.Contains(i.FolderPath)))
            .ToListAsync();

        if (items.Count == 0)
            return Result.Failure(Error.NotFound("ITEM_006",
                "No pending items found in this request for your cart."));

        foreach (var item in items)
        {
            item.Status        = RequestStatus.PendingWithIt;
            item.HodApproverId = hodUserId;
            item.ModifiedOn    = DateTime.UtcNow;
            item.ModifiedBy    = hodUserId;

            db.AccessApprovals.Add(new AccessApprovalEntity
            {
                AccessReqId    = item.AccessReqId,
                AccessItemId   = item.AccessItemId,
                ApproverId     = hodUserId,
                ApprovalStatus = RequestStatus.HodApproved,
                ApprovalLevel  = "HOD",
                Comments       = comments,
                IsActive       = true,
                CreatedOn      = DateTime.UtcNow,
                CreatedBy      = hodUserId
            });
        }

        await db.SaveChangesAsync();

        await notificationService.NotifyRoleGroupAsync(
            role: "It",
            title: "Bulk HOD Approval",
            message: $"{items.Count} items in Request #{accessRequestId} approved by HOD.",
            type: "BulkHodApproved",
            requestId: accessRequestId);

        return Result.Success();
    }

    // ─── Private ─────────────────────────────────────────────────────────────────

    private async Task<AccessItemEntity?> GetOwnedItemAsync(
        int accessItemId, int hodUserId, RequestStatus requiredStatus)
    {
        var hodIdStr = hodUserId.ToString();

        var deptIds = await db.Departments
            .Where(d => d.HodId == hodIdStr && d.IsActive)
            .Select(d => d.Id)
            .ToListAsync();

        var deptUserIds = await cmplDb.CmplUsers
            .Where(u => u.DepartmentId.HasValue && deptIds.Contains(u.DepartmentId!.Value))
            .Select(u => u.Id)
            .ToListAsync();

        var hodPaths = await db.FolderMappings
            .Where(f => f.PrimaryHodId == hodIdStr || f.SecondaryHodId == hodIdStr)
            .Select(f => f.FolderName)
            .ToListAsync();

        return await db.AccessItems
            .Include(i => i.AccessRequest)
            .FirstOrDefaultAsync(i =>
                i.AccessItemId == accessItemId
                && i.Status == requiredStatus
                && (deptUserIds.Contains(i.AccessRequest.UserId)
                    || hodPaths.Contains(i.FolderPath)));
    }
}
```

---

## 11. Operator Cart Service

### `Application/Services/IOperatorCartService.cs`

```csharp
using Web.Domain.Common;
using Web.Domain.Dto;

namespace Web.Application.Services;

public interface IOperatorCartService
{
    /// <summary>Returns all items pending IT/Operator approval.</summary>
    Task<PagedResult<OperatorCartItemDto>> GetCartAsync(int page, int pageSize);

    /// <summary>Grant access — marks item ItApproved, sets expiry +90 days.</summary>
    Task<Result> ApproveItemAsync(int accessItemId, string comments, int operatorUserId);

    /// <summary>Reject item — moves back to user (ItRejected).</summary>
    Task<Result> RejectItemAsync(int accessItemId, string rejectionReason, int operatorUserId);

    /// <summary>Revoke a previously approved item.</summary>
    Task<Result> RevokeItemAsync(int accessItemId, string reason, int operatorUserId);

    /// <summary>Override the confirmed access type before approving.</summary>
    Task<Result> OverrideAccessTypeAsync(int accessItemId, AccessTypes accessType, int operatorUserId);
}
```

### `Application/Services/OperatorCartService.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using Web.Domain.Common;
using Web.Domain.Dto;
using Web.Domain.Entities;
using Web.Domain.Enums;
using Web.Infrastructure.Data;

namespace Web.Application.Services;

public sealed class OperatorCartService(
    AppDbContext db,
    INotificationService notificationService) : IOperatorCartService
{
    public async Task<PagedResult<OperatorCartItemDto>> GetCartAsync(int page, int pageSize)
    {
        var query = db.AccessItems
            .Include(i => i.AccessRequest)
            .Where(i => i.Status == RequestStatus.PendingWithIt)
            .OrderBy(i => i.CreatedOn);

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(i => new OperatorCartItemDto(
                i.AccessItemId,
                i.AccessReqId,
                i.TicketNumber,
                i.FolderPath,
                i.AccessType,
                i.ConfirmAccessType,
                i.Reason,
                i.HodApproverId,
                i.AccessRequest.UserId,
                i.CreatedOn
            ))
            .ToListAsync();

        return new PagedResult<OperatorCartItemDto>(items, total, page, pageSize);
    }

    public async Task<Result> ApproveItemAsync(int accessItemId, string comments, int operatorUserId)
    {
        var item = await GetPendingItemAsync(accessItemId, RequestStatus.PendingWithIt);
        if (item is null)
            return Result.Failure(Error.NotFound("ITEM_007", "Item not in operator cart."));

        var now = DateTime.UtcNow;

        item.Status        = RequestStatus.ItApproved;
        item.ItApproverId  = operatorUserId;
        item.ApprovedAtUtc = now;
        item.ExpiresAtUtc  = now.AddDays(90);
        item.ModifiedOn    = now;
        item.ModifiedBy    = operatorUserId;

        db.AccessApprovals.Add(new AccessApprovalEntity
        {
            AccessReqId    = item.AccessReqId,
            AccessItemId   = item.AccessItemId,
            ApproverId     = operatorUserId,
            ApprovalStatus = RequestStatus.ItApproved,
            ApprovalLevel  = "IT",
            Comments       = comments,
            IsActive       = true,
            CreatedOn      = now,
            CreatedBy      = operatorUserId
        });

        db.AccessReqAudits.Add(new AccessReqAuditEntity
        {
            AccessReqId     = item.AccessReqId,
            AccessItemId    = item.AccessItemId,
            EventType       = "ItApproved",
            Message         = $"IT approved ticket {item.TicketNumber}. Access granted until {item.ExpiresAtUtc:yyyy-MM-dd}.",
            ActorUserId     = operatorUserId,
            RecipientUserId = item.AccessRequest.UserId,
            RecipientName   = string.Empty,
            RecipientRole   = "User",
            IsActive        = true,
            CreatedOn       = now,
            CreatedBy       = operatorUserId
        });

        await db.SaveChangesAsync();

        await notificationService.NotifyUserAsync(
            userId: item.AccessRequest.UserId,
            role: "User",
            title: "Access Granted",
            message: $"Ticket {item.TicketNumber} — access to '{item.FolderPath}' granted. " +
                     $"Valid until {item.ExpiresAtUtc:yyyy-MM-dd}.",
            type: "ItApproved",
            requestId: item.AccessReqId,
            itemId: item.AccessItemId,
            ticketNumber: item.TicketNumber);

        return Result.Success();
    }

    public async Task<Result> RejectItemAsync(int accessItemId, string rejectionReason, int operatorUserId)
    {
        var item = await GetPendingItemAsync(accessItemId, RequestStatus.PendingWithIt);
        if (item is null)
            return Result.Failure(Error.NotFound("ITEM_007", "Item not in operator cart."));

        item.Status          = RequestStatus.ItRejected;
        item.RejectionReason = rejectionReason;
        item.ItApproverId    = operatorUserId;
        item.ModifiedOn      = DateTime.UtcNow;
        item.ModifiedBy      = operatorUserId;

        db.AccessApprovals.Add(new AccessApprovalEntity
        {
            AccessReqId    = item.AccessReqId,
            AccessItemId   = item.AccessItemId,
            ApproverId     = operatorUserId,
            ApprovalStatus = RequestStatus.ItRejected,
            ApprovalLevel  = "IT",
            Comments       = rejectionReason,
            IsActive       = true,
            CreatedOn      = DateTime.UtcNow,
            CreatedBy      = operatorUserId
        });

        db.AccessReqAudits.Add(new AccessReqAuditEntity
        {
            AccessReqId     = item.AccessReqId,
            AccessItemId    = item.AccessItemId,
            EventType       = "ItRejected",
            Message         = $"IT rejected ticket {item.TicketNumber}: {rejectionReason}",
            ActorUserId     = operatorUserId,
            RecipientUserId = item.AccessRequest.UserId,
            RecipientName   = string.Empty,
            RecipientRole   = "User",
            IsActive        = true,
            CreatedOn       = DateTime.UtcNow,
            CreatedBy       = operatorUserId
        });

        await db.SaveChangesAsync();

        await notificationService.NotifyUserAsync(
            userId: item.AccessRequest.UserId,
            role: "User",
            title: "Access Request Rejected by IT",
            message: $"Ticket {item.TicketNumber} rejected by IT. Reason: {rejectionReason}. You may resubmit.",
            type: "ItRejected",
            requestId: item.AccessReqId,
            itemId: item.AccessItemId,
            ticketNumber: item.TicketNumber);

        return Result.Success();
    }

    public async Task<Result> RevokeItemAsync(int accessItemId, string reason, int operatorUserId)
    {
        var item = await db.AccessItems
            .Include(i => i.AccessRequest)
            .FirstOrDefaultAsync(i => i.AccessItemId == accessItemId
                                   && i.Status == RequestStatus.ItApproved);

        if (item is null)
            return Result.Failure(Error.NotFound("ITEM_008",
                "Approved item not found for revocation."));

        item.Status     = RequestStatus.Revoked;
        item.ModifiedOn = DateTime.UtcNow;
        item.ModifiedBy = operatorUserId;

        db.AccessReqAudits.Add(new AccessReqAuditEntity
        {
            AccessReqId     = item.AccessReqId,
            AccessItemId    = item.AccessItemId,
            EventType       = "Revoked",
            Message         = $"IT revoked ticket {item.TicketNumber}: {reason}",
            ActorUserId     = operatorUserId,
            RecipientUserId = item.AccessRequest.UserId,
            RecipientName   = string.Empty,
            RecipientRole   = "User",
            IsActive        = true,
            CreatedOn       = DateTime.UtcNow,
            CreatedBy       = operatorUserId
        });

        await db.SaveChangesAsync();

        await notificationService.NotifyUserAsync(
            userId: item.AccessRequest.UserId,
            role: "User",
            title: "Access Revoked",
            message: $"Ticket {item.TicketNumber} — your access to '{item.FolderPath}' has been revoked.",
            type: "Revoked",
            requestId: item.AccessReqId,
            itemId: item.AccessItemId,
            ticketNumber: item.TicketNumber);

        return Result.Success();
    }

    public async Task<Result> OverrideAccessTypeAsync(
        int accessItemId, AccessTypes accessType, int operatorUserId)
    {
        var item = await GetPendingItemAsync(accessItemId, RequestStatus.PendingWithIt);
        if (item is null)
            return Result.Failure(Error.NotFound("ITEM_007", "Item not in operator cart."));

        item.ConfirmAccessType = accessType;
        item.ModifiedOn        = DateTime.UtcNow;
        item.ModifiedBy        = operatorUserId;

        await db.SaveChangesAsync();
        return Result.Success();
    }

    // ─── Private ─────────────────────────────────────────────────────────────────

    private async Task<AccessItemEntity?> GetPendingItemAsync(
        int accessItemId, RequestStatus requiredStatus)
        => await db.AccessItems
            .Include(i => i.AccessRequest)
            .FirstOrDefaultAsync(i => i.AccessItemId == accessItemId
                                   && i.Status == requiredStatus);
}
```

---

## 12. Dashboard Service

### `Application/Services/IDashboardService.cs`

```csharp
using Web.Domain.Dto;

namespace Web.Application.Services;

public interface IDashboardService
{
    Task<DashboardDto> GetDashboardAsync(int callerUserId, string role);
}
```

### `Application/Services/DashboardService.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using Web.Domain.Dto;
using Web.Domain.Enums;
using Web.Infrastructure.Data;

namespace Web.Application.Services;

public sealed class DashboardService(AppDbContext db, CmplDbContext cmplDb) : IDashboardService
{
    public async Task<DashboardDto> GetDashboardAsync(int callerUserId, string role)
    {
        // Global stats (visible to HOD and IT)
        var allItems = await db.AccessItems.ToListAsync();

        var totalRequests        = await db.AccessRequests.CountAsync();
        var pendingWithHod       = allItems.Count(i => i.Status == RequestStatus.PendingWithHod);
        var pendingWithIt        = allItems.Count(i => i.Status == RequestStatus.PendingWithIt);
        var approvedActive       = allItems.Count(i => i.Status == RequestStatus.ItApproved);
        var hodRejected          = allItems.Count(i => i.Status == RequestStatus.HodRejected);
        var itRejected           = allItems.Count(i => i.Status == RequestStatus.ItRejected);
        var revoked              = allItems.Count(i => i.Status == RequestStatus.Revoked);
        var expired              = allItems.Count(i => i.Status == RequestStatus.Expired
                                                    || (i.ExpiresAtUtc.HasValue
                                                        && i.ExpiresAtUtc < DateTime.UtcNow
                                                        && i.Status == RequestStatus.ItApproved));

        // Per-user stats
        var userItemIds = await db.AccessRequests
            .Where(r => r.UserId == callerUserId)
            .Select(r => r.AccessReqId)
            .ToListAsync();

        var myItems = allItems.Where(i => userItemIds.Contains(i.AccessReqId)).ToList();

        // Recent requests (last 10)
        var recentRequests = await db.AccessRequests
            .Include(r => r.AccessItems)
            .OrderByDescending(r => r.CreatedOn)
            .Take(10)
            .Select(r => new RecentRequestDto(
                r.AccessReqId,
                r.UserId,
                r.CurrentStatus.ToString(),
                r.CreatedOn,
                r.AccessItems.Count
            ))
            .ToListAsync();

        // Expiring soon (within 14 days)
        var expiringSoon = allItems
            .Where(i => i.Status == RequestStatus.ItApproved
                && i.ExpiresAtUtc.HasValue
                && i.ExpiresAtUtc.Value <= DateTime.UtcNow.AddDays(14)
                && i.ExpiresAtUtc.Value > DateTime.UtcNow)
            .Count();

        return new DashboardDto(
            TotalRequests:    totalRequests,
            PendingWithHod:   pendingWithHod,
            PendingWithIt:    pendingWithIt,
            ApprovedActive:   approvedActive,
            HodRejected:      hodRejected,
            ItRejected:       itRejected,
            Revoked:          revoked,
            Expired:          expired,
            ExpiringSoon:     expiringSoon,
            MyPendingItems:   myItems.Count(i => i.Status is RequestStatus.PendingWithHod or RequestStatus.PendingWithIt),
            MyApprovedItems:  myItems.Count(i => i.Status == RequestStatus.ItApproved),
            MyRejectedItems:  myItems.Count(i => i.Status is RequestStatus.HodRejected or RequestStatus.ItRejected),
            RecentRequests:   recentRequests
        );
    }
}
```

---

## 13. Controllers

### `API/Controllers/AccessRequestController.cs`

```csharp
using Microsoft.AspNetCore.Mvc;
using Web.Application.Services;
using Web.Domain.Dto;

namespace Web.API.Controllers;

[ApiController]
[Route("api/access-requests")]
public sealed class AccessRequestController(IAccessRequestService service) : ControllerBase
{
    // POST api/access-requests
    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] SubmitAccessRequestDto dto)
    {
        var userId = GetCallerUserId(); // extract from JWT/header
        var result = await service.SubmitRequestAsync(dto, userId);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetDetail), new { id = result.Value }, result.Value)
            : HandleFailure(result);
    }

    // POST api/access-requests/hod
    [HttpPost("hod")]
    public async Task<IActionResult> SubmitAsHod([FromBody] SubmitAccessRequestDto dto)
    {
        var hodUserId = GetCallerUserId();
        var result = await service.SubmitHodRequestAsync(dto, hodUserId);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetDetail), new { id = result.Value }, result.Value)
            : HandleFailure(result);
    }

    // GET api/access-requests/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetDetail(int id)
    {
        var result = await service.GetRequestDetailAsync(id, GetCallerUserId());
        return result.IsSuccess ? Ok(result.Value) : HandleFailure(result);
    }

    // GET api/access-requests/my?page=1&pageSize=20
    [HttpGet("my")]
    public async Task<IActionResult> GetMyRequests(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await service.GetMyRequestsAsync(GetCallerUserId(), page, pageSize);
        return Ok(result);
    }

    // POST api/access-requests/items/{itemId}/resubmit
    [HttpPost("items/{itemId:int}/resubmit")]
    public async Task<IActionResult> ResubmitItem(int itemId, [FromBody] ItemActionDto dto)
    {
        var result = await service.ResubmitItemAsync(itemId, dto.Reason, GetCallerUserId());
        return result.IsSuccess ? Ok() : HandleFailure(result);
    }

    // POST api/access-requests/items/{itemId}/renew
    [HttpPost("items/{itemId:int}/renew")]
    public async Task<IActionResult> RenewItem(int itemId, [FromBody] ItemActionDto dto)
    {
        var result = await service.RenewItemAsync(itemId, dto.Reason, GetCallerUserId());
        return result.IsSuccess ? Ok() : HandleFailure(result);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────
    private int GetCallerUserId()
        => int.Parse(User.FindFirst("sub")?.Value
            ?? HttpContext.Request.Headers["X-User-Id"].ToString());

    private IActionResult HandleFailure(Result result) =>
        result.Error!.Type switch
        {
            ErrorType.NotFound   => NotFound(result.Error),
            ErrorType.Validation => BadRequest(result.Error),
            ErrorType.Conflict   => Conflict(result.Error),
            _                    => StatusCode(500, result.Error)
        };
}
```

### `API/Controllers/HodCartController.cs`

```csharp
using Microsoft.AspNetCore.Mvc;
using Web.Application.Services;
using Web.Domain.Dto;

namespace Web.API.Controllers;

[ApiController]
[Route("api/hod-cart")]
public sealed class HodCartController(IHodCartService service) : ControllerBase
{
    // GET api/hod-cart?page=1&pageSize=20
    [HttpGet]
    public async Task<IActionResult> GetCart(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await service.GetCartAsync(GetCallerUserId(), page, pageSize);
        return Ok(result);
    }

    // POST api/hod-cart/items/{itemId}/approve
    [HttpPost("items/{itemId:int}/approve")]
    public async Task<IActionResult> Approve(int itemId, [FromBody] ItemActionDto dto)
    {
        var result = await service.ApproveItemAsync(itemId, dto.Comments ?? "", GetCallerUserId());
        return result.IsSuccess ? Ok() : HandleFailure(result);
    }

    // POST api/hod-cart/items/{itemId}/reject
    [HttpPost("items/{itemId:int}/reject")]
    public async Task<IActionResult> Reject(int itemId, [FromBody] ItemActionDto dto)
    {
        var result = await service.RejectItemAsync(itemId, dto.Reason, GetCallerUserId());
        return result.IsSuccess ? Ok() : HandleFailure(result);
    }

    // POST api/hod-cart/requests/{requestId}/approve-all
    [HttpPost("requests/{requestId:int}/approve-all")]
    public async Task<IActionResult> ApproveAll(int requestId, [FromBody] ItemActionDto dto)
    {
        var result = await service.ApproveAllInRequestAsync(
            requestId, dto.Comments ?? "", GetCallerUserId());
        return result.IsSuccess ? Ok() : HandleFailure(result);
    }

    private int GetCallerUserId()
        => int.Parse(User.FindFirst("sub")?.Value
            ?? HttpContext.Request.Headers["X-User-Id"].ToString());

    private IActionResult HandleFailure(Result result) =>
        result.Error!.Type switch
        {
            ErrorType.NotFound   => NotFound(result.Error),
            ErrorType.Validation => BadRequest(result.Error),
            _                    => StatusCode(500, result.Error)
        };
}
```

### `API/Controllers/OperatorCartController.cs`

```csharp
using Microsoft.AspNetCore.Mvc;
using Web.Application.Services;
using Web.Domain.Dto;
using Web.Domain.Enums;

namespace Web.API.Controllers;

[ApiController]
[Route("api/operator-cart")]
public sealed class OperatorCartController(IOperatorCartService service) : ControllerBase
{
    // GET api/operator-cart?page=1&pageSize=20
    [HttpGet]
    public async Task<IActionResult> GetCart(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        => Ok(await service.GetCartAsync(page, pageSize));

    // POST api/operator-cart/items/{itemId}/approve
    [HttpPost("items/{itemId:int}/approve")]
    public async Task<IActionResult> Approve(int itemId, [FromBody] ItemActionDto dto)
    {
        var result = await service.ApproveItemAsync(itemId, dto.Comments ?? "", GetCallerUserId());
        return result.IsSuccess ? Ok() : HandleFailure(result);
    }

    // POST api/operator-cart/items/{itemId}/reject
    [HttpPost("items/{itemId:int}/reject")]
    public async Task<IActionResult> Reject(int itemId, [FromBody] ItemActionDto dto)
    {
        var result = await service.RejectItemAsync(itemId, dto.Reason, GetCallerUserId());
        return result.IsSuccess ? Ok() : HandleFailure(result);
    }

    // POST api/operator-cart/items/{itemId}/revoke
    [HttpPost("items/{itemId:int}/revoke")]
    public async Task<IActionResult> Revoke(int itemId, [FromBody] ItemActionDto dto)
    {
        var result = await service.RevokeItemAsync(itemId, dto.Reason, GetCallerUserId());
        return result.IsSuccess ? Ok() : HandleFailure(result);
    }

    // PATCH api/operator-cart/items/{itemId}/access-type
    [HttpPatch("items/{itemId:int}/access-type")]
    public async Task<IActionResult> OverrideAccessType(
        int itemId, [FromBody] OverrideAccessTypeDto dto)
    {
        var result = await service.OverrideAccessTypeAsync(itemId, dto.AccessType, GetCallerUserId());
        return result.IsSuccess ? Ok() : HandleFailure(result);
    }

    private int GetCallerUserId()
        => int.Parse(User.FindFirst("sub")?.Value
            ?? HttpContext.Request.Headers["X-User-Id"].ToString());

    private IActionResult HandleFailure(Result result) =>
        result.Error!.Type switch
        {
            ErrorType.NotFound   => NotFound(result.Error),
            ErrorType.Validation => BadRequest(result.Error),
            _                    => StatusCode(500, result.Error)
        };
}
```

### `API/Controllers/DashboardController.cs`

```csharp
using Microsoft.AspNetCore.Mvc;
using Web.Application.Services;

namespace Web.API.Controllers;

[ApiController]
[Route("api/dashboard")]
public sealed class DashboardController(IDashboardService service) : ControllerBase
{
    // GET api/dashboard
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var userId = int.Parse(User.FindFirst("sub")?.Value
            ?? HttpContext.Request.Headers["X-User-Id"].ToString());
        var role   = User.FindFirst("role")?.Value
            ?? HttpContext.Request.Headers["X-User-Role"].ToString();

        var result = await service.GetDashboardAsync(userId, role);
        return Ok(result);
    }
}
```

### `API/Controllers/NotificationController.cs`

```csharp
using Microsoft.AspNetCore.Mvc;
using Web.Application.Services;

namespace Web.API.Controllers;

[ApiController]
[Route("api/notifications")]
public sealed class NotificationController(INotificationService service) : ControllerBase
{
    // GET api/notifications?unreadOnly=false
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool unreadOnly = false)
    {
        var userId = GetCallerUserId();
        var notifications = await service.GetUserNotificationsAsync(userId, unreadOnly);
        return Ok(notifications);
    }

    // GET api/notifications/unread-count
    [HttpGet("unread-count")]
    public async Task<IActionResult> UnreadCount()
    {
        var count = await service.GetUnreadCountAsync(GetCallerUserId());
        return Ok(new { count });
    }

    // PATCH api/notifications/{id}/mark-read
    [HttpPatch("{id:int}/mark-read")]
    public async Task<IActionResult> MarkRead(int id)
    {
        var result = await service.MarkAsReadAsync(id, GetCallerUserId());
        return result.IsSuccess ? Ok() : NotFound(result.Error);
    }

    // PATCH api/notifications/mark-all-read
    [HttpPatch("mark-all-read")]
    public async Task<IActionResult> MarkAllRead()
    {
        await service.MarkAllAsReadAsync(GetCallerUserId());
        return Ok();
    }

    private int GetCallerUserId()
        => int.Parse(User.FindFirst("sub")?.Value
            ?? HttpContext.Request.Headers["X-User-Id"].ToString());
}
```

---

## 14. DTOs

### `Domain/Dto/AccessRequest/`

```csharp
// SubmitAccessRequestDto.cs
using Web.Domain.Enums;

namespace Web.Domain.Dto;

public sealed record SubmitAccessRequestDto(
    int ReqTo,
    bool IsAgreed,
    IEnumerable<AccessItemRequestDto> Items
);

public sealed record AccessItemRequestDto(
    string FolderPath,
    AccessTypes AccessType,
    string Reason
);

// AccessRequestDetailDto.cs
public sealed record AccessRequestDetailDto(
    int RequestId,
    int UserId,
    RequestStatus CurrentStatus,
    string? ItsrNo,
    DateTime CreatedOn,
    List<AccessItemDto> Items
);

public sealed record AccessItemDto(
    int ItemId,
    string TicketNumber,
    string FolderPath,
    AccessTypes AccessType,
    AccessTypes ConfirmAccessType,
    RequestStatus Status,
    string Reason,
    string? RejectionReason,
    DateTime? ApprovedAtUtc,
    DateTime? ExpiresAtUtc
);

// AccessRequestSummaryDto.cs
public sealed record AccessRequestSummaryDto(
    int RequestId,
    RequestStatus CurrentStatus,
    string? ItsrNo,
    DateTime CreatedOn,
    int TotalItems,
    int ApprovedItems,
    int RejectedItems
);

// Cart DTOs
public sealed record HodCartItemDto(
    int ItemId,
    int RequestId,
    string TicketNumber,
    string FolderPath,
    AccessTypes AccessType,
    string Reason,
    int RequesterUserId,
    DateTime SubmittedAt
);

public sealed record OperatorCartItemDto(
    int ItemId,
    int RequestId,
    string TicketNumber,
    string FolderPath,
    AccessTypes RequestedAccessType,
    AccessTypes ConfirmedAccessType,
    string Reason,
    int? HodApproverId,
    int RequesterUserId,
    DateTime SubmittedAt
);

// Action DTOs
public sealed record ItemActionDto(
    string Reason,
    string? Comments = null
);

public sealed record OverrideAccessTypeDto(AccessTypes AccessType);
```

### `Domain/Dto/Notification/NotificationDto.cs`

```csharp
namespace Web.Domain.Dto;

public sealed record NotificationDto(
    int NotificationId,
    string Title,
    string Message,
    string NotificationType,
    string? TicketNumber,
    int? AccessRequestId,
    int? AccessItemId,
    bool IsRead,
    DateTime? ReadAtUtc,
    DateTime CreatedOn
);
```

### `Domain/Dto/Dashboard/DashboardDto.cs`

```csharp
namespace Web.Domain.Dto;

public sealed record DashboardDto(
    int TotalRequests,
    int PendingWithHod,
    int PendingWithIt,
    int ApprovedActive,
    int HodRejected,
    int ItRejected,
    int Revoked,
    int Expired,
    int ExpiringSoon,
    int MyPendingItems,
    int MyApprovedItems,
    int MyRejectedItems,
    List<RecentRequestDto> RecentRequests
);

public sealed record RecentRequestDto(
    int RequestId,
    int UserId,
    string Status,
    DateTime CreatedOn,
    int ItemCount
);
```

---

## 15. Program.cs Registration

Add the following blocks to your `Program.cs`:

```csharp
// ─── SignalR ─────────────────────────────────────────────────────────────────
builder.Services.AddSignalR();

// ─── Service Registrations ───────────────────────────────────────────────────
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IAccessRequestService, AccessRequestService>();
builder.Services.AddScoped<IHodCartService, HodCartService>();
builder.Services.AddScoped<IOperatorCartService, OperatorCartService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();

// ─── CORS (if React frontend) ────────────────────────────────────────────────
builder.Services.AddCors(opts =>
    opts.AddDefaultPolicy(p => p
        .WithOrigins("http://localhost:5173")  // your React dev URL
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()));  // Required for SignalR

// ─── In app pipeline (after builder.Build()) ─────────────────────────────────
app.UseCors();

// Map the SignalR hub
app.MapHub<NotificationHub>("/hubs/notifications");
```

### Background Service: Expire Access Items

Add this hosted service to auto-mark items as Expired:

```csharp
// Infrastructure/BackgroundServices/AccessExpiryService.cs
using Microsoft.EntityFrameworkCore;
using Web.Domain.Enums;
using Web.Infrastructure.Data;

namespace Web.Infrastructure.BackgroundServices;

public sealed class AccessExpiryService(IServiceProvider serviceProvider, ILogger<AccessExpiryService> logger)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Run once per day
        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            try
            {
                using var scope = serviceProvider.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                var expiredCount = await db.AccessItems
                    .Where(i => i.Status == RequestStatus.ItApproved
                             && i.ExpiresAtUtc.HasValue
                             && i.ExpiresAtUtc.Value < DateTime.UtcNow)
                    .ExecuteUpdateAsync(s =>
                        s.SetProperty(i => i.Status, RequestStatus.Expired),
                        stoppingToken);

                logger.LogInformation("Expired {Count} access items.", expiredCount);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error in AccessExpiryService.");
            }
        }
    }
}

// Registration in Program.cs:
// builder.Services.AddHostedService<AccessExpiryService>();
```

---

## 16. Workflow State Machine Reference

```
User submits request
       │
       ▼
[PendingWithHod]  ◄──────────────────────────────────────────────┐
       │                                                           │
   HOD action (per item)                                          │
   ┌───┴───┐                                                       │
   │       │                                                       │
Approve  Reject ──► [HodRejected] ──► User resubmits ────────────┘
   │
   ▼
[PendingWithIt]
   │
Operator action (per item)
   ┌────┴─────┐
   │          │
Approve     Reject ──► [ItRejected] ──► User resubmits ──► [PendingWithHod]
   │
   ▼
[ItApproved]
Expiry = ApprovedAt + 90 days
   │
   ├──► Operator Revoke ──► [Revoked]
   │
   └──► Auto-expire (cron) ──► [Expired] ──► User renews ──► [PendingWithHod]

HOD self-submits
       │
       ▼
[PendingWithIt]  (skips HOD cart entirely)
       │
       └──► same Operator flow above
```

### Notification Trigger Matrix

| Event | Notified |
|---|---|
| User submits | User (ticket list) + User's Dept HOD + Folder's HOD(s) + All IT |
| HOD approves item | All IT |
| HOD rejects item | Requester |
| IT approves item | Requester |
| IT rejects item | Requester |
| IT revokes item | Requester |
| Item auto-expired | Requester |
| HOD self-submits | All IT |
| User resubmits/renews | All resolved HODs (dept + folder) |

### HOD Cart Visibility Rule

A HOD sees a `PendingWithHod` item if **either** condition is true:

```
item visible to HOD ⟺
    (item.AccessRequest.UserId  ∈  users.where(dept.hod_id == hod.userId))
    OR
    (item.FolderPath  ∈  folderMappings.where(primaryHodId == hod.userId
                                              OR secondaryHodId == hod.userId))
```

---

> **Migration note:** After adding `NotificationEntity`, run:
> ```
> dotnet ef migrations add AddNotifications --context AppDbContext
> dotnet ef database update --context AppDbContext
> ```
