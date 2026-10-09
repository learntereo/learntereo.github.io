import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../auth/AuthContext';
import { deleteMyAccount } from '../../data/profileRepo';
import { isDeleteConfirmed } from '../../lib/isDeleteConfirmed';
import { SaveProgress } from '../components/SaveProgress';
import ui from '../components/ui.module.css';
import styles from './Account.module.css';

export function Account() {
  const { user, isGuest, signOut } = useAuth();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guestSignOutOpen, setGuestSignOutOpen] = useState(false);

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

  if (isGuest) {
    return (
      <main className={ui.page}>
        <h1>Account</h1>
        <SaveProgress />

        <section className={`${ui.card} ${styles.dialog}`}>
          {!guestSignOutOpen ? (
            <button type="button" className={`${ui.button} ${ui.secondary}`} onClick={() => setGuestSignOutOpen(true)}>
              Sign out
            </button>
          ) : (
            <>
              <p>Your progress will be lost unless you save it first.</p>
              <div className={styles.actions}>
                <button type="button" className={`${ui.button} ${styles.dangerButton}`} onClick={() => void signOut()}>
                  Sign out anyway
                </button>
                <button type="button" className={`${ui.button} ${ui.secondary}`} onClick={() => setGuestSignOutOpen(false)}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </section>

        <section className={`${ui.card} ${styles.dialog} ${styles.danger}`}>
          <h2 className={styles.dangerTitle}>Start over</h2>
          <p>This permanently deletes your guest progress and signs you out. This cannot be undone.</p>
          {error && <p>{error}</p>}
          {!confirmOpen ? (
            <button type="button" className={`${ui.button} ${styles.dangerButton}`} onClick={() => setConfirmOpen(true)}>
              Start over
            </button>
          ) : (
            <div className={styles.actions}>
              <button type="button" className={`${ui.button} ${styles.dangerButton}`} disabled={deleting} onClick={() => void handleDelete()}>
                Yes, delete and start over
              </button>
              <button type="button" className={`${ui.button} ${ui.secondary}`} disabled={deleting} onClick={() => setConfirmOpen(false)}>
                Cancel
              </button>
            </div>
          )}
        </section>
      </main>
    );
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
