namespace MyFlightbook.Api.Controllers;

/// <summary>
/// Auth endpoints for the React SPA.
///
/// Firebase handles sign-in and sign-out on the client — no login/logout endpoints here.
/// The SPA obtains a Firebase ID token and sends it as: Authorization: Bearer {token}
///
/// GET  /api/v1/auth/me       — returns (and auto-provisions) the current user's profile
/// PUT  /api/v1/auth/profile  — updates display preferences
/// </summary>
[ApiController]
[Route("api/v1/auth")]
public class AuthController : ApiControllerBase
{
    public AuthController(IUserResolver userResolver) : base(userResolver) { }

    /// <summary>
    /// Returns the current user's profile.
    /// On the very first request after Firebase sign-up, this creates the DB record.
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        AppUser user = await CurrentUserAsync();
        return ApiOk(UserDto.From(user));
    }

    /// <summary>
    /// Updates mutable profile preferences (name, time format, time zone, etc.).
    /// All fields are optional — omit a field to leave it unchanged.
    /// </summary>
    [HttpPut("profile")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile(
        [FromBody] UpdateProfileRequest request,
        [FromServices] AppDbContext db)
    {
        AppUser user = await CurrentUserAsync();

        if (request.FirstName is not null)          user.FirstName = request.FirstName;
        if (request.LastName is not null)           user.LastName = request.LastName;
        if (request.UsesHHMM is not null)           user.UsesHHMM = request.UsesHHMM.Value;
        if (request.IsInstructor is not null)       user.IsInstructor = request.IsInstructor.Value;
        if (request.PreferredTimeZoneId is not null) user.PreferredTimeZoneId = request.PreferredTimeZoneId;
        if (request.CurrencyJurisdiction is not null) user.CurrencyJurisdiction = request.CurrencyJurisdiction;

        await db.SaveChangesAsync();
        return ApiOk(UserDto.From(user));
    }
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record UserDto(
    int Id,
    string Email,
    string? FirstName,
    string? LastName,
    string FullName,
    bool UsesHHMM,
    bool IsInstructor,
    string? PreferredTimeZoneId,
    string CurrencyJurisdiction,
    DateTime CreatedAt)
{
    public static UserDto From(AppUser u) => new(
        u.Id,
        u.Email,
        u.FirstName,
        u.LastName,
        string.Join(" ", new[] { u.FirstName, u.LastName }.Where(s => !string.IsNullOrEmpty(s))),
        u.UsesHHMM,
        u.IsInstructor,
        u.PreferredTimeZoneId,
        u.CurrencyJurisdiction,
        u.CreatedAt);
}

public record UpdateProfileRequest(
    string? FirstName,
    string? LastName,
    bool? UsesHHMM,
    bool? IsInstructor,
    string? PreferredTimeZoneId,
    string? CurrencyJurisdiction);
