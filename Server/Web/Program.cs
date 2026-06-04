using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;
using Web.Application.Interfaces;
using Web.Application.Services;
using Web.Infrastructure.Data;
using Web.Infrastructure.Hubs;

var builder = WebApplication.CreateBuilder(args);

// =========================================================================
// 1. CONFIGURATION & VARIABLES
// =========================================================================
var connectionStringCmpl = builder.Configuration.GetConnectionString("MySQLConnection_CMPL");
var connectionStringHod = builder.Configuration.GetConnectionString("MySQLConnection_HOD");
var serverVersion = ServerVersion.AutoDetect(connectionStringCmpl);
var dbProvider = builder.Configuration.GetValue<string>("Database:Provider");

// =========================================================================
// 2. CORE SYSTEM SERVICES
// =========================================================================
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();

// Configured Swagger to accept and inject the X-User-Id header globally using modern Swashbuckle v10 signatures
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Web API", Version = "v1" });

    const string schemeId = "UserIdHeader";

    // 1. Define the custom header input field configuration
    c.AddSecurityDefinition(schemeId, new OpenApiSecurityScheme
    {
        Description = "Enter your numeric User ID directly to authenticate requests (e.g., 1).",
        In = ParameterLocation.Header,
        Name = "X-User-Id",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "ApiKeyScheme"
    });

    // 2. Enforce requirements by passing a delegate function wrapper (doc => ...)
    c.AddSecurityRequirement(doc => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference(schemeId, doc),
            new List<string>()
        }
    });
});

builder.Services.AddSignalR();
builder.Services.AddProblemDetails();


builder.Services.AddSignalR();
builder.Services.AddProblemDetails();

// =========================================================================
// 3. CORS CONFIGURATION
// =========================================================================
builder.Services.AddCors(opts =>
    opts.AddDefaultPolicy(p => p
        .WithOrigins("http://localhost:5173")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()));

// =========================================================================
// 4. DATABASE CONTEXTS
// =========================================================================
var providerName = dbProvider?.Trim();
bool isMySql = !string.IsNullOrEmpty(providerName) && providerName.Equals("MySQL", StringComparison.OrdinalIgnoreCase);

builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (isMySql)
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

// Always register secondary contexts in the main container line
// AppDbContext handles conditional masking internally via OnModelCreating
builder.Services.AddDbContext<CmplDbContext>(options =>
    options.UseMySql(connectionStringCmpl, serverVersion));

builder.Services.AddDbContext<HodDbContext>(options =>
    options.UseMySql(connectionStringHod, serverVersion));

// =========================================================================
// 5. APPLICATION SERVICES (DI REGISTRATION)
// =========================================================================
builder.Services.AddScoped<IAccessRequestService, AccessRequestService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IHodCartService, HodCartService>();
builder.Services.AddScoped<IOperatorCartService, OperatorCartService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IDepartmentService, DepartmentService>();
builder.Services.AddScoped<IFolderMappingService, FolderMappingService>();

builder.Services.AddSingleton<DailyUserDeptSyncService>();
builder.Services.AddHostedService(provider => provider.GetRequiredService<DailyUserDeptSyncService>());

// =========================================================================
// 6. PIPELINE & MIDDLEWARE BUILD
// =========================================================================
var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var env = services.GetRequiredService<IWebHostEnvironment>();
    var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger("DatabaseInitializer");
    var db = services.GetRequiredService<AppDbContext>();

    if (!isMySql || env.IsDevelopment())
    {
        try
        {
            var cmplDb = services.GetRequiredService<CmplDbContext>();
            var hodDb = services.GetRequiredService<HodDbContext>();

            await AppDataSeeder.SeedIfNeededAsync(db, env, logger);

            var syncService = services.GetRequiredService<DailyUserDeptSyncService>();
            await syncService.TriggerSyncAsync(CancellationToken.None);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred during local database seed or data sync execution.");
        }
    }
    else
    {
        try
        {
            await db.Database.EnsureCreatedAsync();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while initializing the primary database tables.");
        }
    }
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
app.UseCors();

// =========================================================================
// 7. ENDPOINT MAPPINGS
// =========================================================================
app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");

app.Run();
