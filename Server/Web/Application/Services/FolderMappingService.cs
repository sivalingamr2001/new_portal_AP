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
        int? primaryId = ParseHodId(dto.PrimaryHodId);
        int? secondaryId = ParseHodId(dto.SecondaryHodId);

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

    public async Task<Result> UpdateAsync(
        int id, UpsertFolderMappingRequest dto, int updatedBy)
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

        // Convert the incoming string IDs cleanly to nullable integers
        int? primaryId = ParseHodId(dto.PrimaryHodId);
        int? secondaryId = ParseHodId(dto.SecondaryHodId);

        var validationError = await ValidateHodIdsAsync(primaryId, secondaryId, isTestEnv);
        if (validationError is not null)
            return Result.Failure(validationError);

        entity.FolderName = dto.FolderPath;
        entity.PrimaryHodId = primaryId;
        entity.PrimaryHodName = dto.PrimaryHodName;
        entity.PrimaryHodEmail = dto.PrimaryHodEmail;
        entity.SecondaryHodId = secondaryId;
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

    private async Task<Error?> ValidateHodIdsAsync(int? primaryHodId, int? secondaryHodId, bool isTestEnv)
    {
        var hodContext = isTestEnv ? db.HodMasters : hodDb.HodMasters;

        // Check if primary HOD exists using integer UserId
        if (primaryHodId.HasValue && primaryHodId > 0)
        {
            var exists = await hodContext.AnyAsync(h => h.UserId == primaryHodId.Value && h.Deleted == 0);
            if (!exists)
                return Error.NotFound("FOLDER_004", "Primary HOD not found in HOD master.");
        }

        // Check if secondary HOD exists using integer UserId
        if (secondaryHodId.HasValue && secondaryHodId > 0)
        {
            var exists = await hodContext.AnyAsync(h => h.UserId == secondaryHodId.Value && h.Deleted == 0);
            if (!exists)
                return Error.NotFound("FOLDER_006", "Secondary HOD not found in HOD master.");
        }

        return null;
    }

    // Converts string input safely to int?, treating empty, non-numeric, or "0" as null
    private static int? ParseHodId(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return null;
        if (int.TryParse(input, out var id) && id > 0) return id;
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
        f.PrimaryHodId > 0 ? f.PrimaryHodId.ToString() : null,
        f.PrimaryHodName,
        f.PrimaryHodEmail,
        f.SecondaryHodId > 0 ? f.SecondaryHodId.ToString() : null,
        f.SecondaryHodName,
        f.SecondaryHodEmail
    );
}
