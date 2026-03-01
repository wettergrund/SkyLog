import { useQuery } from '@tanstack/react-query';
import { getFlights } from '../api/flights';
import type { FlightQueryParams } from '../types/flights';

export function useFlights(params: FlightQueryParams = {}) {

  
  return useQuery({
    queryKey: ['flights', params],
    queryFn: () => getFlights(params),
    placeholderData: (prev) => prev,
  });
}
