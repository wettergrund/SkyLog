import { NavLink } from 'react-router-dom';
import styles from './BottomNav.module.css';

export default function BottomNav() {
  return (
    <nav className={styles.nav}>
      <NavLink
        to="/logbook"
        className={({ isActive }) =>
          `${styles.item}${isActive ? ` ${styles.active}` : ''}`
        }
      >
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        <span className={styles.label}>Logbook</span>
      </NavLink>

      <NavLink
        to="/totals"
        className={({ isActive }) =>
          `${styles.item}${isActive ? ` ${styles.active}` : ''}`
        }
      >
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
        <span className={styles.label}>Totals</span>
      </NavLink>

      <NavLink
        to="/flights/new"
        className={({ isActive }) =>
          `${styles.fabLink}${isActive ? ` ${styles.fabActive}` : ''}`
        }
      >
        <span className={styles.fab}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </span>
        <span className={styles.label}>Log Flight</span>
      </NavLink>

      <NavLink
        to="/currency"
        className={({ isActive }) =>
          `${styles.item}${isActive ? ` ${styles.active}` : ''}`
        }
      >
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
        <span className={styles.label}>Currency</span>
      </NavLink>

    </nav>
  );
}
