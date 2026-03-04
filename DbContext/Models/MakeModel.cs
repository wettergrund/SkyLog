
namespace MyFlightbook.Data.Models;

[Table("make_models")]
public class MakeModel
{
    [Key]
    public int Id { get; set; }

    public int ManufacturerId { get; set; }
    public Manufacturer Manufacturer { get; set; } = null!;

    public int CategoryClassId { get; set; }
    public CategoryClass CategoryClass { get; set; } = null!;

    [Required, MaxLength(255)]
    public string Model { get; set; } = null!;

    [MaxLength(255)]
    public string? ModelName { get; set; }

    [MaxLength(255)]
    public string? TypeName { get; set; }

    [MaxLength(255)]
    public string? FamilyName { get; set; }

    [MaxLength(32)]
    public string? ArmyMDS { get; set; }

    // Performance characteristics
    public bool IsComplex { get; set; }
    public bool IsHighPerf { get; set; }
    public bool Is200HP { get; set; }
    public bool IsTailWheel { get; set; }
    public bool IsRetract { get; set; }
    public bool IsConstantProp { get; set; }
    public bool HasFlaps { get; set; }
    public TurbineLevel EngineType { get; set; } = TurbineLevel.Piston;
    public bool IsMotorGlider { get; set; }
    public bool IsMultiEngineHelicopter { get; set; }
    public bool IsCertifiedSinglePilot { get; set; }

    public ICollection<Aircraft> Aircraft { get; set; } = new List<Aircraft>();
}
