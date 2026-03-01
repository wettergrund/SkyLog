import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useQueryClient } from '@tanstack/react-query';
import { auth } from '../lib/firebase';
import { getMe } from '../api/auth';
import type { UserProfile } from '../types/auth';

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<UserProfile | null>(null);
  // Start true — Firebase resolves auth state asynchronously after page load.
  // Keeping it true until the first onAuthStateChanged fires prevents a
  // flash of the login page for already-authenticated users.
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Firebase user is signed in — fetch (or auto-provision) the API profile.
        try {
          const profile = await getMe();
          setUser(profile);
        } catch {
          // Token rejected or API unreachable — treat as signed out.
          setUser(null);
        }
      } else {
        // Firebase user signed out — clear profile and all cached queries.
        setUser(null);
        queryClient.clear();
      }
      setIsLoading(false);
    });

    return unsubscribe; // unsubscribes when AuthProvider unmounts
  }, [queryClient]);

  async function refetchUser(): Promise<void> {
    if (auth.currentUser) {
      const profile = await getMe();
      setUser(profile);
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, refetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
