namespace MyFlightbook.Data.Models;

[Table("app_users")]
public class AppUser
{
    [Key]
    public int Id { get; set; }

    /// <summary>Firebase Authentication UID — the stable identifier from Firebase.</summary>
    [Required, MaxLength(128)]
    public string FirebaseUid { get; set; } = null!;

    [Required, MaxLength(255)]
    public string Email { get; set; } = null!;

    [MaxLength(100)]
    public string? FirstName { get; set; }

    [MaxLength(100)]
    public string? LastName { get; set; }

    /// <summary>Whether to display times as HH:MM instead of decimal hours.</summary>
    public bool UsesHHMM { get; set; }

    public bool IsInstructor { get; set; }
    
    public bool IsSuperUser { get; set; }

    [MaxLength(64)]
    public string? PreferredTimeZoneId { get; set; }

    /// <summary>Regulatory jurisdiction for currency calculations (FAA, EASA, CASA, etc.).</summary>
    [MaxLength(32)]
    public string CurrencyJurisdiction { get; set; } = "EASA";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastActivity { get; set; } = DateTime.UtcNow;

    public ICollection<Flight> Flights { get; set; } = new List<Flight>();
    public ICollection<UserAircraft> UserAircraft { get; set; } = new List<UserAircraft>();
}
