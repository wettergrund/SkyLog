import { useMutation, useQueryClient } from '@tanstack/react-query';
import { refreshAircraftImage } from '../api/aircraft';

export function useRefreshAircraftImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => refreshAircraftImage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aircraft'] });
    },
  });
}
