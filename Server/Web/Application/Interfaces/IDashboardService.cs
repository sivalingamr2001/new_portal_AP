using Web.Domain.Dto.Dashboard;

namespace Web.Application.Services;

public interface IDashboardService
{
    Task<DashboardDto> GetDashboardAsync(int callerUserId, string role);
}