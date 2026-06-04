using Web.Domain.Dto;

namespace Web.Application.Interfaces;

public interface IAuthService
{
	Task<LoginResponseDto?> LoginAsync(string identifier, string password);
}
