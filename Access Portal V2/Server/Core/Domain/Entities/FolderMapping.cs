using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Core.Domain.Entities;

[Table("jan_folder_mappings")]
public sealed class FolderMappingEntity : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("folder_name")]
    [StringLength(250)]
    public string FolderName { get; set; } = null!;

    [Column("primary_hod_id")]
    public int? PrimaryHodId { get; set; }

    [Column("primary_hod_name")]
    [StringLength(150)]
    public string? PrimaryHodName { get; set; }

    [Column("primary_hod_email")]
    [StringLength(200)]
    public string? PrimaryHodEmail { get; set; }

    [Column("secondary_hod_id")]
    public int? SecondaryHodId { get; set; }

    [Column("secondary_hod_name")]
    [StringLength(150)]
    public string? SecondaryHodName { get; set; }

    [Column("secondary_hod_email")]
    [StringLength(200)]
    public string? SecondaryHodEmail { get; set; }
}
