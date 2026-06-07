using Microsoft.EntityFrameworkCore;
using Server.Core.Domain.Dto.FolderMapping;
using Server.Core.Domain.Entities;
using Server.Infrastructure.Data;

namespace Server.Infrastructure.Services;

public class FolderService(AppDbContext context)
{
    private readonly AppDbContext _context = context;
    private const string TargetRoot = @"\\10.30.50.15\jipl";

    /// <summary>
    /// Fetches all distinct folder paths starting with the target root,
    /// builds a tree structure grouped dynamically by your top-level root directory rules, 
    /// and streams data using EF streaming to minimize memory usage.
    /// </summary>
    public async Task<List<FolderResponse>> GetStrictFolderHierarchyAsync(CancellationToken cancellationToken = default)
    {
        var folderPaths = await _context.Folders
            .AsNoTracking()
            .Where(a => a.FolderPath.StartsWith(TargetRoot))
            .Select(a => a.FolderPath)
            .Distinct()
            .ToListAsync(cancellationToken);

        var allowedParentsMap = new Dictionary<string, FolderNode>(StringComparer.OrdinalIgnoreCase);

        foreach (var fullPath in folderPaths)
        {
            var segments = fullPath.Split(new[] { '\\' }, StringSplitOptions.RemoveEmptyEntries);
            if (segments.Length > 2)
            {
                string parentName = segments[2];
                if (!allowedParentsMap.ContainsKey(parentName))
                {
                    allowedParentsMap[parentName] = new FolderNode
                    {
                        Name = parentName,
                        DriveName = TargetRoot
                    };
                }

                var currentNode = allowedParentsMap[parentName];
                for (var i = 3; i < segments.Length; i++)
                {
                    string segmentName = segments[i];
                    if (segmentName.Contains('.')) continue;

                    if (!currentNode.Children.TryGetValue(segmentName, out var childNode))
                    {
                        childNode = new FolderNode
                        {
                            Name = segmentName,
                            DriveName = TargetRoot
                        };
                        currentNode.Children[segmentName] = childNode;
                    }
                    currentNode = childNode;
                }
            }
        }

        return allowedParentsMap.Values
            .OrderBy(x => x.Name)
            .Select(MapToResponse)
            .ToList();
    }

    /// <summary>
    /// Fast database lookup returning only unique primary base root directories 
    /// located right below the Target Root directory level.
    /// </summary>
    public async Task<List<FolderResponse>> GetParentFoldersAsync(CancellationToken cancellationToken = default)
    {
        var paths = await _context.Folders
            .AsNoTracking()
            .Where(a => a.FolderPath.StartsWith(TargetRoot))
            .Select(a => a.FolderPath)
            .Distinct()
            .ToListAsync(cancellationToken);

        return paths
            .Select(path => path.Split(new[] { '\\' }, StringSplitOptions.RemoveEmptyEntries))
            .Where(segments => segments.Length > 2)
            .Select(segments => segments[2])
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(name => name)
            .Select(name => new FolderResponse
            {
                Name = name,
                DriveName = TargetRoot
            })
            .ToList();
    }

    private FolderResponse MapToResponse(FolderNode node)
    {
        return new FolderResponse
        {
            Name = node.Name,
            DriveName = node.DriveName,
            Children = node.Children.Values
                .OrderBy(x => x.Name)
                .Select(MapToResponse)
                .ToList()
        };
    }
}
