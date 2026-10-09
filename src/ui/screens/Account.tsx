import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../auth/AuthContext';
import { deleteMyAccount } from '../../data/profileRepo';
import { isDeleteConfirmed } from '../../lib/isDeleteConfirmed';
import ui from '../components/ui.module.css';
import styles from './Account.module.css';

export function Account() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await deleteMyAccount();
      await signOut();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete your account.');
      setDeleting(false);
    }
  }

  return (
    <main className={ui.page}>
      <h1>Account</h1>
      <p className={styles.email}>Signed in as {user?.email}.</p>

      <div className={styles.actions}>
        <button type="button" className={`${ui.button} ${ui.secondary}`} onClick={() => void signOut()}>
          Sign out
        </button>
      </div>

      <section className={`${ui.card} ${styles.dialog} ${styles.danger}`}>
        <h2 className={styles.dangerTitle}>Delete my account and data</h2>
        <p>This permanently deletes your account, progress, round history and streak. This cannot be undone.</p>

        {!confirmOpen && (
          <button type="button" className={`${ui.button} ${styles.dangerButton}`} onClick={() => setConfirmOpen(true)}>
            Delete my account and data
          </button>
        )}

        {confirmOpen && (
          <>
            <label className={styles.field}>
              Type DELETE to confirm
              <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
            </label>
            {error && <p>{error}</p>}
            <button
              type="button"
              className={`${ui.button} ${styles.dangerButton}`}
              disabled={!isDeleteConfirmed(confirmText) || deleting}
              onClick={() => void handleDelete()}
            >
              Permanently delete
            </button>
            <button
              type="button"
              className={`${ui.button} ${ui.secondary}`}
              onClick={() => setConfirmOpen(false)}
              disabled={deleting}
            >
              Cancel
            </button>
          </>
        )}
      </section>
    </main>
  );
}
