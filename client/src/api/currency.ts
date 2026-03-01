import { apiFetch } from './client';
import type { CurrencyItem } from '../types/currency';

export function getCurrency(): Promise<CurrencyItem[]> {
  return apiFetch<CurrencyItem[]>('/api/v1/currency');
}
