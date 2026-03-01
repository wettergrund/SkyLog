namespace MyFlightbook.Api.Models;

/// <summary>
/// Join table between AppUser and Aircraft with per-user configuration.
/// Removing this record removes the aircraft from the user's hangar without
/// deleting the shared Aircraft record (other users may still reference it).
/// </summary>
[Table("user_aircraft")]
public class UserAircraft
{
    public int AppUserId { get; set; }
    public AppUser User { get; set; } = null!;

    public int AircraftId { get; set; }
    public Aircraft Aircraft { get; set; } = null!;

    public PilotRole RoleForPilot { get; set; } = PilotRole.None;
    public bool HideFromSelection { get; set; }

    [MaxLength(2048)]
    public string? PrivateNotes { get; set; }

    public bool IsRegistered { get; set; } = true;
    public AvionicsTechnology AvionicsTechnology { get; set; } = AvionicsTechnology.None;
}
