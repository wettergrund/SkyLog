import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { updateFlight } from '../api/flights';
import type { CreateFlightRequest } from '../types/flights';

export function useUpdateFlight() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateFlightRequest }) =>
      updateFlight(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flights'] });
      navigate('/logbook');
    },
  });
}
