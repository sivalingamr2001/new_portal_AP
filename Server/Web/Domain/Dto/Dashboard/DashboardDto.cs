namespace Web.Domain.Dto.Dashboard;

public sealed record DashboardDto(
    int TotalRequests,
    int PendingWithHod,
    int PendingWithIt,
    int ApprovedActive,
    int HodRejected,
    int ItRejected,
    int Revoked,
    int Expired,
    int ExpiringSoon,
    int MyPendingItems,
    int MyApprovedItems,
    int MyRejectedItems,
    List<RecentRequestDto> RecentRequests
);

public sealed record RecentRequestDto(
    int RequestId,
    int UserId,
    string Status,
    DateTime CreatedOn,
    int ItemCount
);
