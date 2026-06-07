using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Core.Domain.Entities;

[Table("jan_complaint_login")]
public class UserAccount : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [Column("CMPL_USER_ID")]
    public int UserId { get; set; }

    [Column("CMPL_USER_NAME")]
    public string? UserName { get; set; }

    [Column("CMPL_USER_KEY")]
    public string? UserKey { get; set; }

    [Column("MOB_NO")]
    public long? MobileNo { get; set; }

    [Column("MAIL_ID")]
    public string? MailId { get; set; }

    [Column("DEPT_ID")]
    public int? DeptId { get; set; }

    [Column("emp_id")]
    public string? EmpId { get; set; }
}
