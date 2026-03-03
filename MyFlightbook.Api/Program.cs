using FirebaseAdmin;
using FirebaseAdmin.Auth;
using Google.Apis.Auth.OAuth2;

//using Google.Apis.Auth.OAuth2;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MyFlightbook.Api.Data;
using MyFlightbook.Api.Middleware;
using MyFlightbook.Api.Repositories;
using MyFlightbook.Api.Services;

var builder = WebApplication.CreateBuilder(args);
var config  = builder.Configuration;

// ── Firebase Admin SDK ────────────────────────────────────────────────────────
// Used for server-side operations (token revocation, push, user management).
// Not required for basic JWT validation — that's handled by AddJwtBearer below.
string? saPath = config["Firebase:ServiceAccountPath"];
if (!string.IsNullOrEmpty(saPath) && File.Exists(saPath))
{
    FirebaseApp.Create(new AppOptions
    {
        Credential = GoogleCredential.FromFile(saPath)
    });

    Environment.SetEnvironmentVariable( "GOOGLE_APPLICATION_CREDENTIALS", saPath);
}
else if (Environment.GetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS") is not null)
{
    // Production: set GOOGLE_APPLICATION_CREDENTIALS env var to the service account path.
    FirebaseApp.Create(new AppOptions
    {
        Credential = GoogleCredential.GetApplicationDefault()
    });
}

// ── JWT Bearer — validates Firebase ID tokens ─────────────────────────────────
// Firebase ID tokens are standard JWTs. ASP.NET Core fetches Google's public
// signing keys automatically from the OIDC discovery endpoint.
string projectId = config["Firebase:ProjectId"]
    ?? throw new InvalidOperationException("Firebase:ProjectId is required in configuration.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.Authority = $"https://securetoken.google.com/{projectId}";
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer   = true,
            ValidIssuer      = $"https://securetoken.google.com/{projectId}",
            ValidateAudience = true,
            ValidAudience    = projectId,
            ValidateLifetime = true
        };
    });

builder.Services.AddAuthorization();

// ── EF Core + SQL Server ──────────────────────────────────────────────────────
string connStr = config.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("DefaultConnection is required in configuration.");

builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlServer(connStr));

// ── Repositories & Services ───────────────────────────────────────────────────
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddSingleton( FirebaseAuth.DefaultInstance );
builder.Services.AddScoped<IUserResolver, FirebaseUserResolver>();
builder.Services.AddHttpContextAccessor();

// ── Controllers & JSON ────────────────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.PropertyNamingPolicy =
            System.Text.Json.JsonNamingPolicy.CamelCase;
        o.JsonSerializerOptions.DefaultIgnoreCondition =
            System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

// ── Swagger ───────────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title   = "MyFlightbook API",
        Version = "v1",
        Description = "Paste a Firebase ID token into the Authorize dialog to test authenticated endpoints."
    });

    var bearerScheme = new OpenApiSecurityScheme
    {
        Name        = "Authorization",
        Type        = SecuritySchemeType.Http,
        Scheme      = "bearer",
        BearerFormat = "Firebase ID Token (JWT)",
        In          = ParameterLocation.Header,
        Description = "Obtain a Firebase ID token from the client and paste it here."
    };
    c.AddSecurityDefinition("Bearer", bearerScheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {{
        new OpenApiSecurityScheme
        {
            Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
        },
        Array.Empty<string>()
    }});
});

// ── CORS — allow the React SPA ────────────────────────────────────────────────
string[] allowedOrigins = config["Cors:AllowedOrigins"]?.Split(',', StringSplitOptions.TrimEntries)
    ?? ["http://localhost:5173"];

builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins(allowedOrigins)
     .AllowAnyMethod()
     .AllowAnyHeader()
     .AllowCredentials()));

// ─────────────────────────────────────────────────────────────────────────────

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<ExceptionMiddleware>();
app.UseHttpsRedirection();
app.UseCors();            // must be before UseAuthentication
app.UseAuthentication();  // reads the Bearer token
app.UseAuthorization();   // enforces [Authorize]
app.MapControllers();
app.Run();
