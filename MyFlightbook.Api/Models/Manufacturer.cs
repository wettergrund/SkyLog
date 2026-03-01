namespace MyFlightbook.Api.Models;

[Table("manufacturers")]
public class Manufacturer
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(255)]
    public string ManufacturerName { get; set; } = null!;

    public ICollection<MakeModel> MakeModels { get; set; } = new List<MakeModel>();
}
