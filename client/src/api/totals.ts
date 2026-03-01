import { apiFetch } from './client';
import type { TotalsResponse } from '../types/totals';

export function getTotals(fq?: string): Promise<TotalsResponse> {
  const qs = new URLSearchParams();
  if (fq) qs.set('fq', fq);
  const query = qs.toString();
  return apiFetch<TotalsResponse>(`/api/v1/totals${query ? `?${query}` : ''}`);
}
