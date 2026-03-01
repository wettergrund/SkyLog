import { useState, type FormEvent } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { FirebaseError } from 'firebase/app';
import { login, loginWithGoogle } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';
import GoogleSignInButton from '../../components/GoogleSignInButton/GoogleSignInButton';
import styles from './LoginPage.module.css';

function firebaseErrorMessage(err: FirebaseError): string {
  switch (err.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many sign-in attempts. Please wait a moment and try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/popup-closed-by-user':
      return '';
    default:
      return err.message;
  }
}

export default function LoginPage() {
  const { user, isLoading } = useAuth();

  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && user) return <Navigate to="/logbook" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      // AuthContext picks up the Firebase state change and navigates automatically.
    } catch (err) {
      setError(err instanceof FirebaseError ? firebaseErrorMessage(err) : 'Sign in failed.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      const msg = err instanceof FirebaseError ? firebaseErrorMessage(err) : 'Google sign-in failed.';
      if (msg) setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <h1>MyFlightbook</h1>
        </div>

        <GoogleSignInButton onClick={handleGoogle} disabled={submitting} label="Sign in with Google" />

        <div className={styles.divider}><span>or</span></div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              required autoComplete="email" disabled={submitting}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              required autoComplete="current-password" disabled={submitting}
            />
          </div>

          {error && <ErrorMessage message={error} />}

          <button type="submit" className={styles.submit} disabled={submitting || isLoading}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className={styles.switchLink}>
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
