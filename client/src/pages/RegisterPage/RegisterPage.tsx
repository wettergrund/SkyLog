import { useState, type FormEvent } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { FirebaseError } from 'firebase/app';
import { register, loginWithGoogle } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';
import GoogleSignInButton from '../../components/GoogleSignInButton/GoogleSignInButton';
import styles from './RegisterPage.module.css';

function firebaseErrorMessage(err: FirebaseError): string {
  switch (err.code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/popup-closed-by-user':
      return '';
    default:
      return err.message;
  }
}

export default function RegisterPage() {
  const { user, isLoading } = useAuth();

  const [firstName, setFirstName]   = useState('');
  const [lastName, setLastName]     = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [error, setError]           = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && user) return <Navigate to="/logbook" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await register(email, password, firstName.trim(), lastName.trim());
      // AuthContext picks up the Firebase state change and redirects automatically.
    } catch (err) {
      setError(err instanceof FirebaseError ? firebaseErrorMessage(err) : 'Registration failed.');
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
          <p>Create your account</p>
        </div>

        <GoogleSignInButton onClick={handleGoogle} disabled={submitting} label="Sign up with Google" />

        <div className={styles.divider}><span>or</span></div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.nameRow}>
            <div className={styles.field}>
              <label htmlFor="firstName">First name</label>
              <input
                id="firstName" type="text" value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name" disabled={submitting}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="lastName">Last name</label>
              <input
                id="lastName" type="text" value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name" disabled={submitting}
              />
            </div>
          </div>

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
              required autoComplete="new-password" minLength={8} disabled={submitting}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="confirm">Confirm password</label>
            <input
              id="confirm" type="password" value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required autoComplete="new-password" disabled={submitting}
            />
          </div>

          {error && <ErrorMessage message={error} />}

          <button type="submit" className={styles.submit} disabled={submitting || isLoading}>
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className={styles.switchLink}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
