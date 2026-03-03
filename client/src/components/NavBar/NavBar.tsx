import { NavLink, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { logout } from '../../api/auth';
import styles from './NavBar.module.css';

export default function NavBar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleLogout() {
    try {
      await logout();
    } finally {
      queryClient.clear();
      navigate('/login', { replace: true });
    }
  }

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
        to="/flights/new"
        className={({ isActive }) =>
          `${styles.link}${isActive ? ` ${styles.active}` : ''}`
        }
      >
        Log Flight
      </NavLink>
            <NavLink
            
        to="/flights/new"
        className={({ isActive }) =>
          `${styles.link}${isActive ? ` ${styles.active}` : ''}`
        }
      >
        Admin
      </NavLink>
      <button className={styles.logoutBtn} onClick={handleLogout}>
        Sign out
      </button>
    </nav>
  );
}
