import type { ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { AppDataProvider } from '../../data/AppDataProvider';
import { useAppData } from '../../data/AppDataContext';
import { displayStreak, toLocalDateString } from '../../game/streak';
import { KoruMark, KowhaiwhaiBorder } from './Kowhaiwhai';
import ui from './ui.module.css';
import styles from './AppShell.module.css';

/** Question screens use the whole screen, so the tab bar steps out of the way. */
const ROUND_ROUTE = /^\/(review|play\/[^/]+\/[^/]+|unit\/[^/]+\/(practice|check|learn))\/?$/;

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      className={styles.icon}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

interface Tab {
  to: string;
  label: string;
  /** Other paths that count as being on this tab. */
  match: RegExp;
  icon: ReactNode;
}

const TABS: readonly Tab[] = [
  {
    to: '/home',
    label: 'Learn',
    match: /^\/(home|unit\/|practice|play\/)/,
    icon: (
      <Icon>
        <path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2V5Z" />
        <path d="M4 20a2 2 0 0 0 2 2h13v-4" />
      </Icon>
    ),
  },
  {
    to: '/review',
    label: 'Review',
    match: /^\/review/,
    icon: (
      <Icon>
        <path d="M21 12a9 9 0 1 1-3-6.7" />
        <path d="M21 4v5h-5" />
      </Icon>
    ),
  },
  {
    to: '/progress',
    label: 'Progress',
    match: /^\/progress/,
    icon: (
      <Icon>
        <path d="M5 20V10M12 20V4M19 20v-7" />
      </Icon>
    ),
  },
  {
    to: '/account',
    label: 'Account',
    match: /^\/account/,
    icon: (
      <Icon>
        <circle cx="12" cy="8" r="4" />
        <path d="M5 21a7 7 0 0 1 14 0" />
      </Icon>
    ),
  },
];

function TabBar() {
  const { pathname } = useLocation();
  const { dueCount } = useAppData();
  return (
    <nav className={styles.nav} aria-label="Main">
      {TABS.map((tab) => {
        const active = tab.match.test(pathname);
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={active ? `${styles.navLink} ${styles.active}` : styles.navLink}
            aria-current={active ? 'page' : undefined}
          >
            {tab.icon}
            <span>
              {tab.label}
              {tab.to === '/review' && dueCount > 0 && (
                <span className={styles.badge} aria-label={`${dueCount} due`}>
                  {dueCount}
                </span>
              )}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}

function Header() {
  const { profile } = useAppData();
  const streak = profile ? displayStreak(profile, toLocalDateString(new Date())) : 0;

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

function Shell() {
  const { pathname } = useLocation();
  const showTabs = !ROUND_ROUTE.test(pathname);

  return (
    <div className={showTabs ? styles.withTabs : styles.shell}>
      <Header />
      {showTabs && <TabBar />}
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
    </div>
  );
}

export function AppShell() {
  return (
    <AppDataProvider>
      <Shell />
    </AppDataProvider>
  );
}
