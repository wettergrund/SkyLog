namespace MyFlightbook.Api.Services;

/// <summary>
/// Resolves the Firebase-authenticated principal to a local AppUser record,
/// creating the record on first login (auto-provisioning).
/// </summary>
public interface IUserResolver
{
    Task<AppUser> GetOrCreateAsync(ClaimsPrincipal principal);
}
