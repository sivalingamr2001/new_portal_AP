namespace CWM.CleanArchitecture.Application.Features.Identity.Login;

using CWM.CleanArchitecture.Application.Abstractions.Identity;
using CWM.CleanArchitecture.Application.Abstractions.Messaging;
using CWM.CleanArchitecture.Domain.Common;

public sealed record LoginCommand(string Email, string Password) : ICommand<Result<TokenResponse>>;
