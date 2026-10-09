import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { getRound, type RoundRow } from '../../data/roundRepo';
import type { RoundSummary } from '../../game/types';
import { KoruFlourish } from '../components/Kowhaiwhai';
import ui from '../components/ui.module.css';
import { LEVEL_LABEL, MODE_LABEL } from '../labels';
import styles from './Results.module.css';

function summaryOf(round: RoundRow): RoundSummary {
  const state = round.state as { summary?: Partial<RoundSummary> } | null;
  return {
    newlyLearned: state?.summary?.newlyLearned ?? 0,
    unlockedIntermediate: state?.summary?.unlockedIntermediate ?? false,
    streak: state?.summary?.streak ?? 0,
  };
}

export function Results() {
  const { roundId } = useParams();
  const location = useLocation();
  // Right after a round ends, the finished round is passed along so the page works even before the save lands.
  const passed = (location.state as { round?: RoundRow } | null)?.round;
  const [fetched, setRound] = useState<RoundRow | null | undefined>(undefined);
  const round = passed && passed.id === roundId ? passed : fetched;

  useEffect(() => {
    if (!roundId || (passed && passed.id === roundId)) return;
    let cancelled = false;
    getRound(roundId)
      .then((row) => {
        if (!cancelled) setRound(row);
      })
      .catch(() => {
        if (!cancelled) setRound(null);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundId]);

  if (round === undefined) {
    return (
      <main className={ui.page}>
        <p role="status">Loading...</p>
      </main>
    );
  }
  if (round === null || round.status !== 'completed') {
    return (
      <main className={ui.page}>
        <div className={ui.card}>
          <h1>Round not found</h1>
          <Link className={ui.button} to="/home">
            Home
          </Link>
        </div>
      </main>
    );
  }

  const summary = summaryOf(round);
  const score = round.score ?? 0;

  return (
    <main className={ui.page}>
      {summary.unlockedIntermediate && (
        <section className={`${ui.card} ${styles.unlock}`} aria-labelledby="unlock-title">
          <KoruFlourish />
          <h2 id="unlock-title">
            <span lang="mi">Ka rawe!</span> Intermediate is unlocked
          </h2>
          <p>You have learned every Beginner item. The next level is ready for you.</p>
          <Link className={ui.button} to="/play/intermediate">
            Start Intermediate
          </Link>
        </section>
      )}

      <section className={`${ui.card} ${styles.score}`} aria-labelledby="results-title">
        <p className={ui.muted}>
          {LEVEL_LABEL[round.level]} &middot; {MODE_LABEL[round.mode]}
        </p>
        <h1 id="results-title">
          <span lang="mi">Ka pai!</span>
        </h1>
        <p className={styles.big} aria-label={`Score ${score} out of ${round.total}`}>
          {score} / {round.total}
        </p>
        <dl className={styles.facts}>
          <div>
            <dt>XP earned</dt>
            <dd>+{round.xp_earned}</dd>
          </div>
          <div>
            <dt>Day streak</dt>
            <dd>{summary.streak}</dd>
          </div>
          <div>
            <dt>Newly learned</dt>
            <dd>{summary.newlyLearned}</dd>
          </div>
        </dl>
      </section>

      <div className={ui.row}>
        <Link className={ui.button} to={`/play/${round.level}/${round.mode}`}>
          Play again
        </Link>
        <Link className={`${ui.button} ${ui.secondary}`} to="/home">
          Home
        </Link>
      </div>
    </main>
  );
}
