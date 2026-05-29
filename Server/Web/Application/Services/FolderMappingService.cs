using Microsoft.EntityFrameworkCore;
using Web.Application.Interfaces;
using Web.Domain.Dto;
using Web.Domain.Entities;
using Web.Infrastructure.Data;

namespace Web.Application.Services;

public sealed class FolderMappingService : IFolderMappingService
{
    private readonly AppDbContext _db;

    public FolderMappingService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<FolderMappingDto>> GetAllAsync()
    {
        var entities = await _db.FolderMappings
            .OrderBy(f => f.FolderName)
            .ToListAsync();

        return entities.Select(MapToDto).ToList();
    }

    public async Task<FolderMappingDto?> GetByIdAsync(int id)
    {
        var entity = await _db.FolderMappings.FirstOrDefaultAsync(f => f.Id == id);
        return entity is null ? null : MapToDto(entity);
    }

    public async Task<FolderMappingDto> CreateAsync(UpsertFolderMappingRequest request)
    {
        var entity = new FolderMappingEntity();
        Apply(entity, request);

        _db.FolderMappings.Add(entity);
        await _db.SaveChangesAsync();

        return MapToDto(entity);
    }

    public async Task<FolderMappingDto?> UpdateAsync(int id, UpsertFolderMappingRequest request)
    {
        var entity = await _db.FolderMappings.FindAsync(id);
        if (entity is null)
            return null;

        Apply(entity, request);
        await _db.SaveChangesAsync();

        return MapToDto(entity);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await _db.FolderMappings.FindAsync(id);
        if (entity is null)
            return false;

        _db.FolderMappings.Remove(entity);
        await _db.SaveChangesAsync();
        return true;
    }

    private static void Apply(FolderMappingEntity entity, UpsertFolderMappingRequest request)
    {
        entity.FolderName = RequestWorkflowSupport.NormalizeFolderPath(request.FolderPath);
        entity.PrimaryHodId = request.PrimaryHodId?.Trim();
        entity.PrimaryHodName = request.PrimaryHodName?.Trim();
        entity.PrimaryHodEmail = request.PrimaryHodEmail?.Trim();
        entity.SecondaryHodId = request.SecondaryHodId?.Trim();
        entity.SecondaryHodName = request.SecondaryHodName?.Trim();
        entity.SecondaryHodEmail = request.SecondaryHodEmail?.Trim();
    }

    private static FolderMappingDto MapToDto(FolderMappingEntity entity) =>
        new(
            entity.Id,
            entity.FolderName,
            entity.PrimaryHodId,
            entity.PrimaryHodName,
            entity.PrimaryHodEmail,
            entity.SecondaryHodId,
            entity.SecondaryHodName,
            entity.SecondaryHodEmail
        );
}
