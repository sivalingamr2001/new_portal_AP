using Web.Application.Services;
using Web.Domain.Common;
using Web.Domain.Dto.Login;
using Web.Domain.Dto.User;

namespace Web.Application.Interfaces;

public interface IUserService
{
    // CmplUsers — GET only
    Task<PagedResult<CmplUserDto>> GetCmplUsersAsync(int page, int pageSize, string? search);
    Task<Result<CmplUserDto>> GetCmplUserByIdAsync(int id);

    // HodMaster — GET only
    Task<PagedResult<HodDto>> GetHodsAsync(int page, int pageSize, string? search);
    Task<Result<HodDto>> GetHodByIdAsync(int id);

    // Portal Users — full CRUD
    Task<PagedResult<PortalUserDetails>> GetPortalUsersAsync(int page, int pageSize, string? search);
    Task<Result<PortalUserDetails>> GetPortalUserByIdAsync(int id);
    Task<Result> UpdatePortalUserAsync(int id, UpsertPortalUserDto dto, int updatedBy);
    Task<Result> DeletePortalUserAsync(int id, int deletedBy);
}
