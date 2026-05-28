namespace CWM.CleanArchitecture.Api.Endpoints;

using CWM.CleanArchitecture.Api.Extensions;
using CWM.CleanArchitecture.Application.Abstractions.Identity;
using CWM.CleanArchitecture.Application.Abstractions.Messaging;
using CWM.CleanArchitecture.Application.Features.Identity.Login;
using CWM.CleanArchitecture.Application.Features.Identity.RefreshToken;
using CWM.CleanArchitecture.Application.Features.Identity.Register;
using CWM.CleanArchitecture.Domain.Common;

public static class IdentityEndpoints
{
    public static void MapIdentityEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/identity")
            .WithTags("Identity");

        group.MapPost("/register", Register)
            .AddEndpointFilter<ValidationFilter<RegisterCommand>>()
            .WithName("Register")
            .WithSummary("Register a new user");

        group.MapPost("/login", Login)
            .AddEndpointFilter<ValidationFilter<LoginCommand>>()
            .WithName("Login")
            .WithSummary("Login with email and password");

        group.MapPost("/refresh", Refresh)
            .WithName("RefreshToken")
            .WithSummary("Refresh an expired access token");
    }

    private static async Task<IResult> Register(
        RegisterCommand command,
        ICommandHandler<RegisterCommand, Result> handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(command, cancellationToken);
        return result.IsSuccess ? TypedResults.Ok() : result.ToProblemDetails();
    }

    private static async Task<IResult> Login(
        LoginCommand command,
        ICommandHandler<LoginCommand, Result<TokenResponse>> handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(command, cancellationToken);
        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.ToProblemDetails();
    }

    private static async Task<IResult> Refresh(
        RefreshTokenCommand command,
        ICommandHandler<RefreshTokenCommand, Result<TokenResponse>> handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(command, cancellationToken);
        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.ToProblemDetails();
    }
}
