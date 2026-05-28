namespace CWM.CleanArchitecture.Application.Abstractions.Data;

using CWM.CleanArchitecture.Domain.Entities;
using Microsoft.EntityFrameworkCore;

public interface IAppDbContext
{
    DbSet<TodoItem> Todos { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
