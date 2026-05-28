namespace CWM.CleanArchitecture.Application.Features.Identity.RefreshToken;

using CWM.CleanArchitecture.Application.Abstractions.Identity;
using CWM.CleanArchitecture.Application.Abstractions.Messaging;
using CWM.CleanArchitecture.Domain.Common;

public sealed record RefreshTokenCommand(string AccessToken, string RefreshToken) : ICommand<Result<TokenResponse>>;
