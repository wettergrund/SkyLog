import { useQuery } from '@tanstack/react-query';
import { getTotals } from '../api/totals';

export function useTotals(fq?: string) {
  return useQuery({
    queryKey: ['totals', fq],
    queryFn: () => getTotals(fq),
    staleTime: 2 * 60 * 1000,
  });
}
