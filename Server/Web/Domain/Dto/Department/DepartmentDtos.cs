namespace Web.Domain.Dto.Department;

public sealed record DepartmentDetailDto(
    int Id,
    string? Name,
    string? HodId,
    string? HodName,
    string? HodEmail,
    bool IsActive,
    DateTime CreatedOn
);

public sealed record UpsertDepartmentDto(
    string Name,
    string? HodId
);
