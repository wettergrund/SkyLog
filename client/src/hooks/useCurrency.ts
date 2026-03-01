import { useQuery } from '@tanstack/react-query';
import { getCurrency } from '../api/currency';

export function useCurrency() {
  return useQuery({
    queryKey: ['currency'],
    queryFn: getCurrency,
    staleTime: 2 * 60 * 1000,
  });
}
