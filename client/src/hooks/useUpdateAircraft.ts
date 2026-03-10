import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateAircraft } from '../api/aircraft';
import type { UpdateAircraftRequest } from '../types/aircraft';

export function useUpdateAircraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAircraftRequest }) =>
      updateAircraft(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aircraft'] });
    },
  });
}
