namespace Web.Domain.Dto;

public sealed record FolderMappingDto(
    int Id,
    string FolderPath,
    string? PrimaryHodId,
    string? PrimaryHodName,
    string? PrimaryHodEmail,
    string? SecondaryHodId,
    string? SecondaryHodName,
    string? SecondaryHodEmail
);

public sealed record UpsertFolderMappingRequest(
    string FolderPath,
    string? PrimaryHodId,
    string? PrimaryHodName,
    string? PrimaryHodEmail,
    string? SecondaryHodId,
    string? SecondaryHodName,
    string? SecondaryHodEmail
);
