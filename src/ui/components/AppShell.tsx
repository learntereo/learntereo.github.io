import { Link, NavLink, Outlet } from 'react-router';
import { AppDataProvider } from '../../data/AppDataProvider';
import { useAppData } from '../../data/AppDataContext';
import { displayStreak, toLocalDateString } from '../../game/streak';
import { KoruMark, KowhaiwhaiBorder } from './Kowhaiwhai';
import ui from './ui.module.css';
import styles from './AppShell.module.css';

function Header() {
  const { profile } = useAppData();
  const streak = profile ? displayStreak(profile, toLocalDateString(new Date())) : 0;
  const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? `${styles.navLink} ${styles.active}` : styles.navLink);

  return (
    <header className={styles.header}>
      <div className={styles.top}>
        <Link to="/home" className={styles.brand}>
          <KoruMark size={28} />
          <span lang="mi">Ako</span>
        </Link>
        <div className={styles.stats} aria-label="Your stats">
          <span className={styles.stat}>
            <strong>{profile?.xp ?? 0}</strong> XP
          </span>
          <span className={styles.stat}>
            <strong>{streak}</strong> day streak
          </span>
        </div>
      </div>
      <nav className={styles.nav} aria-label="Main">
        <NavLink to="/home" className={navClass}>
          Home
        </NavLink>
        <NavLink to="/progress" className={navClass}>
          Progress
        </NavLink>
        <NavLink to="/account" className={navClass}>
          Account
        </NavLink>
      </nav>
      <KowhaiwhaiBorder height={20} />
    </header>
  );
}

function Gate() {
  const { status, reload } = useAppData();

  if (status === 'loading') {
    return (
      <main className={ui.page}>
        <p role="status">Loading your progress...</p>
      </main>
    );
  }
  if (status === 'error') {
    return (
      <main className={ui.page}>
        <div className={ui.card}>
          <h1>Something went wrong</h1>
          <p>We could not load your progress.</p>
          <button type="button" className={ui.button} onClick={() => void reload()}>
            Try again
          </button>
        </div>
      </main>
    );
  }
  return <Outlet />;
}

export function AppShell() {
  return (
    <AppDataProvider>
      <Header />
      <Gate />
      <footer className={styles.footer}>
        <p>
          The content in Ako has not yet been reviewed by a fluent speaker of te reo Māori. If something matters, please
          check it with a <span lang="mi">kaiako</span> (teacher).
        </p>
        <p>
          <Link to="/privacy">Privacy</Link>
        </p>
      </footer>
    </AppDataProvider>
  );
}
