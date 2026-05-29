using Web.Domain.Dto;

namespace Web.Application.Interfaces;

public interface IFolderMappingService
{
    Task<IReadOnlyList<FolderMappingDto>> GetAllAsync();
    Task<FolderMappingDto?> GetByIdAsync(int id);
    Task<FolderMappingDto> CreateAsync(UpsertFolderMappingRequest request);
    Task<FolderMappingDto?> UpdateAsync(int id, UpsertFolderMappingRequest request);
    Task<bool> DeleteAsync(int id);
}
