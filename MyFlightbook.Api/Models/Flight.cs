namespace MyFlightbook.Api.Models;

[Table("flights")]
public class Flight
{
    [Key]
    public int Id { get; set; }

    public int AppUserId { get; set; }
    public AppUser User { get; set; } = null!;

    public int AircraftId { get; set; }
    public Aircraft Aircraft { get; set; } = null!;

    public DateTime Date { get; set; } = DateTime.UtcNow;

    [MaxLength(2048)]
    public string Route { get; set; } = string.Empty;
    public string From { get; set; } = string.Empty;
    public string To { get; set; } = string.Empty;

    [MaxLength(4096)]
    public string Comment { get; set; } = string.Empty;

    // ── Flight time buckets ───────────────────────────────────────────────────
    [Precision(8, 2)] public decimal TotalFlightTime { get; set; }
    [Precision(8, 2)] public decimal PIC { get; set; }
    [Precision(8, 2)] public decimal SIC { get; set; }
    [Precision(8, 2)] public decimal Dual { get; set; }
    [Precision(8, 2)] public decimal CFI { get; set; }
    [Precision(8, 2)] public decimal CrossCountry { get; set; }
    [Precision(8, 2)] public decimal Nighttime { get; set; }
    [Precision(8, 2)] public decimal IMC { get; set; }
    [Precision(8, 2)] public decimal SimulatedIFR { get; set; }
    [Precision(8, 2)] public decimal GroundSim { get; set; }

    // ── Counts ────────────────────────────────────────────────────────────────
    public int Approaches { get; set; }
    public int Landings { get; set; }
    public int FullStopLandings { get; set; }
    public int NightLandings { get; set; }
    public bool HoldingProcedures { get; set; }

    // ── Hobbs / block times (nullable — not all pilots record these) ──────────
    [Precision(8, 2)] public decimal? HobbsStart { get; set; }
    [Precision(8, 2)] public decimal? HobbsEnd { get; set; }
    public DateTime? EngineStart { get; set; }
    public DateTime? EngineEnd { get; set; }
    public DateTime? FlightStart { get; set; }
    public DateTime? FlightEnd { get; set; }

    // ── Metadata ──────────────────────────────────────────────────────────────
    public bool IsPublic { get; set; }

    /// <summary>When non-zero, overrides the aircraft's category/class for currency purposes.</summary>
    public int CatClassOverride { get; set; }

    /// <summary>Optional hex colour for map/chart display (6 hex digits, no '#').</summary>
    [MaxLength(6)]
    public string? FlightColorHex { get; set; }

    public ICollection<FlightProperty> Properties { get; set; } = new List<FlightProperty>();
}
