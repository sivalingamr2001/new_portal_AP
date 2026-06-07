namespace Server.Core.Domain.Common;

public interface ICurrentUserProvider
{
    int GetUserId();
}
