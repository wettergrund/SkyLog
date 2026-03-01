import { useQuery } from '@tanstack/react-query';
import { getAircraft } from '../api/aircraft';

export function useAircraft() {
  return useQuery({
    queryKey: ['aircraft'],
    queryFn: getAircraft,
    staleTime: 5 * 60 * 1000,
  });
}
