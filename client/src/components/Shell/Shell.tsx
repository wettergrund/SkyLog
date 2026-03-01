import { Link, Outlet } from 'react-router-dom';
import NavBar from '../NavBar/NavBar';
import styles from './Shell.module.css';

export default function Shell() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link to="/logbook" className={styles.brand}>MyFlightbook</Link>
        <div className={styles.nav}>
          <NavBar />
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
