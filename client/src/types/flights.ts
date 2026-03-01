export interface CustomProperty {
  propertyTypeID: number;
  caption: string | null;
  value: string;
}

export interface Flight {
  id: number;
  date: string;
  aircraftID: number;
  tailNumber: string;
  modelDisplay: string;

  from: string;
  to: string;
  comment: string;
  totalFlightTime: number;
  pic: number;
  sic: number;
  dual: number;
  cfi: number;
  crossCountry: number;
  nighttime: number;
  imc: number;
  simulatedIFR: number;
  groundSim: number;
  approaches: number;
  landings: number;
  fullStopLandings: number;
  nightLandings: number;
  hobbsStart: number;
  hobbsEnd: number;
  engineStart: string | null;
  engineEnd: string | null;
  flightStart: string | null;
  flightEnd: string | null;
  isPublic: boolean;
  hasFlightData: boolean;
  isSigned: boolean;
  customProperties: CustomProperty[];
}

export interface FlightsPage {
  flights: Flight[];
  totalCount: number;
  skip: number;
  limit: number;
  sortKey: string;
  sortDir: 'Ascending' | 'Descending';
}

export type SortDirection = 'Ascending' | 'Descending';

export interface FlightQueryParams {
  skip?: number;
  limit?: number;
  sortKey?: string;
  sortDir?: SortDirection;
  fq?: string;
}

export interface CreateFlightRequest {
  date: string;
  aircraftId: number;

  from?: string;
  to?: string;
  comment?: string;
  totalFlightTime: number;
  pic?: number;
  sic?: number;
  dual?: number;
  cfi?: number;
  crossCountry?: number;
  nighttime?: number;
  imc?: number;
  simulatedIFR?: number;
  groundSim?: number;
  approaches?: number;
  landings?: number;
  fullStopLandings?: number;
  nightLandings?: number;
  holdingProcedures?: boolean;
  isPublic?: boolean;
  hobbsStart?: number;
  hobbsEnd?: number;
}
