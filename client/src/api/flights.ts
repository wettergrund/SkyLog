import { auth } from '../lib/firebase';
import { apiFetch } from './client';
import type { FlightsPage, FlightQueryParams, CreateFlightRequest, Flight, ImportResult } from '../types/flights';

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

export function getFlight(id: number): Promise<Flight> {
  return apiFetch<Flight>(`/api/v1/flights/${id}`);
}

export function updateFlight(id: number, request: CreateFlightRequest): Promise<Flight> {
  return apiFetch<Flight>(`/api/v1/flights/${id}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  });
}

export async function importFlights(file: File): Promise<ImportResult> {
  const token = await auth.currentUser?.getIdToken();
  const form = new FormData();
  form.append('file', file);

  const res = await fetch('/api/v1/flights/import', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  const envelope = await res.json();
  if (!envelope.ok) {
    throw new Error(envelope.error ?? 'Import failed');
  }
  return envelope.data as ImportResult;
}

export async function exportFlights(): Promise<void> {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch('/api/v1/flights/export', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) throw new Error('Export failed');

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const disposition = res.headers.get('Content-Disposition') ?? '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  a.download = match?.[1] ?? 'flights.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
