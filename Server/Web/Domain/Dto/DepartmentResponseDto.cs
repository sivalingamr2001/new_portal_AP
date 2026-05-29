namespace Web.Domain.Dto;

public sealed record DepartmentResponseDto(
    DepartmentDto Department,
    HodDto? Hod,
    IReadOnlyList<CmplUserDto> Users
);
