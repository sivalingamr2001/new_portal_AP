namespace Web.Domain.Dto.Login;

public sealed class LoginRequestDto
{
    public string Identifier { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
