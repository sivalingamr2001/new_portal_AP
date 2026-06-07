using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Server.Core.Domain.Common;
using Server.Core.Interfaces;
using Server.Infrastructure.Data;
using Server.Infrastructure.Security;
using Server.Infrastructure.Services;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// =========================================================================
// 1. CONFIGURATION & VARIABLES
// =========================================================================
var dbProvider = builder.Configuration["Database:Provider"] ?? "Sqlite";

bool isMySql = dbProvider.Equals(
    "MySQL",
    StringComparison.OrdinalIgnoreCase);

// =========================================================================
// 2. CORE SYSTEM SERVICES (DI Framework Foundations Must Load First!)
// =========================================================================
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSignalR();
builder.Services.AddProblemDetails();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Access Governance Web API",
        Version = "v1"
    });

    const string schemeId = "UserIdHeader";

    c.AddSecurityDefinition(schemeId, new OpenApiSecurityScheme
    {
        Description =
            "Enter your numeric User ID directly to authenticate requests (e.g., 1).",
        In = ParameterLocation.Header,
        Name = "X-User-Id",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "ApiKeyScheme"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = schemeId
                }
            },
            Array.Empty<string>()
        }
    });
});

// =========================================================================
// 3. CORS CONFIGURATION
// =========================================================================
const string CorsPolicyName = "SignalRAndApiPolicy";

builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicyName, policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// =========================================================================
// 4. DATABASE CONTEXTS
// =========================================================================
builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (isMySql)
    {
        var connectionString =
            builder.Configuration.GetConnectionString("DefaultConnection");

        options.UseMySql(
            connectionString!,
            ServerVersion.AutoDetect(connectionString));
    }
    else
    {
        var connectionString =
            builder.Configuration.GetConnectionString("SqliteConnection");

        options.UseSqlite(connectionString);
    }
});

builder.Services.AddDbContext<IdentityDbContext>(options =>
{
    if (isMySql)
    {
        var connectionString =
            builder.Configuration.GetConnectionString("MySQLConnection_CMPL");

        options.UseMySql(
            connectionString!,
            ServerVersion.AutoDetect(connectionString));
    }
    else
    {
        var connectionString =
            builder.Configuration.GetConnectionString("SqliteConnection_CMPL");

        options.UseSqlite(connectionString);
    }
});

// =========================================================================
// 5. APPLICATION SERVICES (DI REGISTRATION)
// =========================================================================
builder.Services.AddHttpContextAccessor();

builder.Services.AddScoped<ICurrentUserProvider, HttpHeaderUserProvider>();

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IDepartmentService, DepartmentService>();
builder.Services.AddScoped<IAccessRequestWorkflow, AccessRequestWorkflow>();
builder.Services.AddScoped<IFolderMappingService, FolderMappingService>();
builder.Services.AddScoped<FolderService>();
builder.Services.AddScoped<FolderServiceLocal>();

// =========================================================================
// 6. PIPELINE & MIDDLEWARE BUILD
// =========================================================================
var app = builder.Build();

// =========================================================================
// DATABASE INITIALIZATION
// =========================================================================
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;

    var env = services.GetRequiredService<IWebHostEnvironment>();

    var logger = services
        .GetRequiredService<ILoggerFactory>()
        .CreateLogger("DatabaseInitializer");

    try
    {
        var db = services.GetRequiredService<AppDbContext>();
        var cmplDb = services.GetRequiredService<IdentityDbContext>();

        await db.Database.EnsureCreatedAsync();
        await cmplDb.Database.EnsureCreatedAsync();

        await AppSeeder.SeedUsersAsync(cmplDb, db);
    }
    catch (Exception ex)
    {
        logger.LogError(
            ex,
            "An error occurred while initializing the database.");
    }
}

// =========================================================================
// DEVELOPMENT TOOLS
// =========================================================================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();

    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint(
            "/swagger/v1/swagger.json",
            "Access Governance Web API v1");

        c.RoutePrefix = "swagger";
    });
}

// =========================================================================
// MIDDLEWARE PIPELINE
// =========================================================================
app.UseExceptionHandler();
app.UseStatusCodePages();

app.UseHttpsRedirection();

app.UseCors(CorsPolicyName);

// =========================================================================
// ENDPOINT MAPPINGS
// =========================================================================
app.MapControllers();

// app.MapHub<NotificationHub>("/hubs/notifications");

app.Run();