namespace Web.Domain.Dto.Login;

public sealed class LoginResponseDto
{
    public UserProfile? User { get; init; }

    public DepartmentDto? Department { get; init; }

    public HodDto? HeadOfDepartment { get; init; }
}

public sealed record UserProfile(
    int Id,
    string? Name,
    string Role,
    string Location,
    string? EmployeeId,
    string? Email,
    long? MobileNumber,
    int? DepartmentId
);

public sealed record DepartmentDto(
    int Id,
    string? Name,
    string? HodId
);

public sealed record HodDto(
    int Id,
    string? Name,
    string? EmployeeId,
    string? Email,
    string? MobileNumber
);
