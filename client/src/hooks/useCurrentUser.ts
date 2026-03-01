import { useQuery } from '@tanstack/react-query';
import { auth } from '../lib/firebase';
import { getMe } from '../api/auth';
import { ApiError } from '../api/client';

/**
 * Fetches the current user's API profile via React Query.
 * Only runs when Firebase has an authenticated user.
 * Prefer useAuth() for most components — this hook is for manual refetches.
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getMe,
    enabled: !!auth.currentUser,
    retry: (failureCount, error) => {
      // Don't retry auth errors — they won't resolve by retrying.
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return false;
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000,
  });
}
