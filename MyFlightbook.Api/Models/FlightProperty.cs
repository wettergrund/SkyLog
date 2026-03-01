namespace MyFlightbook.Api.Models;

/// <summary>
/// A concrete custom property value for a specific flight.
/// Only one value column is populated depending on PropertyType.Kind.
/// </summary>
[Table("flight_properties")]
public class FlightProperty
{
    [Key]
    public int Id { get; set; }

    public int FlightId { get; set; }
    public Flight Flight { get; set; } = null!;

    public int PropertyTypeId { get; set; }
    public PropertyType PropertyType { get; set; } = null!;

    public int IntValue { get; set; }

    [Precision(8, 2)]
    public decimal DecValue { get; set; }

    public DateTime DateValue { get; set; }

    [MaxLength(4096)]
    public string? TextValue { get; set; }
}
