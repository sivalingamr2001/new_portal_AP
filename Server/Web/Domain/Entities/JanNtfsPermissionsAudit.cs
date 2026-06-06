using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Web.Domain.Entities;

[Table("jan_ntfs_permissions_audit")]
[Index(nameof(ScanDate), Name = "idx_scandate")]
[Index(nameof(AssignedIdentity), Name = "idx_assignedidentity")]
public class JanNtfsPermissionsAudit
{
    [Key]
    [Column("auditid")]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public uint AuditId { get; set; }

    [Required]
    [Column("scandate", TypeName = "datetime(6)")]
    public DateTime ScanDate { get; set; }

    [Required]
    [Column("folderpath", TypeName = "text")]
    public string FolderPath { get; set; } = string.Empty;

    [Required]
    [Column("assignedidentity")]
    [StringLength(1000)]
    public string AssignedIdentity { get; set; } = string.Empty;

    [Required]
    [Column("identitytype")]
    [StringLength(500)]
    public string IdentityType { get; set; } = string.Empty;

    [Required]
    [Column("accesscontroltype")]
    [StringLength(500)]
    public string AccessControlType { get; set; } = string.Empty;

    [Required]
    [Column("filesystemrights", TypeName = "text")]
    public string FileSystemRights { get; set; } = string.Empty;

    [Required]
    [Column("resolveduser")]
    [StringLength(1000)]
    public string ResolvedUser { get; set; } = string.Empty;

    [Required]
    [Column("groupname")]
    [StringLength(1000)]
    public string GroupName { get; set; } = string.Empty;
}
