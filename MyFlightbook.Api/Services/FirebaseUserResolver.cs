namespace MyFlightbook.Api.Services;

/// <summary>
/// Maps the Firebase UID in the JWT's "sub" claim to an AppUser row.
/// On first sign-in the row is created automatically (no separate registration step).
/// </summary>
public class FirebaseUserResolver : IUserResolver
{
    private readonly AppDbContext _db;

    public FirebaseUserResolver(AppDbContext db) => _db = db;

    public async Task<AppUser> GetOrCreateAsync(ClaimsPrincipal principal)
    {
        // Firebase stores the user's UID in the standard JWT "sub" claim.
        string uid = principal.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("Missing Firebase UID in token.");

        // Firebase puts the verified email in "email" — not in ClaimTypes.Email for all providers.
        string? email = principal.FindFirstValue("email")
                     ?? principal.FindFirstValue(ClaimTypes.Email);

        AppUser? user = await _db.Users
            .FirstOrDefaultAsync(u => u.FirebaseUid == uid);

        if (user is null)
        {
            user = new AppUser
            {
                FirebaseUid = uid,
                Email = email ?? string.Empty,
                CreatedAt = DateTime.UtcNow,
                LastActivity = DateTime.UtcNow
            };
            _db.Users.Add(user);
        }
        else
        {
            user.LastActivity = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return user;
    }
}
