import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFlight } from '../api/flights';

export function useCreateFlight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFlight,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flights'] });
    },
  });
}
