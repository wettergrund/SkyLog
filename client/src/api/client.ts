import { auth } from '../lib/firebase';

export class ApiError extends Error {
  constructor(
    public override message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // getIdToken() returns the cached token and silently refreshes it when it
  // is close to expiry — no manual token management needed.
  const token = await auth.currentUser?.getIdToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(path, { ...init, headers });
  const envelope = await res.json();

  if (!envelope.ok) {
    throw new ApiError(envelope.error ?? 'Unknown error', res.status);
  }

  return envelope.data as T;
}
