import { useQuery } from '@tanstack/react-query';
import { getFlight } from '../api/flights';

export function useGetFlight(id: number) {
  return useQuery({
    queryKey: ['flights', id],
    queryFn: () => getFlight(id),
    enabled: !!id,
  });
}
