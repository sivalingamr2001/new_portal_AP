namespace CWM.CleanArchitecture.Application.Features.Todos.Complete;

using CWM.CleanArchitecture.Application.Abstractions.Data;
using CWM.CleanArchitecture.Application.Abstractions.Messaging;
using CWM.CleanArchitecture.Domain.Common;

public sealed class CompleteTodoCommandHandler(IAppDbContext dbContext) : ICommandHandler<CompleteTodoCommand>
{
    public async Task<Result> HandleAsync(CompleteTodoCommand command, CancellationToken cancellationToken = default)
    {
        var todo = await dbContext.Todos.FindAsync([command.Id], cancellationToken);
        if (todo is null)
            return Result.Failure(Error.NotFound("Todo.NotFound", $"Todo with ID '{command.Id}' was not found."));

        todo.MarkAsCompleted();
        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
