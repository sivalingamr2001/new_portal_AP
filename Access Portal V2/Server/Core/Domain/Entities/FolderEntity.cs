using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Core.Domain.Entities;

[Table("folders")]
public sealed class FolderEntity : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("folder_path")]
    [StringLength(1000)]
    public string FolderPath { get; set; } = string.Empty;
}
