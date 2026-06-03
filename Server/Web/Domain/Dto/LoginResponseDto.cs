namespace Web.Domain.Dto;

public sealed class LoginResponseDto
{
    public CmplUserDto ComplianceUser { get; init; } = default!;

    public UserDto AccountUser { get; init; } = default!;

    public DepartmentDto? Department { get; init; }

    public HodDto? HeadOfDepartment { get; init; }
}

public sealed record UserDto(
    int Id,
    string Role,
    string Location
);

public sealed record CmplUserDto(
    int Id,
    string Name,
    string? EmployeeId,
    string? Email,
    string? MobileNumber,
    int? DepartmentId
);

public sealed record DepartmentDto(
    int Id,
    string? Name,
    string HodId
);

public sealed record HodDto(
    int UserId,
    string Name,
    string? EmployeeId,
    string? Email,
    string? MobileNumber
);

//public sealed class CleanLoginResponse
//{
//    public UserProfile User { get; set; } = null!;
//    public DeptProfile? Department { get; set; }
//    public ManagerProfile? Manager { get; set; }
//}

//public sealed record UserProfile(
//    int SystemUserId,
//    string? EmployeeId,
//    string FullName,
//    string? Email,
//    string? PhoneNumber,
//    string Role,
//    string Location
//);

//public sealed record DeptProfile(
//    int Id,
//    string? Name
//);

//public sealed record ManagerProfile(
//    int SystemId,
//    string? EmployeeId,
//    string FullName,
//    string? Email,
//    string? PhoneNumber
//);

//// Mapping Logic
//var finalResponse = new CleanLoginResponse
//{
//    User = new UserProfile(
//        SystemUserId: source.CmplUser.CmplUserId,
//        EmployeeId: source.CmplUser.EmpId,
//        FullName: source.CmplUser.CmplUserName,
//        Email: source.CmplUser.MailId,
//        PhoneNumber: source.CmplUser.MobNo,
//        Role: source.User.Role,
//        Location: source.User.Location
//    ),
//    Department = source.Department != null ? new DeptProfile(
//        Id: source.Department.DeptId,
//        Name: source.Department.DeptName
//    ) : null,
//    Manager = source.Hod != null ? new ManagerProfile(
//        SystemId: source.Hod.IdRow,
//        EmployeeId: source.Hod.Id,
//        FullName: source.Hod.HodName,
//        Email: source.Hod.EmailId,
//        PhoneNumber: source.Hod.MobNo
//    ) : null
//};
