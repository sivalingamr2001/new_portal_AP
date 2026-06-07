using System.ComponentModel;

namespace Server.Core.Domain.Enums;

public enum AccessTypes
{
    [Description("Not Applicable")]
    NotApplicable,

    [Description("Read Only")]
    ReadOnly,

    [Description("Read & Write")]
    ReadAndWrite
}
