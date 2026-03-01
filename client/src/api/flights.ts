import { apiFetch } from './client';
import type { FlightsPage, FlightQueryParams, CreateFlightRequest, Flight } from '../types/flights';

export function getFlights(params: FlightQueryParams = {}): Promise<FlightsPage> {
  const qs = new URLSearchParams();
  if (params.skip !== undefined) qs.set('skip', String(params.skip));
  if (params.limit !== undefined) qs.set('limit', String(params.limit));
  if (params.sortKey) qs.set('sortKey', params.sortKey);
  if (params.sortDir) qs.set('sortDir', params.sortDir);
  if (params.fq) qs.set('fq', params.fq);

  const query = qs.toString();
  return apiFetch<FlightsPage>(`/api/v1/flights${query ? `?${query}` : ''}`);
}

export function deleteFlight(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/flights/${id}`, { method: 'DELETE' });
}

export function deleteFlights(ids: number[]): Promise<void> {
  return apiFetch<void>('/api/v1/flights/delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

export function createFlight(request: CreateFlightRequest): Promise<Flight> {
  return apiFetch<Flight>('/api/v1/flights', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}
