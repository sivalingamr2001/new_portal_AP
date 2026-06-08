using Web.Domain.Dto.Login;

namespace Web.Domain.Dto.User;

public sealed record CmplUserDto(
    int Id,
    string? Name,
    string? EmployeeId,
    string? Email,
    long? MobileNumber,
    int? DepartmentId
);

public sealed record PortalUserDto(
    int Id,
    string Name,
    string? EmployeeId,
    string? Email,
    long? MobileNumber,
    int? DepartmentId,
    string Role,
    string Location,
    bool IsActive,
    DateTime CreatedOn
);

public sealed class PortalUserDetails
{
    public UserProfile? User { get; init; }

    public DepartmentDto? Department { get; init; }

    public HodDto? HeadOfDepartment { get; init; }
}


public sealed record UpsertPortalUserDto(
    int CmplUserId,
    string Role,
    string Location
);

public sealed class HodUserListDto
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public string? EmployeeId { get; set; }
    public string? Email { get; set; }
    public long? MobileNumber { get; set; }
    public int? DepartmentId { get; set; }
    public string? Role { get; set; } = string.Empty;
    public string? Location { get; set; } = string.Empty;
}
