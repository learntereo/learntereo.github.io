import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router';
import { useAuth } from '../../auth/AuthContext';
import { unitsForLevel } from '../../content/content';
import { LEVELS } from '../../game/types';
import { isSupabaseConfigured } from '../../data/supabaseClient';
import { KoruMark, KowhaiwhaiBorder } from '../components/Kowhaiwhai';
import { LEVEL_LABEL } from '../labels';
import styles from './Landing.module.css';

type Mode = 'signin' | 'signup' | 'forgot';

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Please try again.';
}

/** Plain words about the course, in the page itself so search engines and screen readers get them. Mirrored in vite.config.ts for the pre-render. */
function AboutAko() {
  return (
    <section className={styles.about} aria-labelledby="about-title">
      <h2 id="about-title">
        Learn te reo <span lang="mi">Māori</span>, free
      </h2>
      <p>
        Ako is a free way to learn te reo <span lang="mi">Māori</span>. Short lessons that work on your phone, from beginner to advanced. Vocabulary,
        sentences and pronunciation, made in New Zealand.
      </p>
      <div className={styles.levels}>
        {LEVELS.map((level) => (
          <div key={level}>
            <h3>{LEVEL_LABEL[level]}</h3>
            <ul className={styles.unitList}>
              {unitsForLevel(level).map((u) => (
                <li key={u.id}>
                  {u.title} (<span lang="mi">{u.titleMi}</span>)
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p>
        <a href={`${import.meta.env.BASE_URL}pepeha/`}>Pepeha builder</a>
      </p>
    </section>
  );
}

export function Landing() {
  const { session, loading, signInWithGoogle, signInWithPassword, signUpWithPassword, sendPasswordReset } =
    useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && session) return <Navigate to="/home" replace />;

  async function handleGoogle() {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await signInWithPassword(email, password);
      } else if (mode === 'signup') {
        await signUpWithPassword(email, password);
        setNotice('Check your email to confirm your account.');
      } else {
        await sendPasswordReset(email);
        setNotice('Check your email for a password reset link.');
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <KowhaiwhaiBorder className={styles.topBorder} />

      <div className={styles.brand}>
        <KoruMark size={44} className={styles.mark} />
        <h1 className={styles.brandName} lang="mi">
          Ako
        </h1>
        <p className={styles.tagline}>Ako: learn te reo Māori, one kupu at a time.</p>
      </div>

      {!isSupabaseConfigured && <p className={styles.error}>Configuration missing: sign-in is unavailable.</p>}

      <div className={styles.card}>
        <button type="button" className={styles.googleButton} onClick={handleGoogle} disabled={!isSupabaseConfigured}>
          Continue with Google
        </button>

        <div className={styles.divider}>or</div>

        {mode !== 'forgot' && (
          <div className={styles.tabs}>
            <button
              type="button"
              className={mode === 'signin' ? `${styles.tab} ${styles.tabActive}` : styles.tab}
              onClick={() => setMode('signin')}
            >
              Sign in
            </button>
            <button
              type="button"
              className={mode === 'signup' ? `${styles.tab} ${styles.tabActive}` : styles.tab}
              onClick={() => setMode('signup')}
            >
              Sign up
            </button>
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>
            Email
            <input
              className={styles.input}
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          {mode !== 'forgot' && (
            <label className={styles.label}>
              Password
              <input
                className={styles.input}
                type="password"
                required
                minLength={6}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          )}

          {error && <p className={styles.error}>{error}</p>}
          {notice && <p className={styles.notice}>{notice}</p>}

          <button type="submit" className={styles.submit} disabled={!isSupabaseConfigured || submitting}>
            {mode === 'signin' && 'Sign in'}
            {mode === 'signup' && 'Sign up'}
            {mode === 'forgot' && 'Send reset link'}
          </button>

          {mode === 'signin' && (
            <button type="button" className={styles.linkButton} onClick={() => setMode('forgot')}>
              Forgot password?
            </button>
          )}
          {mode === 'forgot' && (
            <button type="button" className={styles.linkButton} onClick={() => setMode('signin')}>
              Back to sign in
            </button>
          )}
        </form>
      </div>

      <AboutAko />

      <p className={styles.footer}>
        <Link to="/privacy">Privacy</Link>
      </p>
    </main>
  );
}
