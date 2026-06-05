using Microsoft.EntityFrameworkCore;
using Server.Shared.Helpers;
using Web.Domain.Common;
using Web.Domain.Dto;
using Web.Domain.Entities;
using Web.Infrastructure.Data;

namespace Web.Application.Services;

public sealed class FolderMappingService(
    AppDbContext db,
    HodDbContext hodDb, FolderService folderService) : IFolderMappingService
{
    public async Task<PagedResult<FolderMappingDto>> GetAllAsync(
        int page, int pageSize, string? search)
    {
        var query = db.FolderMappings.Where(f => f.IsActive);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(f => f.FolderName.Contains(search));

        var total = await query.CountAsync();
        var data = await query
            .OrderBy(f => f.FolderName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(f => MapToDto(f))
            .ToListAsync();

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

        var validationError = await ValidateHodIdsAsync(dto.PrimaryHodId, dto.SecondaryHodId, isTestEnv);
        if (validationError is not null)
            return Result.Failure<int>(validationError);

        var entity = new FolderMappingEntity
        {
            FolderName = dto.FolderPath,
            PrimaryHodId = dto.PrimaryHodId,
            PrimaryHodName = dto.PrimaryHodName,
            PrimaryHodEmail = dto.PrimaryHodEmail,
            SecondaryHodId = dto.SecondaryHodId,
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

    public async Task<Result> UpdateAsync(
        int id, UpsertFolderMappingRequest dto, int updatedBy)
    {
        var entity = await db.FolderMappings
            .FirstOrDefaultAsync(f => f.Id == id && f.IsActive);

        if (entity is null)
            return Result.Failure(Error.NotFound("FOLDER_001", "Folder mapping not found."));

        // Check path conflict (excluding self)
        var pathConflict = await db.FolderMappings
            .AnyAsync(f => f.FolderName == dto.FolderPath && f.Id != id && f.IsActive);

        if (pathConflict)
            return Result.Failure(
                Error.Conflict("FOLDER_002", "Another mapping already uses this folder path."));

        bool isTestEnv = db.Database.IsSqlite();

        var validationError = await ValidateHodIdsAsync(dto.PrimaryHodId, dto.SecondaryHodId, isTestEnv);
        if (validationError is not null)
            return Result.Failure(validationError);

        entity.FolderName = dto.FolderPath;
        entity.PrimaryHodId = dto.PrimaryHodId;
        entity.PrimaryHodName = dto.PrimaryHodName;
        entity.PrimaryHodEmail = dto.PrimaryHodEmail;
        entity.SecondaryHodId = dto.SecondaryHodId;
        entity.SecondaryHodName = dto.SecondaryHodName;
        entity.SecondaryHodEmail = dto.SecondaryHodEmail;
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

    // ─── Private ─────────────────────────────────────────────────────────────────

    private async Task<Error?> ValidateHodIdsAsync(string? primaryHodId, string? secondaryHodId, bool isTestEnv)
    {
        if (!string.IsNullOrWhiteSpace(primaryHodId))
        {
            var exists = isTestEnv
                ? await db.HodMasters.AnyAsync(h => h.EmployeeId == primaryHodId && h.Deleted == 0)
                : await hodDb.HodMasters.AnyAsync(h => h.EmployeeId == primaryHodId && h.Deleted == 0);
            if (!exists)
                return Error.NotFound("FOLDER_004", "Primary HOD not found in HOD master.");
        }

        if (!string.IsNullOrWhiteSpace(secondaryHodId))
        {
            if (!int.TryParse(secondaryHodId, out var sid))
                return Error.Validation("FOLDER_005", "SecondaryHodId must be a valid integer.");

            var exists = isTestEnv
                ? await db.HodMasters.AnyAsync(h => h.EmployeeId == secondaryHodId && h.Deleted == 0)
                : await hodDb.HodMasters.AnyAsync(h => h.EmployeeId == secondaryHodId && h.Deleted == 0);
            if (!exists)
                return Error.NotFound("FOLDER_006", "Secondary HOD not found in HOD master.");
        }

        return null;
    }

        public async Task<List<FolderResponse>> GetParentFoldersAsync()
    {
        return await folderService.GetParentFoldersAsync(CancellationToken.None);
    }

    public Task<List<FolderResponse>> GetFolderHierarchyAsync()
    {
        return Task.FromResult(folderService.GetStrictFolderHierarchy());
    }

    private static FolderMappingDto MapToDto(FolderMappingEntity f) => new(
        f.Id,
        f.FolderName,
        f.PrimaryHodId,
        f.PrimaryHodName,
        f.PrimaryHodEmail,
        f.SecondaryHodId,
        f.SecondaryHodName,
        f.SecondaryHodEmail
    );
}
