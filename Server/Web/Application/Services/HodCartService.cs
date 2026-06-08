using Microsoft.EntityFrameworkCore;
using Web.Application.Interfaces;
using Web.Domain.Common;
using Web.Domain.Dto.AccessRequest;
using Web.Domain.Dto.User;
using Web.Domain.Entities;
using Web.Domain.Enums;
using Web.Infrastructure.Data;

namespace Web.Application.Services;

public sealed class HodCartService(
    AppDbContext db,
    CmplDbContext cmplDb,
    IUserService userService,
    INotificationService notificationService) : IHodCartService
{
    public async Task<Result<List<HodUserListDto>>> GetCmplUserByIdentifiersAsync(string? employeeId, string? email)
    {
        bool isTestEnv = db.Database.IsSqlite();
        var contextQuery = isTestEnv ? db.CmplUsers : cmplDb.CmplUsers;

        List<CmplUser> matchedUsers;

        // Check if both input parameters are completely empty or null
        if (string.IsNullOrWhiteSpace(employeeId) && string.IsNullOrWhiteSpace(email))
        {
            // 1. Fetch ALL corporate compliance users to prepare for a global portal join
            matchedUsers = await contextQuery.ToListAsync();
        }
        else
        {
            // 2. Normalize input values for explicit criteria matching pipelines
            var lowerEmpId = employeeId?.Trim().ToLower();
            var lowerEmail = email?.Trim().ToLower();

            // Fetch only specific corporate entries matching the tracking filters
            matchedUsers = await contextQuery
                .Where(c =>
                    (!string.IsNullOrWhiteSpace(lowerEmpId) && c.EmployeeId != null && c.EmployeeId.ToLower() == lowerEmpId) ||
                    (!string.IsNullOrWhiteSpace(lowerEmail) && c.Email != null && c.Email.ToLower() == lowerEmail))
                .ToListAsync();
        }

        if (!matchedUsers.Any())
        {
            return Result.Failure<List<HodUserListDto>>(
                Error.NotFound("USR_006", "No corporate compliance users found matching the given parameters."));
        }

        // Extract compliance reference primary keys
        var matchedUserIds = matchedUsers.Select(u => u.Id).ToList();

        // 3. Filter down exclusively to active users carrying the 'Hod' role configuration mapping
        var portalUsers = await db.Users
            .Where(u => matchedUserIds.Contains(u.Id) && u.Role == "Hod")
            .ToListAsync();

        if (!portalUsers.Any())
        {
            return Result.Failure<List<HodUserListDto>>(
                Error.Validation("USR_007", "No matching profiles found with active 'Hod' roles in the portal security registry."));
        }

        var responseList = portalUsers
            .Join(
                matchedUsers,
                pUser => pUser.Id,
                cUser => cUser.Id,
                (pUser, cUser) => new HodUserListDto
                {
                    Id = cUser.Id,
                    Name = cUser.Name,
                    EmployeeId = cUser.EmployeeId,
                    Email = cUser.Email,
                    MobileNumber = cUser.MobileNumber,
                    DepartmentId = cUser.DepartmentId,
                    Role = pUser.Role,
                    Location = pUser.Location
                })
            .ToList();

        return Result.Success(responseList);
    }


    public async Task<PagedResult<HodCartItemDto>> GetCartAsync(int hodUserId, int page, int pageSize)
    {
        bool isTestEnv = db.Database.IsSqlite();

        // 1. Resolve the integer user ID into the alphanumeric Employee ID string
        var hodEmployeeId = await GetHodUserIdAsync(hodUserId);
        var cleanEmpId = hodEmployeeId?.Trim().ToLower() ?? string.Empty;

        // 2. Fetch Departments matching the HOD's Employee ID using safe string matching
        var deptIds = await db.Departments
            .Where(d => d.HodId != null && d.HodId.ToLower() == cleanEmpId && d.IsActive)
            .Select(d => d.Id)
            .ToListAsync();

        // 3. Fetch Department Users using the target environment context router
        var cmplContext = isTestEnv ? db.CmplUsers : cmplDb.CmplUsers;
        var deptUserIds = await cmplContext
            .Where(u => u.DepartmentId.HasValue && deptIds.Contains(u.DepartmentId!.Value))
            .Select(u => u.Id)
            .ToListAsync();

        // 4. Update folder mappings logic to evaluate by string EmployeeId, not integer UserId
        var hodOwnedFolderPaths = await db.FolderMappings
            .Where(f => f.IsActive &&
                ((f.PrimaryHodId != null && f.PrimaryHodId.ToLower() == cleanEmpId) ||
                 (f.SecondaryHodId != null && f.SecondaryHodId.ToLower() == cleanEmpId)))
            .Select(f => f.FolderName)
            .ToListAsync();

        // 5. Build the composite validation filter query
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
                i.Status,
                i.AccessType,
                i.Reason,
                i.AccessRequest.UserId,
                i.CreatedOn
            ))
            .ToListAsync();

        return new PagedResult<HodCartItemDto>(items, total, page, pageSize);
    }

    public async Task<Result> ApproveItemAsync(int accessItemId, AccessTypes ConfirmAccessType, string comments, int hodUserId)
    {
        // 1. Properly await the profile extraction and check the domain result status
        var hodProfileResult = await GetPortalHodProfileByIdAsync(hodUserId);
        if (hodProfileResult.IsFailure)
        {
            // Directly maps the "HOD_001" failure error response back up the pipe
            return Result.Failure(hodProfileResult.Error);
        }

        // Safely extract the profile class object out of the Result wrapper container
        var hodProfile = hodProfileResult.Value;

        // 2. Fetch the target item using the integer hodUserId (as declared in your service architecture)
        var item = await GetOwnedItemAsync(accessItemId, hodProfile.EmployeeId, RequestStatus.PendingWithHod);
        if (item is null)
        {
            return Result.Failure(Error.NotFound("ITEM_005", "Item not found or not in your cart."));
        }

        // 3. Update the entity properties in memory
        item.ConfirmAccessType = ConfirmAccessType;
        item.Status = RequestStatus.PendingWithIt;
        item.HodApproverId = hodUserId;
        item.ModifiedOn = DateTime.UtcNow;
        item.ModifiedBy = hodUserId;

        // 4. Mark the entity as modified 
        db.AccessItems.Update(item);

        // 5. Stage the approval log entry
        db.AccessApprovals.Add(new AccessApprovalEntity
        {
            AccessReqId = item.AccessReqId,
            AccessItemId = item.AccessItemId,
            ApproverId = hodUserId,
            ApprovalStatus = RequestStatus.HodApproved,
            ApprovalLevel = "HOD",
            Comments = comments,
            IsActive = true,
            CreatedOn = DateTime.UtcNow,
            CreatedBy = hodUserId
        });

        // 6. Stage the audit trail entry
        db.AccessReqAudits.Add(new AccessReqAuditEntity
        {
            AccessReqId = item.AccessReqId,
            AccessItemId = item.AccessItemId,
            EventType = "HodApproved",
            Message = $"HOD approved ticket {item.TicketNumber}. Forwarded to IT.",
            ActorUserId = hodUserId,
            RecipientUserId = item.AccessRequest?.UserId ?? 0,
            RecipientName = string.Empty,
            RecipientRole = "It",
            IsActive = true,
            CreatedOn = DateTime.UtcNow,
            CreatedBy = hodUserId
        });

        // 7. Commit all pending database changes in a single transaction
        await db.SaveChangesAsync();

        // 8. Trigger external notification service
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

    public async Task<Result<HodUserListDto>> GetPortalHodProfileByIdAsync(int hodUserId)
    {
        // 1. Query the primary portal users table for security attributes
        var portalUser = await db.Users
            .FirstOrDefaultAsync(u => u.Id == hodUserId && u.Role == "Hod");

        if (portalUser is null)
        {
            return Result.Failure<HodUserListDto>(
                Error.NotFound("HOD_001", "The specified user record was not found or is not authorized as a portal HOD."));
        }

        bool isTestEnv = db.Database.IsSqlite();

        // 2. Select matching compliance profile row using your cross-context fallback routing
        var cmplContext = isTestEnv ? db.CmplUsers : cmplDb.CmplUsers;
        var cmplUser = await cmplContext.FirstOrDefaultAsync(c => c.Id == hodUserId);

        // 3. Map directly to a single instance of HodUserListDto using an object initializer
        var combinedProfile = new HodUserListDto
        {
            Id = portalUser.Id, // Using portalUser from line 4
            Role = portalUser.Role,
            Location = portalUser.Location,
            Name = cmplUser?.Name, // Handles null safely if compliance data is missing
            EmployeeId = cmplUser?.EmployeeId,
            Email = cmplUser?.Email,
            MobileNumber = cmplUser?.MobileNumber,
            DepartmentId = cmplUser?.DepartmentId
        };

        // 4. Wrap the mapped object inside a successful domain Result pattern
        return Result.Success(combinedProfile);
    }

    public async Task<Result> RejectItemAsync(int accessItemId, string rejectionReason, int hodUserId)
    {
        // 1. Properly await the profile extraction and check the domain result status
        var hodProfileResult = await GetPortalHodProfileByIdAsync(hodUserId);
        if (hodProfileResult.IsFailure)
        {
            return Result.Failure(hodProfileResult.Error);
        }

        var hodProfile = hodProfileResult.Value;

        // 2. Fetch the target item using the HOD's string EmployeeId instead of integer hodUserId
        var item = await GetOwnedItemAsync(accessItemId, hodProfile.EmployeeId, RequestStatus.PendingWithHod);
        if (item is null)
        {
            return Result.Failure(Error.NotFound("ITEM_005", "Item not found or not in your cart."));
        }

        // 3. Update the entity properties in memory
        item.Status = RequestStatus.HodRejected;
        item.RejectionReason = rejectionReason;
        item.HodApproverId = hodUserId;
        item.ModifiedOn = DateTime.UtcNow;
        item.ModifiedBy = hodUserId;

        // 4. Stage the approval log entry
        db.AccessApprovals.Add(new AccessApprovalEntity
        {
            AccessReqId = item.AccessReqId,
            AccessItemId = item.AccessItemId,
            ApproverId = hodUserId,
            ApprovalStatus = RequestStatus.HodRejected,
            ApprovalLevel = "HOD",
            Comments = rejectionReason,
            IsActive = true,
            CreatedOn = DateTime.UtcNow,
            CreatedBy = hodUserId
        });

        // 5. Stage the audit trail entry
        db.AccessReqAudits.Add(new AccessReqAuditEntity
        {
            AccessReqId = item.AccessReqId,
            AccessItemId = item.AccessItemId,
            EventType = "HodRejected",
            Message = $"HOD rejected ticket {item.TicketNumber}: {rejectionReason}",
            ActorUserId = hodUserId,
            RecipientUserId = item.AccessRequest?.UserId ?? 0,
            RecipientName = string.Empty,
            RecipientRole = "User",
            IsActive = true,
            CreatedOn = DateTime.UtcNow,
            CreatedBy = hodUserId
        });

        // 6. Commit transaction changes
        await db.SaveChangesAsync();

        // 7. Trigger notification routing back to the user
        if (item.AccessRequest != null)
        {
            await notificationService.NotifyUserAsync(
                userId: item.AccessRequest.UserId,
                role: "User",
                title: "Item Rejected by HOD",
                message: $"Ticket {item.TicketNumber} was rejected. Reason: {rejectionReason}. You may resubmit.",
                type: "HodRejected",
                requestId: item.AccessReqId,
                itemId: item.AccessItemId,
                ticketNumber: item.TicketNumber);
        }

        return Result.Success();
    }

    public async Task<Result> ApproveAllInRequestAsync(
    int accessRequestId, string comments, int hodUserId)
    {
        // 1. Properly await the profile extraction and check the domain result status
        var hodProfileResult = await GetPortalHodProfileByIdAsync(hodUserId);
        if (hodProfileResult.IsFailure)
        {
            // Directly maps the "HOD_001" failure error response back up the pipe
            return Result.Failure(hodProfileResult.Error);
        }

        var hodProfile = hodProfileResult.Value;
        bool isTestEnv = db.Database.IsSqlite();

        // 2. Isolate the clean, case-insensitive string identifier
        var cleanEmpId = hodProfile.EmployeeId?.Trim().ToLower() ?? string.Empty;

        // 3. Get Departments matching the HOD's Employee ID string code safely
        var deptIds = await db.Departments
            .Where(d => d.HodId != null && d.HodId.ToLower() == cleanEmpId && d.IsActive)
            .Select(d => d.Id)
            .ToListAsync();

        // 4. Fetch Department Users using the target environment context router
        var cmplContext = isTestEnv ? db.CmplUsers : cmplDb.CmplUsers;
        var deptUserIds = await cmplContext
            .Where(u => u.DepartmentId.HasValue && deptIds.Contains(u.DepartmentId!.Value))
            .Select(u => u.Id)
            .ToListAsync();

        // 5. Match folder mappings using the HOD's string identifiers (Primary or Secondary)
        var hodOwnedPaths = await db.FolderMappings
            .Where(f => f.IsActive &&
                ((f.PrimaryHodId != null && f.PrimaryHodId.ToLower() == cleanEmpId) ||
                 (f.SecondaryHodId != null && f.SecondaryHodId.ToLower() == cleanEmpId)))
            .Select(f => f.FolderName)
            .ToListAsync();

        // 6. Fetch all target pending items belonging to this manager's domain in the request
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

        // 7. Execute bulk approval mapping
        foreach (var item in items)
        {
            item.Status = RequestStatus.PendingWithIt;
            item.HodApproverId = hodUserId;
            item.ModifiedOn = DateTime.UtcNow;
            item.ModifiedBy = hodUserId;

            db.AccessApprovals.Add(new AccessApprovalEntity
            {
                AccessReqId = item.AccessReqId,
                AccessItemId = item.AccessItemId,
                ApproverId = hodUserId,
                ApprovalStatus = RequestStatus.HodApproved,
                ApprovalLevel = "HOD",
                Comments = comments,
                IsActive = true,
                CreatedOn = DateTime.UtcNow,
                CreatedBy = hodUserId
            });

            // Staging individual audit trails for complete operational visibility
            db.AccessReqAudits.Add(new AccessReqAuditEntity
            {
                AccessReqId = item.AccessReqId,
                AccessItemId = item.AccessItemId,
                EventType = "HodBulkApproved",
                Message = $"HOD bulk approved ticket {item.TicketNumber} via request macro sequence.",
                ActorUserId = hodUserId,
                RecipientUserId = item.AccessRequest?.UserId ?? 0,
                RecipientName = string.Empty,
                RecipientRole = "It",
                IsActive = true,
                CreatedOn = DateTime.UtcNow,
                CreatedBy = hodUserId
            });
        }

        // 8. Commit all updates and entries in a single optimized transactional save operation
        await db.SaveChangesAsync();

        // 9. Trigger external notification group alerts
        await notificationService.NotifyRoleGroupAsync(
            role: "It",
            title: "Bulk HOD Approval",
            message: $"{items.Count} items in Request #{accessRequestId} approved by HOD.",
            type: "BulkHodApproved",
            requestId: accessRequestId);

        return Result.Success();
    }


    // ─── Private ─────────────────────────────────────────────────────────────────

    private async Task<string?> GetHodUserIdAsync(int hodUserId)
        => await db.HodMasters
            .Where(h => h.UserId == hodUserId && h.Deleted == 0)
            .Select(h => h.EmployeeId)
            .FirstOrDefaultAsync();

    private async Task<string?> GetHodEmployeeIdAsync(string hodEmpId)
    => await db.HodMasters
        .Where(h => h.EmployeeId == hodEmpId && h.Deleted == 0)
        .Select(h => h.EmployeeId)
        .FirstOrDefaultAsync();

    private async Task<AccessItemEntity?> GetOwnedItemAsync(
    int accessItemId, string? hodIdentifier, RequestStatus requiredStatus)
    {
        if (string.IsNullOrWhiteSpace(hodIdentifier)) return null;

        bool isTestEnv = db.Database.IsSqlite();
        var cleanEmpId = hodIdentifier.Trim().ToLower();

        // A. Fetch departments managed by this HOD's string identifier
        var deptIds = await db.Departments
            .Where(d => d.HodId != null && d.HodId.ToLower() == cleanEmpId && d.IsActive)
            .Select(d => d.Id)
            .ToListAsync();

        // B. Fetch user IDs belonging to those departments
        var cmplContext = isTestEnv ? db.CmplUsers : cmplDb.CmplUsers;
        var deptUserIds = await cmplContext
            .Where(u => u.DepartmentId.HasValue && deptIds.Contains(u.DepartmentId!.Value))
            .Select(u => u.Id)
            .ToListAsync();

        // C. Fetch folder paths managed by this HOD's string identifier (Primary or Secondary)
        var hodPaths = await db.FolderMappings
            .Where(f => f.IsActive &&
                ((f.PrimaryHodId != null && f.PrimaryHodId.ToLower() == cleanEmpId) ||
                 (f.SecondaryHodId != null && f.SecondaryHodId.ToLower() == cleanEmpId)))
            .Select(f => f.FolderName)
            .ToListAsync();

        // D. Fetch the single target item restricted to this manager's domain
        return await db.AccessItems
            .Include(i => i.AccessRequest)
            .FirstOrDefaultAsync(i =>
                i.AccessItemId == accessItemId
                && i.Status == requiredStatus
                && (deptUserIds.Contains(i.AccessRequest.UserId)
                    || hodPaths.Contains(i.FolderPath)));
    }

}
