using Web.Domain.Common;
using Web.Domain.Dto.Login;

namespace Web.Application.Services;

public interface IAuthService
{
    Task<Result<LoginResponseDto>> LoginAsync(LoginRequestDto dto);
}
