import styles from './Landing.module.css';

export function ConfigMissing() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1>Configuration missing</h1>
        <p>
          Ako needs <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to run. Copy{' '}
          <code>.env.example</code> to <code>.env.local</code> and fill them in, then restart the dev server. See{' '}
          <code>docs/SETUP.md</code> for details.
        </p>
      </div>
    </main>
  );
}
