import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../auth/AuthContext';
import styles from './Landing.module.css';

export function ResetPassword() {
  const { session, loading, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await updatePassword(password);
      navigate('/home', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the password.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;

  if (!session) {
    return (
      <main className={styles.page}>
        <div className={styles.card}>
          <p className={styles.error}>
            This reset link is invalid or has expired. Request a new one from the sign-in page.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h2>Set a new password</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>
            New password
            <input
              className={styles.input}
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.submit} disabled={submitting}>
            Update password
          </button>
        </form>
      </div>
    </main>
  );
}
