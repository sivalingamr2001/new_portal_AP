using Web.Domain.Common;
using Web.Domain.Dto;
using Web.Domain.Entities;

namespace Web.Application.Services;

public interface IAuthService
{
    Task<Result<LoginResponseDto>> LoginAsync(LoginRequestDto dto);
}
