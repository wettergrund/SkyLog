namespace MyFlightbook.Api.Models;

/// <summary>
/// Lookup table for FAA/ICAO category and class combinations
/// (e.g. Airplane ASEL, Airplane AMEL, Rotorcraft Helicopter, etc.)
/// </summary>
[Table("category_classes")]
public class CategoryClass
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(128)]
    public string CatClass { get; set; } = null!;

    public ICollection<MakeModel> MakeModels { get; set; } = new List<MakeModel>();
}
