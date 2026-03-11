import { useState, type FormEvent } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { FirebaseError } from 'firebase/app';
import { login, loginWithGoogle } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';
import GoogleSignInButton from '../../components/GoogleSignInButton/GoogleSignInButton';
import styles from './LandingPage.module.css';

const STATS = [
  { value: '12,400+', label: 'Pilots' },
  { value: '3.2M+',   label: 'Flights logged' },
  { value: '18.5M+',  label: 'Flight hours' },
];

const FEATURES = [
  {
    icon: '✈',
    title: 'Full logbook',
    desc: 'Log every flight with route, aircraft, conditions, and custom fields.',
  },
  {
    icon: '⏱',
    title: 'Currency tracking',
    desc: 'Stay current automatically. Get instant warnings before they lapse.',
  },
  {
    icon: '📊',
    title: 'Totals & reports',
    desc: 'See time by aircraft type, category, class, and instrument time at a glance.',
  },
  {
    icon: '✦',
    title: 'Always free',
    desc: 'No subscription, no paywalls. Your logbook, forever.',
  },
];

function firebaseErrorMessage(err: FirebaseError): string {
  switch (err.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait and try again.';
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

export default function LandingPage() {
  const { user, isLoading } = useAuth();

  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [error, setError]           = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && user) return <Navigate to="/logbook" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
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
      {/* ── Nav ── */}
      <header className={styles.nav}>
        <span className={styles.navBrand}>MyFlightbook</span>
        <Link to="/register" className={styles.navRegister}>Create account</Link>
      </header>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.badge}>Free forever</p>
          <h1 className={styles.headline}>
            Your pilot logbook,<br />
            <span className={styles.accent}>always with you.</span>
          </h1>
          <p className={styles.sub}>
            Log flights, track currency, and analyse your totals — from any device.
            No subscription required.
          </p>
          <div className={styles.heroCta}>
            <Link to="/register" className={styles.ctaPrimary}>Get started — it's free</Link>
          </div>
        </div>

        {/* ── Inline sign-in card ── */}
        <div className={styles.loginCard}>
          <p className={styles.loginTitle}>Already a pilot?</p>

          <GoogleSignInButton onClick={handleGoogle} disabled={submitting} label="Sign in with Google" />

          <div className={styles.divider}><span>or</span></div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label htmlFor="lp-email">Email</label>
              <input
                id="lp-email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                required autoComplete="email" disabled={submitting}
                placeholder="you@example.com"
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="lp-password">Password</label>
              <input
                id="lp-password" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                required autoComplete="current-password" disabled={submitting}
                placeholder="••••••••"
              />
            </div>

            {error && <ErrorMessage message={error} />}

            <button type="submit" className={styles.submit} disabled={submitting || isLoading}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className={styles.switchLink}>
            No account? <Link to="/register">Create one free</Link>
          </p>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className={styles.statsBar}>
        {STATS.map((s) => (
          <div key={s.label} className={styles.stat}>
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </section>

      {/* ── Features ── */}
      <section className={styles.features}>
        {FEATURES.map((f) => (
          <div key={f.title} className={styles.featureCard}>
            <span className={styles.featureIcon}>{f.icon}</span>
            <h3 className={styles.featureTitle}>{f.title}</h3>
            <p className={styles.featureDesc}>{f.desc}</p>
          </div>
        ))}
      </section>

      {/* ── Footer CTA ── */}
      <section className={styles.footerCta}>
        <h2 className={styles.footerHeadline}>Ready to fly smarter?</h2>
        <Link to="/register" className={styles.ctaPrimary}>Create your free account</Link>
      </section>

      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} MyFlightbook — free for all pilots</span>
      </footer>
    </div>
  );
}
