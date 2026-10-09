import { Link } from 'react-router';
import styles from './Home.module.css';

export function Privacy() {
  return (
    <main className={styles.page}>
      <h1>Privacy</h1>
      <p>
        Ako stores the minimum needed to save your progress: your name and email address (from Google or from your
        email/password sign-up), your item progress (which words and sentences you have learned), your round history
        (scores, modes and XP) and your streak.
      </p>
      <p>
        This data is stored with Supabase in the Asia-Pacific region. It is never sold or shared with third parties,
        and it is used only to run Ako for you.
      </p>
      <p>
        You can delete your account and all associated data at any time from the Account screen. Deleting your
        account is permanent and cannot be undone.
      </p>
      <p>
        Ako&apos;s word and sentence content has not yet been reviewed by a fluent te reo
        Māori speaker. Please treat it as a learning aid, not an authoritative source.
      </p>
      <p>
        <Link to="/">Back to sign in</Link>
      </p>
    </main>
  );
}
