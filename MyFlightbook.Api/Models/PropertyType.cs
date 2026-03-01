namespace MyFlightbook.Api.Models;

/// <summary>
/// Defines a custom property type that can be attached to flights
/// (e.g. "Passenger Names", "Flight Training Device ID", "Fuel Added").
/// </summary>
[Table("property_types")]
public class PropertyType
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(255)]
    public string Title { get; set; } = null!;

    [MaxLength(64)]
    public string? ShortTitle { get; set; }

    /// <summary>The underlying data type for this property's value.</summary>
    public PropertyValueKind Kind { get; set; }

    /// <summary>Optional .NET format string for displaying the value (e.g. "{0:F1} gal").</summary>
    [MaxLength(64)]
    public string? FormatString { get; set; }

    /// <summary>Bitmask of feature flags (favourite, BFR-related, IFR-related, etc.).</summary>
    public uint Flags { get; set; }

    [MaxLength(1024)]
    public string? Description { get; set; }

    public ICollection<FlightProperty> Properties { get; set; } = new List<FlightProperty>();
}
