namespace MyFlightbook.Api.Models;

public enum AircraftInstanceType
{
    RealAircraft = 1,
    UncertifiedSimulator = 2,
    CertifiedATD = 3,
    CertifiedFTD = 4,
    CertifiedSim = 5
}

public enum PilotRole { None = 0, PIC = 1, SIC = 2, CFI = 3 }

public enum AvionicsTechnology { None = 0, Glass = 1, TAA = 2 }

public enum TurbineLevel
{
    Piston = 0,
    TurboProp = 1,
    Jet = 2,
    Electric = 3,
    Undefined = 4
}

public enum PropertyValueKind
{
    Integer = 0,
    Decimal = 1,
    Boolean = 2,
    Date = 3,
    DateTime = 4,
    String = 5
}
public enum AirportType
{
    Unknown = 0,
    Small = 1,
    Large = 2,
    Medium = 3,
    Heliport = 4,
    SeaplaneBase = 5,
    Balloonport = 6
}
