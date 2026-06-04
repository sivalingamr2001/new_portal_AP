using Web.Domain.Dto;

namespace Web.Application.Services;

public interface IDashboardService
{
    Task<DashboardDto> GetDashboardAsync(int callerUserId, string role);
}