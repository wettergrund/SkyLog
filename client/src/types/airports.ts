export interface AirportResult {
  icao: string;
  iata: string | null;
  name: string;
  municipality: string | null;
  isoCountry: string | null;
  latitude: number | null;
  longitude: number | null;
}
