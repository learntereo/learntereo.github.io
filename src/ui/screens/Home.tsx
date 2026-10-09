import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../auth/AuthContext';
import { getProfile, type Profile } from '../../data/profileRepo';
import styles from './Home.module.css';

export function Home() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getProfile(user.id)
      .then(setProfile)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load your profile.'));
  }, [user]);

  const displayName = profile?.display_name ?? user?.email ?? 'learner';

  return (
    <main className={styles.page}>
      <h1 className={styles.greeting}>
        Kia ora, <span lang="mi">{displayName}</span>
      </h1>

      {error && <p>{error}</p>}

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{profile?.xp ?? 0}</span>
          <span className={styles.statLabel}>XP</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{profile?.current_streak ?? 0}</span>
          <span className={styles.statLabel}>Streak</span>
        </div>
      </div>

      <nav className={styles.nav}>
        <Link className={styles.navLink} to="/account">
          Account
        </Link>
      </nav>

      <button type="button" className={styles.signOut} onClick={() => void signOut()}>
        Sign out
      </button>
    </main>
  );
}
