import { useEffect, useRef, useState, type FormEvent } from 'react';
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

/** Levels, example topics and the full unit lists, in the page itself so search engines and screen readers get them. Mirrored in vite.config.ts for the pre-render. */
function Levels() {
  const total = LEVELS.reduce((n, level) => n + unitsForLevel(level).length, 0);
  return (
    <section className={styles.section} aria-labelledby="levels-title">
      <h2 id="levels-title">Three levels</h2>
      <div className={styles.levelGrid}>
        {LEVELS.map((level) => {
          const levelUnits = unitsForLevel(level);
          return (
            <div key={level} className={styles.levelCard} data-testid="level-card">
              <h3>{LEVEL_LABEL[level]}</h3>
              <p className={styles.levelCount}>{levelUnits.length} units</p>
              <ul className={styles.chips}>
                {levelUnits.slice(0, 3).map((u) => (
                  <li key={u.id}>{u.title}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <details className={styles.allUnits}>
        <summary>See all {total} units</summary>
        <div className={styles.allUnitsBody}>
          {LEVELS.map((level) => (
            <div key={level}>
              <h3>{LEVEL_LABEL[level]}</h3>
              <ul className={styles.unitList}>
                {unitsForLevel(level).map((u) => (
                  <li key={u.id}>
                    {u.title} <span lang="mi">{u.titleMi}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}

function PepehaCard() {
  return (
    <section className={`${styles.section} ${styles.pepehaCard}`} aria-labelledby="pepeha-title">
      <h2 id="pepeha-title">Write your pepeha</h2>
      <p>Introduce yourself in te reo Māori. No sign-in needed.</p>
      <a className={styles.secondaryLink} href={`${import.meta.env.BASE_URL}pepeha/`}>
        Open the pepeha builder
      </a>
    </section>
  );
}

export function Landing() {
  const { session, loading, signInWithGoogle, signInWithPassword, signUpWithPassword, sendPasswordReset, continueAsGuest } =
    useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const signInRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showSignIn) signInRef.current?.focus();
  }, [showSignIn]);

  if (!loading && session) return <Navigate to="/home" replace />;

  async function handleGoogle() {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleGuest() {
    setStartError(null);
    setStarting(true);
    try {
      await continueAsGuest();
    } catch (err) {
      setStartError(errorMessage(err));
    } finally {
      setStarting(false);
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

      <header className={styles.hero}>
        <div className={styles.brand}>
          <KoruMark size={40} className={styles.mark} />
          <p className={styles.brandName} lang="mi">
            Ako
          </p>
        </div>
        <h1 className={styles.title}>
          Learn te reo <span lang="mi">Māori</span>
        </h1>
        <p className={styles.lead}>
          Short lessons that work on your phone, from your first <span lang="mi">kia ora</span> to full sentences.
        </p>
        {!isSupabaseConfigured && <p className={styles.error}>Configuration missing: sign-in is unavailable.</p>}
        <button type="button" className={styles.startButton} onClick={handleGuest} disabled={!isSupabaseConfigured || starting}>
          {starting ? 'Starting...' : 'Start learning'}
        </button>
        {startError && (
          <p className={styles.error} role="alert">
            {startError}
          </p>
        )}
        <button
          type="button"
          className={styles.textButton}
          aria-expanded={showSignIn}
          aria-controls="signin-card"
          onClick={() => setShowSignIn((v) => !v)}
        >
          I already have an account
        </button>
      </header>

      {showSignIn && (
      <div id="signin-card" ref={signInRef} tabIndex={-1} className={styles.card} aria-label="Sign in">
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
        <button type="button" className={styles.linkButton} onClick={() => setShowSignIn(false)}>
          Close
        </button>
      </div>
      )}

      <Levels />

      <PepehaCard />

      <p className={styles.footer}>
        <Link to="/privacy">Privacy</Link>
      </p>
    </main>
  );
}
