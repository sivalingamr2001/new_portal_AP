namespace Web.Domain.Dto.Department;

public sealed record DepartmentDetailDto(
    int Id,
    string? Name,
    int? HodId,
    string? HodName,
    string? HodEmail,
    bool IsActive,
    DateTime CreatedOn
);

public sealed record UpsertDepartmentDto(
    string Name,
    int? HodId
);
