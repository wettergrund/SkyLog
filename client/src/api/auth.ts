import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { apiFetch } from './client';
import type { UserProfile, UpdateProfileRequest } from '../types/auth';

/**
 * Email/password sign-in via Firebase.
 * onAuthStateChanged in AuthContext handles the rest.
 */
export function login(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Google sign-in / sign-up via popup.
 * Works for both new and existing users — Firebase handles both cases.
 * After sign-in, the display name is synced to the API profile.
 */
export async function loginWithGoogle(): Promise<void> {
  const result = await signInWithPopup(auth, googleProvider);

  // Sync Google display name to our API on every Google sign-in.
  // FirebaseUserResolver auto-provisions the AppUser row if it's a new account.
  const displayName = result.user.displayName ?? '';
  const spaceIdx   = displayName.indexOf(' ');
  const firstName  = spaceIdx >= 0 ? displayName.slice(0, spaceIdx) : displayName;
  const lastName   = spaceIdx >= 0 ? displayName.slice(spaceIdx + 1) : '';

  if (firstName || lastName) {
    await updateMyProfile({ firstName: firstName || null, lastName: lastName || null });
  }
}

/**
 * Email/password registration via Firebase.
 * After sign-up, the name is saved to the API profile immediately
 * (before AuthContext's onAuthStateChanged re-fetches it).
 */
export async function register(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
): Promise<void> {
  await createUserWithEmailAndPassword(auth, email, password);
  // auth.currentUser is now set — save the name before the context re-fetches.
  if (firstName || lastName) {
    await updateMyProfile({ firstName: firstName || null, lastName: lastName || null });
  }
}

/**
 * Updates the current user's profile in the API.
 * All fields are optional — only provided fields are changed.
 */
export function updateMyProfile(data: UpdateProfileRequest): Promise<UserProfile> {
  return apiFetch<UserProfile>('/api/v1/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Signs out of Firebase. AuthContext clears the user profile automatically.
 */
export function logout() {
  return signOut(auth);
}

/**
 * Fetches (and auto-provisions) the current user's profile from our API.
 */
export function getMe(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/api/v1/auth/me');
}
