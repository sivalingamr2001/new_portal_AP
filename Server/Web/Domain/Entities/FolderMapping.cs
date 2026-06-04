using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Web.Domain.Common;

namespace Web.Domain.Entities;

[Table("jan_folder_mappings")]
public sealed class FolderMappingEntity : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("folder_name")]
    [MaxLength(500)]
    public string FolderName { get; set; } = null!;

    [Column("primary_hod_id")]
    [MaxLength(255)]
    public string? PrimaryHodId { get; set; }

    [Column("primary_hod_name")]
    [MaxLength(255)]
    public string? PrimaryHodName { get; set; }

    [Column("primary_hod_email")]
    [MaxLength(255)]
    public string? PrimaryHodEmail { get; set; }

    [Column("secondary_hod_id")]
    [MaxLength(255)]
    public string? SecondaryHodId { get; set; }

    [Column("secondary_hod_name")]
    [MaxLength(255)]
    public string? SecondaryHodName { get; set; }

    [Column("secondary_hod_email")]
    [MaxLength(255)]
    public string? SecondaryHodEmail { get; set; }
}
