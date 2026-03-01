namespace MyFlightbook.Api.Models;

/// <summary>
/// Owned entity — stored as columns in the Aircraft table.
/// Only meaningful for registered aircraft (InstanceType == RealAircraft).
/// </summary>
[Owned]
public class AircraftMaintenance
{
    public DateTime? LastAnnual { get; set; }
    public DateTime? LastTransponder { get; set; }
    public DateTime? LastStatic { get; set; }
    public DateTime? LastAltimeter { get; set; }
    public DateTime? LastELT { get; set; }
    public DateTime? LastVOR { get; set; }
    public DateTime? RegistrationExpiration { get; set; }

    [Precision(8, 2)]
    public decimal Last100 { get; set; }

    [Precision(8, 2)]
    public decimal LastOilChange { get; set; }

    [Precision(8, 2)]
    public decimal LastNewEngine { get; set; }

    [MaxLength(2048)]
    public string? Notes { get; set; }
}
