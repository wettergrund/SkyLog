namespace MyFlightbook.Api.Models;

[Table("aircraft")]
public class Aircraft
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(32)]
    public string TailNumber { get; set; } = null!;

    public int MakeModelId { get; set; }
    public MakeModel MakeModel { get; set; } = null!;

    public AircraftInstanceType InstanceType { get; set; } = AircraftInstanceType.RealAircraft;

    public bool IsLocked { get; set; }

    [MaxLength(2048)]
    public string? PublicNotes { get; set; }

    [MaxLength(255)]
    public string? DefaultImage { get; set; }

    [MaxLength(16)]
    public string? ICAO { get; set; }

    public DateTime? GlassUpgradeDate { get; set; }
    public int Version { get; set; }
    public int Revision { get; set; }

    /// <summary>Maintenance dates/hours — stored as owned columns in this table.</summary>
    public AircraftMaintenance Maintenance { get; set; } = new();

    public ICollection<UserAircraft> UserAircraft { get; set; } = new List<UserAircraft>();
    public ICollection<Flight> Flights { get; set; } = new List<Flight>();
}
