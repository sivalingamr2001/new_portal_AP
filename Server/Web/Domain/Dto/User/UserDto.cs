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
