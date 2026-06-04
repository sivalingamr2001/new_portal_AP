using Web.Domain.Common;
using Web.Domain.Dto;

namespace Web.Application.Services;

public interface IFolderMappingService
{
    Task<PagedResult<FolderMappingDto>> GetAllAsync(int page, int pageSize, string? search);
    Task<Result<FolderMappingDto>> GetByIdAsync(int id);
    Task<Result<int>> CreateAsync(UpsertFolderMappingRequest dto, int createdBy);
    Task<Result> UpdateAsync(int id, UpsertFolderMappingRequest dto, int updatedBy);
    Task<Result> DeleteAsync(int id, int deletedBy);
}
