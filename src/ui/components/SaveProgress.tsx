import { useState, type FormEvent } from 'react';
import { useAuth } from '../../auth/AuthContext';
import ui from './ui.module.css';
import styles from './SaveProgress.module.css';

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Please try again.';
}

/** How a guest keeps their progress: link Google, or add an email and password. */
export function SaveProgress() {
  const { saveWithEmail, saveWithGoogle, googleLinkConflict, dismissGoogleLinkConflict, switchToGoogleAccount } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSwitch, setConfirmSwitch] = useState(false);

  async function handleGoogle() {
    setError(null);
    try {
      await saveWithGoogle();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleSwitch() {
    setError(null);
    try {
      await switchToGoogleAccount();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleEmail(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      await saveWithEmail(email, password);
      setNotice('Check your email to finish saving your progress.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={`${ui.card} ${styles.save}`} aria-labelledby="save-title">
      <h2 id="save-title">Save your progress</h2>
      <p>You&apos;re trying Ako as a guest. Save your progress so you don&apos;t lose it.</p>

      {googleLinkConflict && (
        <div className={styles.conflict} role="alert">
          <p>
            That Google account already has Ako progress. Signing into it will leave this guest progress behind.
          </p>
          {!confirmSwitch ? (
            <div className={ui.row}>
              <button type="button" className={ui.button} onClick={() => setConfirmSwitch(true)}>
                Sign in to that account
              </button>
              <button type="button" className={`${ui.button} ${ui.secondary}`} onClick={dismissGoogleLinkConflict}>
                Keep this progress
              </button>
            </div>
          ) : (
            <>
              <p>Your guest progress will be lost. Sign in to that account?</p>
              <div className={ui.row}>
                <button type="button" className={ui.button} onClick={() => void handleSwitch()}>
                  Yes, sign in
                </button>
                <button type="button" className={`${ui.button} ${ui.secondary}`} onClick={() => setConfirmSwitch(false)}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <button type="button" className={ui.button} onClick={() => void handleGoogle()}>
        Save with Google
      </button>

      <form className={styles.form} onSubmit={(e) => void handleEmail(e)}>
        <label className={styles.field}>
          Email
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className={styles.field}>
          Password
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className={styles.error}>{error}</p>}
        {notice && <p className={styles.notice}>{notice}</p>}
        <button type="submit" className={`${ui.button} ${ui.secondary}`} disabled={submitting}>
          Save with email
        </button>
      </form>
    </section>
  );
}
