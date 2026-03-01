import { apiFetch } from './client';
import type { AircraftSummary, CategoryClassItem, CreateAircraftRequest } from '../types/aircraft';

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
