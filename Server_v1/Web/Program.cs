using Microsoft.EntityFrameworkCore;
using Server.Shared.Helpers;
using Web.Application.Common;
using Web.Application.Interfaces;
using Web.Application.Services;
using Web.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

const string MyAllowSpecificOrigins = "_myAllowSpecificOrigins";
var connectionStringCmpl = builder.Configuration.GetConnectionString("MySQLConnection_CMPL");
var connectionStringHod = builder.Configuration.GetConnectionString("MySQLConnection_HOD");
var serverVersion = ServerVersion.AutoDetect(connectionStringCmpl);

builder.Services.AddControllers();
builder.Services.AddSignalR();

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
        policy =>
        {
            policy.WithOrigins("http://localhost:5173")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var dbProvider = builder.Configuration.GetValue<string>("Database:Provider");

builder.Services.AddDbContext<AppDbContext>(options =>
{
    var provider = dbProvider?.Trim();

    if (!string.IsNullOrEmpty(provider) && provider.Equals("MySQL", StringComparison.OrdinalIgnoreCase))
    {
        var conn = builder.Configuration.GetConnectionString("DefaultConnection");

        options.UseMySql(conn, ServerVersion.AutoDetect(conn));
    }
    else
    {
        var conn = builder.Configuration.GetConnectionString("SqliteConnection") ?? "Data Source=app.db";
        options.UseSqlite(conn);
    }
});

builder.Services.AddDbContext<CmplDbContext>(options =>
    options.UseMySql(connectionStringCmpl, serverVersion));

builder.Services.AddDbContext<HodDbContext>(options =>
    options.UseMySql(connectionStringHod, serverVersion));

builder.Services.AddSingleton<FolderService>();

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IFolderMappingService, FolderMappingService>();
builder.Services.AddScoped<IAccessRequestService, AccessRequestService>();
builder.Services.AddScoped<IApprovalService, ApprovalService>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddHostedService<ExpiryBackgroundService>();

builder.Services.AddProblemDetails();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var env = scope.ServiceProvider.GetRequiredService<IWebHostEnvironment>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>()
        .CreateLogger("AppDataSeeder");

    await WorkflowSchemaInitializer.EnsureCreatedAsync(db);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Web API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseHttpsRedirection();

app.UseCors(MyAllowSpecificOrigins);

app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");

app.Run();
