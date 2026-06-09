using Microsoft.EntityFrameworkCore;
using Web.Domain.Dto.FolderMapping;
using Web.Infrastructure.Data;

namespace Web.Application.Services;

public class FolderService(AppDbContext context)
{
    private readonly AppDbContext _context = context;

    // The actual path stored in your database
    private const string DbTargetRoot = @"\\10.30.50.15\jipl";

    // The masked path format shown to your API consumers
    private const string DisplayTargetRoot = @"L:\Drive";

    /// <summary>
    /// Fetches all distinct folder paths starting with the target root,
    /// builds a tree structure grouped dynamically by your top-level root directory rules, 
    /// and streams data using EF streaming to minimize memory usage.
    /// </summary>
    public async Task<List<FolderResponse>> GetStrictFolderHierarchyAsync(CancellationToken cancellationToken = default)
    {
        // 1. Fetch only the unique folder paths from MySQL matching your target root
        var folderPaths = await _context.Folders
            .AsNoTracking()
            .Where(a => a.FolderPath.StartsWith(DbTargetRoot))
            .Select(a => a.FolderPath)
            .Distinct()
            .ToListAsync(cancellationToken);

        // 2. Load Allowed Parents (Top-level shares directly following the root unc)
        var allowedParentsMap = new Dictionary<string, FolderNode>(StringComparer.OrdinalIgnoreCase);

        foreach (var fullPath in folderPaths)
        {
            var segments = fullPath.Split(new[] { '\\' }, StringSplitOptions.RemoveEmptyEntries);

            // For path "\\10.30.50.15\jipl\EDP\New", segments are ["10.30.50.15", "jipl", "EDP", "New"]
            // The top level parent folder name lives at index 2 ("EDP")
            if (segments.Length > 2)
            {
                string parentName = segments[2];
                if (!allowedParentsMap.ContainsKey(parentName))
                {
                    allowedParentsMap[parentName] = new FolderNode
                    {
                        Name = parentName,
                        DriveName = DisplayTargetRoot
                    };
                }

                // 3. Build subfolder children paths out into the parent node tree
                var currentNode = allowedParentsMap[parentName];
                for (var i = 3; i < segments.Length; i++)
                {
                    string segmentName = segments[i];

                    // Skip file segments containing dots (.zip, .txt, etc.)
                    if (segmentName.Contains('.')) continue;

                    if (!currentNode.Children.TryGetValue(segmentName, out var childNode))
                    {
                        childNode = new FolderNode
                        {
                            Name = segmentName,
                            DriveName = DisplayTargetRoot
                        };
                        currentNode.Children[segmentName] = childNode;
                    }
                    currentNode = childNode;
                }
            }
        }

        // 4. Transform into your nested API response sorted alphabetically
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
        // Query distinct folder paths starting with target root path string
        var paths = await _context.Folders
            .AsNoTracking()
            .Where(a => a.FolderPath.StartsWith(DbTargetRoot))
            .Select(a => a.FolderPath)
            .Distinct()
            .ToListAsync(cancellationToken);

        // Extract the base level subfolder names (e.g. index 2 in split operation)
        return paths
            .Select(path => path.Split(new[] { '\\' }, StringSplitOptions.RemoveEmptyEntries))
            .Where(segments => segments.Length > 2)
            .Select(segments => segments[2])
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(name => name)
            .Select(name => new FolderResponse
            {
                Name = name,
                DriveName = DisplayTargetRoot
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
