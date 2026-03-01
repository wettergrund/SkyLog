import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAircraft } from '../api/aircraft';

export function useCreateAircraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAircraft,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aircraft'] });
    },
  });
}
