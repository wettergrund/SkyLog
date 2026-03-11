import { apiFetch } from './client';
import type { AircraftSummary, CategoryClassItem, CreateAircraftRequest, UpdateAircraftRequest } from '../types/aircraft';

export function getAircraft(): Promise<AircraftSummary[]> {
  return apiFetch<AircraftSummary[]>('/api/v1/aircraft');
}

export function getCategoryClasses(): Promise<CategoryClassItem[]> {
  return apiFetch<CategoryClassItem[]>('/api/v1/aircraft/categories');
}

export function createAircraft(request: CreateAircraftRequest): Promise<AircraftSummary> {
  return apiFetch<AircraftSummary>('/api/v1/aircraft', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export function updateAircraft(id: number, request: UpdateAircraftRequest): Promise<AircraftSummary> {
  return apiFetch<AircraftSummary>(`/api/v1/aircraft/${id}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  });
}

export function refreshAircraftImage(id: number): Promise<AircraftSummary> {
  return apiFetch<AircraftSummary>(`/api/v1/aircraft/${id}/refresh-image`, {
    method: 'POST',
  });
}

export function hideAircraft(id: number, hide: boolean): Promise<AircraftSummary> {
  return apiFetch<AircraftSummary>(`/api/v1/aircraft/${id}/hide`, {
    method: 'PATCH',
    body: JSON.stringify({ hide }),
  });
}
