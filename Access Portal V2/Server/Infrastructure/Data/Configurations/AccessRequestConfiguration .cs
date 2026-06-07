using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Server.Core.Domain.Entities;

namespace Server.Infrastructure.Data.Configurations;

public sealed class AccessRequestConfiguration : IEntityTypeConfiguration<AccessRequestEntity>
{
    public void Configure(EntityTypeBuilder<AccessRequestEntity> builder)
    {
        builder.ToTable("jan_accessrequest");
        builder.HasKey(x => x.AccessReqId);

        builder.Ignore(x => x.Requester);
        builder.Ignore(x => x.ApproverTarget);

        builder.HasIndex(x => x.UserId).HasDatabaseName("IX_jan_accessrequest_user_id");
        builder.HasIndex(x => x.ReqTo).HasDatabaseName("IX_jan_accessrequest_req_to");
    }
}
