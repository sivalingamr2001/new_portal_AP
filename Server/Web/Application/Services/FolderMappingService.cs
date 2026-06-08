using Microsoft.EntityFrameworkCore;
using Web.Domain.Common;
using Web.Domain.Dto.FolderMapping;
using Web.Domain.Entities;
using Web.Infrastructure.Data;

namespace Web.Application.Services;

public sealed class FolderMappingService(
    AppDbContext db,
    HodDbContext hodDb, FolderService folderService, FolderServiceLocal serviceLocal) : IFolderMappingService
{
    public async Task<PagedResult<FolderMappingDto>> GetAllAsync(
        int page, int pageSize, string? search)
    {
        var query = db.FolderMappings.Where(f => f.IsActive);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(f => f.FolderName.Contains(search));

        var total = await query.CountAsync();

        // Materialize the list first because custom map methods cannot be translated directly to SQL by EF
        var entities = await query
            .OrderBy(f => f.FolderName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var data = entities.Select(MapToDto).ToList();

        return new PagedResult<FolderMappingDto>(data, total, page, pageSize);
    }

    public async Task<Result<FolderMappingDto>> GetByIdAsync(int id)
    {
        var entity = await db.FolderMappings
            .FirstOrDefaultAsync(f => f.Id == id && f.IsActive);

        if (entity is null)
            return Result.Failure<FolderMappingDto>(
                Error.NotFound("FOLDER_001", "Folder mapping not found."));

        return Result.Success(MapToDto(entity));
    }

    public async Task<Result<int>> CreateAsync(
        UpsertFolderMappingRequest dto, int createdBy)
    {
        bool isTestEnv = db.Database.IsSqlite();
        var exists = await db.FolderMappings
            .AnyAsync(f => f.FolderName == dto.FolderPath && f.IsActive);

        if (exists)
            return Result.Failure<int>(
                Error.Conflict("FOLDER_002", "A mapping for this folder path already exists."));

        // Convert the incoming string IDs cleanly to nullable integers
        string? primaryId = dto.PrimaryHodId;
        string? secondaryId = dto.SecondaryHodId;

        var validationError = await ValidateHodIdsAsync(primaryId, secondaryId, isTestEnv);
        if (validationError is not null)
            return Result.Failure<int>(validationError);

        var entity = new FolderMappingEntity
        {
            FolderName = dto.FolderPath,
            PrimaryHodId = primaryId,
            PrimaryHodName = dto.PrimaryHodName,
            PrimaryHodEmail = dto.PrimaryHodEmail,
            SecondaryHodId = secondaryId,
            SecondaryHodName = dto.SecondaryHodName,
            SecondaryHodEmail = dto.SecondaryHodEmail,
            IsActive = true,
            CreatedOn = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        db.FolderMappings.Add(entity);
        await db.SaveChangesAsync();
        return Result.Success(entity.Id);
    }

    private async Task<Error?> ValidateHodIdsAsync(string? primaryHodId, string? secondaryHodId, bool isTestEnv)
    {
        var hodContext = isTestEnv ? db.HodMasters : hodDb.HodMasters;

        // 1. Validate the Primary HOD using explicit string matching pipelines
        if (!string.IsNullOrWhiteSpace(primaryHodId))
        {
            var cleanPrimaryId = primaryHodId.Trim().ToLower();

            // Cross-checks the value against EITHER EmployeeId OR Email strings in HodMaster
            var primaryExists = await hodContext.AnyAsync(h =>
                h.Deleted == 0 &&
                ((h.EmployeeId != null && h.EmployeeId.ToLower() == cleanPrimaryId) ||
                 (h.Email != null && h.Email.ToLower() == cleanPrimaryId))
            );

            if (!primaryExists)
                return Error.NotFound("FOLDER_004", "Primary HOD not found in HOD master list.");
        }

        // 2. Validate the Secondary HOD using explicit string matching pipelines
        if (!string.IsNullOrWhiteSpace(secondaryHodId))
        {
            var cleanSecondaryId = secondaryHodId.Trim().ToLower();

            // Cross-checks the value against EITHER EmployeeId OR Email strings in HodMaster
            var secondaryExists = await hodContext.AnyAsync(h =>
                h.Deleted == 0 &&
                ((h.EmployeeId != null && h.EmployeeId.ToLower() == cleanSecondaryId) ||
                 (h.Email != null && h.Email.ToLower() == cleanSecondaryId))
            );

            if (!secondaryExists)
                return Error.NotFound("FOLDER_006", "Secondary HOD not found in HOD master list.");
        }

        return null;
    }

    public async Task<Result> UpdateAsync(int id, UpsertFolderMappingRequest dto, int updatedBy)
    {
        var entity = await db.FolderMappings
            .FirstOrDefaultAsync(f => f.Id == id && f.IsActive);

        if (entity is null)
            return Result.Failure(Error.NotFound("FOLDER_001", "Folder mapping not found."));

        var pathConflict = await db.FolderMappings
            .AnyAsync(f => f.FolderName == dto.FolderPath && f.Id != id && f.IsActive);

        if (pathConflict)
            return Result.Failure(
                Error.Conflict("FOLDER_002", "Another mapping already uses this folder path."));

        bool isTestEnv = db.Database.IsSqlite();

        // 3. Removed ParseHodId() entirely. Validate incoming DTO parameters straight as string values
        var validationError = await ValidateHodIdsAsync(dto.PrimaryHodId, dto.SecondaryHodId, isTestEnv);
        if (validationError is not null)
            return Result.Failure(validationError);

        // 4. Update the structural fields using your matching string attributes
        entity.FolderName = dto.FolderPath;

        // Ensure data values are trimmed for storage standardization
        entity.PrimaryHodId = dto.PrimaryHodId?.Trim();     // Assuming target tracking property column is string
        entity.PrimaryHodName = dto.PrimaryHodName?.Trim();
        entity.PrimaryHodEmail = dto.PrimaryHodEmail?.Trim();

        entity.SecondaryHodId = dto.SecondaryHodId?.Trim(); // Assuming target tracking property column is string
        entity.SecondaryHodName = dto.SecondaryHodName?.Trim();
        entity.SecondaryHodEmail = dto.SecondaryHodEmail?.Trim();

        entity.ModifiedOn = DateTime.UtcNow;
        entity.ModifiedBy = updatedBy;

        await db.SaveChangesAsync();
        return Result.Success();
    }


    public async Task<Result> DeleteAsync(int id, int deletedBy)
    {
        var entity = await db.FolderMappings
            .FirstOrDefaultAsync(f => f.Id == id && f.IsActive);

        if (entity is null)
            return Result.Failure(Error.NotFound("FOLDER_001", "Folder mapping not found."));

        entity.IsActive = false;
        entity.ModifiedOn = DateTime.UtcNow;
        entity.ModifiedBy = deletedBy;

        await db.SaveChangesAsync();
        return Result.Success();
    }

    public async Task<List<FolderResponse>> GetParentFoldersAsync()
    {
        bool isTestEnv = db.Database.IsSqlite();

        var result = isTestEnv
            ? await serviceLocal.GetParentFoldersAsync(CancellationToken.None)
            : await folderService.GetParentFoldersAsync(CancellationToken.None);
        return result;
    }

    public async Task<List<FolderResponse>> GetFolderHierarchyAsync()
    {
        bool isTestEnv = db.Database.IsSqlite();

        var result = isTestEnv
            ? serviceLocal.GetStrictFolderHierarchy()
            : await folderService.GetStrictFolderHierarchyAsync();

        return result;
    }
    private static FolderMappingDto MapToDto(FolderMappingEntity f) => new(
        f.Id,
        f.FolderName,
        !string.IsNullOrWhiteSpace(f.PrimaryHodId) ? f.PrimaryHodId.Trim() : null,
        f.PrimaryHodName,
        f.PrimaryHodEmail,
        !string.IsNullOrWhiteSpace(f.SecondaryHodId) ? f.SecondaryHodId.Trim() : null,
        f.SecondaryHodName,
        f.SecondaryHodEmail
    );
}
