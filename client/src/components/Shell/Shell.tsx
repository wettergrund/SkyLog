import { Link, Outlet } from 'react-router-dom';
import NavBar from '../NavBar/NavBar';
import BottomNav from '../BottomNav/BottomNav';
import SettingsMenu from '../SettingsMenu/SettingsMenu';
import styles from './Shell.module.css';

export default function Shell() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link to="/logbook" className={styles.brand}>SkyLog</Link>
        <div className={styles.nav}>
          <NavBar />
        </div>
        <SettingsMenu />
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
