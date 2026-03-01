import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteFlight } from '../api/flights';

export function useDeleteFlight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFlight,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flights'] });
    },
  });
}
