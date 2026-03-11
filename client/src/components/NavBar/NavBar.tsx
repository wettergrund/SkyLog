import { NavLink } from 'react-router-dom';
import styles from './NavBar.module.css';

export default function NavBar() {
  return (
    <nav className={styles.nav}>
      <NavLink
        to="/logbook"
        className={({ isActive }) =>
          `${styles.link}${isActive ? ` ${styles.active}` : ''}`
        }
      >
        Logbook
      </NavLink>
      <NavLink
        to="/totals"
        className={({ isActive }) =>
          `${styles.link}${isActive ? ` ${styles.active}` : ''}`
        }
      >
        Totals
      </NavLink>
      <NavLink
        to="/currency"
        className={({ isActive }) =>
          `${styles.link}${isActive ? ` ${styles.active}` : ''}`
        }
      >
        Currency
      </NavLink>
      <NavLink
        to="/hangar"
        className={({ isActive }) =>
          `${styles.link}${isActive ? ` ${styles.active}` : ''}`
        }
      >
        Hangar
      </NavLink>
      <NavLink
        to="/flights/new"
        className={({ isActive }) =>
          `${styles.link} ${styles.ctaLink}${isActive ? ` ${styles.active}` : ''}`
        }
      >
        Log Flight
      </NavLink>
    </nav>
  );
}
