namespace Web.Domain.Dto;

public sealed class LoginResponseDto
{
    public CmplUserDto CmplUser { get; init; } = default!;

    public UserDto User { get; init; } = default!;

    public DepartmentDto? Department { get; init; }

    public HodDto? Hod { get; init; }
}

public sealed record UserDto(
    int UserId,
    string Role,
    string Location
);

public sealed record CmplUserDto(
    int CmplUserId,
    string CmplUserName,
    string? EmpId,
    string? MailId,
    string? MobNo,
    int? DeptId
);

public sealed record DepartmentDto(
    int DeptId,
    string? DeptName
);

public sealed record HodDto(
    int IdRow,
    string HodName,
    string? Id,
    string? EmailId,
    string? MobNo
);