import { apiFetch } from './client';
import type { AirportResult } from '../types/airports';

export function searchAirports(q: string): Promise<AirportResult[]> {
  return apiFetch<AirportResult[]>(
    `/api/v1/airports/search?q=${encodeURIComponent(q)}`
  );
}
