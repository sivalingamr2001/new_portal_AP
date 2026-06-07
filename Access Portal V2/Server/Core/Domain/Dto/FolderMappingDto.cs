namespace Server.Core.Domain.Dto.FolderMapping;

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

public class FolderResponse
{
    public string DriveName { get; set; } = @"\\10.30.50.15\jipl";
    public string Name { get; set; } = string.Empty;
    public List<FolderResponse> Children { get; set; } = new();
}

internal class FolderNode
{
    public string Name { get; set; } = string.Empty;
    public string DriveName { get; set; } = string.Empty;
    public Dictionary<string, FolderNode> Children { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}
