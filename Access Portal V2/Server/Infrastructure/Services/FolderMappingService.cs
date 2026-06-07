using Microsoft.EntityFrameworkCore;
using Server.Core.Domain.Common;
using Server.Core.Domain.Dto.FolderMapping;
using Server.Core.Domain.Entities;
using Server.Core.Interfaces;
using Server.Infrastructure.Data;

namespace Server.Infrastructure.Services;

public sealed class FolderMappingService(
    AppDbContext db,
    IdentityDbContext identityDb,
    FolderService folderService,
    FolderServiceLocal serviceLocal) : IFolderMappingService
{
    public async Task<PagedResult<FolderMappingDto>> GetAllAsync(
        int page, int pageSize, string? search)
    {
        var query = db.FolderMappings.Where(f => f.IsActive);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(f => f.FolderName.Contains(search));

        var total = await query.CountAsync();
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
        var exists = await db.FolderMappings
            .AnyAsync(f => f.FolderName == dto.FolderPath && f.IsActive);

        if (exists)
            return Result.Failure<int>(
                Error.Conflict("FOLDER_002", "A mapping for this folder path already exists."));

        int? primaryId = ParseHodId(dto.PrimaryHodId);
        int? secondaryId = ParseHodId(dto.SecondaryHodId);

        var validationError = await ValidateHodIdsAsync(primaryId, secondaryId);
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

        int? primaryId = ParseHodId(dto.PrimaryHodId);
        int? secondaryId = ParseHodId(dto.SecondaryHodId);

        var validationError = await ValidateHodIdsAsync(primaryId, secondaryId);
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

    private async Task<Error?> ValidateHodIdsAsync(int? primaryHodId, int? secondaryHodId)
    {
        if (primaryHodId.HasValue && primaryHodId > 0)
        {
            var exists = await identityDb.Users
                .Join(db.UserDetails, u => u.UserId, d => d.UserId, (u, d) => new { d.UserId, d.UserRole, d.IsActive })
                .AnyAsync(x => x.UserId == primaryHodId.Value && x.IsActive && x.UserRole.Equals("Hod", StringComparison.OrdinalIgnoreCase));

            if (!exists)
                return Error.NotFound("FOLDER_004", "Primary HOD not found.");
        }

        if (secondaryHodId.HasValue && secondaryHodId > 0)
        {
            var exists = await identityDb.Users
                .Join(db.UserDetails, u => u.UserId, d => d.UserId, (u, d) => new { d.UserId, d.UserRole, d.IsActive })
                .AnyAsync(x => x.UserId == secondaryHodId.Value && x.IsActive && x.UserRole.Equals("Hod", StringComparison.OrdinalIgnoreCase));

            if (!exists)
                return Error.NotFound("FOLDER_006", "Secondary HOD not found.");
        }

        return null;
    }

    private static int? ParseHodId(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return null;
        if (int.TryParse(input, out var id) && id > 0) return id;
        return null;
    }

    public async Task<List<FolderResponse>> GetParentFoldersAsync()
    {
        var result = db.Database.IsSqlite()
            ? await serviceLocal.GetParentFoldersAsync(CancellationToken.None)
            : await folderService.GetParentFoldersAsync(CancellationToken.None);

        return result;
    }

    public async Task<List<FolderResponse>> GetFolderHierarchyAsync()
    {
        var result = db.Database.IsSqlite()
            ? serviceLocal.GetStrictFolderHierarchy()
            : await folderService.GetStrictFolderHierarchyAsync();

        return result;
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
