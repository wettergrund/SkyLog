import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hideAircraft } from '../api/aircraft';

export function useHideAircraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, hide }: { id: number; hide: boolean }) => hideAircraft(id, hide),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aircraft'] });
    },
  });
}
