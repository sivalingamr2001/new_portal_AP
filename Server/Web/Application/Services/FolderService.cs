using System.IO;
using System.Text;

namespace Server.Shared.Helpers;

// --- API RESPONSE DTO ---
public class FolderResponse
{
    public string DriveName { get; set; } = @"\\10.30.50.15\jipl";
    public string Name { get; set; } = string.Empty;
    public List<FolderResponse> Children { get; set; } = new();
}

// --- INTERNAL PROCESSING STRUCTURE ---
internal class FolderNode
{
    public string Name { get; set; } = string.Empty;
    public string DriveName { get; set; } = string.Empty;
    public Dictionary<string, FolderNode> Children { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}

public class FolderService
{
    // Static configuration paths
    private const string TargetRoot = @"\\10.30.50.15\jipl";
    private static readonly string ConfigFilePath = Path.Combine(Directory.GetCurrentDirectory(), "Shared", "External Sources", "Folders.csv");
    private static readonly string AuditFilePath = Path.Combine(Directory.GetCurrentDirectory(), "Shared", "External Sources", "ntfs_permissions_audit.csv");

    /// <summary>
    /// Professional Scoped Service method to generate folder hierarchy.
    /// Strictly filters out unparented segments and files.
    /// </summary>
    public List<FolderResponse> GetStrictFolderHierarchy()
    {
        // 1. Initialize strictly with allowed parents from Folders.csv
        var allowedParentsMap = LoadAllowedParents(ConfigFilePath);

        // 2. Populate from Audit Log
        if (File.Exists(AuditFilePath))
        {
            // 64KB Buffer for high-speed I/O
            using var reader = new StreamReader(new FileStream(AuditFilePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite, 65536));
            reader.ReadLine(); // Skip CSV Header

            while (reader.ReadLine() is { } line)
            {
                string fullPath = GetColumnValue(line, 2); // Extract 'folderpath' column

                // Root Security Guard
                if (string.IsNullOrEmpty(fullPath) || !fullPath.StartsWith(TargetRoot, StringComparison.OrdinalIgnoreCase))
                    continue;

                var segments = fullPath.Split(new[] { '\\' }, StringSplitOptions.RemoveEmptyEntries);

                // Find index where the Allowed Parent exists
                int parentIdx = -1;
                for (int i = 0; i < segments.Length; i++)
                {
                    if (allowedParentsMap.ContainsKey(segments[i]))
                    {
                        parentIdx = i;
                        break;
                    }
                }

                // If an allowed parent is found, build the children recursively from that anchor
                if (parentIdx != -1)
                {
                    var currentNode = allowedParentsMap[segments[parentIdx]];

                    for (int j = parentIdx + 1; j < segments.Length; j++)
                    {
                        string segmentName = segments[j];

                        // Skip files (segments with extensions like .txt)
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
        }

        // 3. Map to Recursive API-friendly response (Alphabetical A-Z)
        return allowedParentsMap.Values
            .OrderBy(x => x.Name)
            .Select(MapToResponse)
            .ToList();
    }

    public async Task<List<FolderResponse>> GetParentFoldersAsync(CancellationToken cancellationToken)
    {
        if (!File.Exists(ConfigFilePath)) return [];

        var lines = await File.ReadAllLinesAsync(ConfigFilePath, cancellationToken);

        return lines
            .Skip(1) // Skip header
            .Where(line => !string.IsNullOrWhiteSpace(line))
            .Select(line => line.Split(',')[0].Trim('"').Trim())
            .Distinct()
            .OrderBy(name => name)
            .Select(name => new FolderResponse
            {
                Name = name,
                DriveName = TargetRoot
            })
            .ToList();
    }

    private static Dictionary<string, FolderNode> LoadAllowedParents(string path)
    {
        var map = new Dictionary<string, FolderNode>(StringComparer.OrdinalIgnoreCase);
        if (!File.Exists(path)) return map;

        foreach (var line in File.ReadLines(path).Skip(1))
        {
            var name = line.Trim('"', ' ', '\r', '\n');
            if (!string.IsNullOrWhiteSpace(name) && !map.ContainsKey(name))
            {
                map[name] = new FolderNode
                {
                    Name = name,
                    DriveName = TargetRoot
                };
            }
        }
        return map;
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

    private static string GetColumnValue(string line, int index)
    {
        int currentColumn = 0;
        bool inQuotes = false;
        StringBuilder sb = new StringBuilder();

        foreach (char c in line)
        {
            if (c == '\"') { inQuotes = !inQuotes; continue; }
            if (c == ',' && !inQuotes)
            {
                if (currentColumn == index) return sb.ToString().Trim();
                currentColumn++;
                sb.Clear();
                if (currentColumn > index) return string.Empty;
                continue;
            }
            if (currentColumn == index) sb.Append(c);
        }
        return currentColumn == index ? sb.ToString().Trim() : string.Empty;
    }

    private static IReadOnlyList<string> ReadFoldersFromCsv()
    {
        return !File.Exists(ConfigFilePath)
            ? Array.Empty<string>()
            : File.ReadAllLines(ConfigFilePath)
            .Where(line => !string.IsNullOrWhiteSpace(line))
            .Skip(1)
            .Select(line => line.Trim().Trim('"'))
            .Where(line => !string.IsNullOrWhiteSpace(line))
            .ToList();
    }
}
