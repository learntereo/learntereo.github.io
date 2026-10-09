import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { getItem, getUnit, nextUnit } from '../../content/content';
import { useAppData } from '../../data/AppDataContext';
import { getRound, type RoundRow } from '../../data/roundRepo';
import type { Item, RoundSummary, Unit } from '../../game/types';
import { passMark } from '../../game/unitRound';
import { KoruFlourish } from '../components/Kowhaiwhai';
import ui from '../components/ui.module.css';
import { LEVEL_LABEL, ROUND_MODE_LABEL } from '../labels';
import styles from './Results.module.css';

function summaryOf(round: RoundRow): RoundSummary {
  const state = round.state as { summary?: Partial<RoundSummary> } | null;
  return {
    newlyLearned: state?.summary?.newlyLearned ?? 0,
    streak: state?.summary?.streak ?? 0,
    unitCheck: state?.summary?.unitCheck,
    missedItemIds: state?.summary?.missedItemIds,
  };
}

function MissedList({ ids }: { ids: readonly string[] }) {
  const items = ids.map((id) => getItem(id)).filter((i): i is Item => i !== undefined);
  if (items.length === 0) return null;
  return (
    <section className={ui.card} aria-labelledby="missed-title">
      <h2 id="missed-title">Words to revisit ({items.length})</h2>
      <ul className={styles.missed}>
        {items.map((item) => (
          <li key={item.id}>
            <span className={styles.missedMi} lang="mi">
              {item.mi}
            </span>
            <span className={ui.muted}>{item.en[0]}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function UnitActions({ round, unit, summary }: { round: RoundRow; unit: Unit; summary: RoundSummary }) {
  const { statuses } = useAppData();
  const isCheck = round.mode === 'unit_check';
  const passed = summary.unitCheck?.passed === true;
  const next = nextUnit(unit);
  const nextOpen = next !== undefined && statuses.get(next.id)?.state !== 'locked';

  return (
    <div className={ui.row}>
      {isCheck && passed && next && nextOpen && (
        <Link className={ui.button} to={`/unit/${next.id}`}>
          Next unit
        </Link>
      )}
      {isCheck && !passed && (
        <Link className={ui.button} to={`/unit/${unit.id}/practice`}>
          Practise again
        </Link>
      )}
      {!isCheck && (
        <>
          <Link className={ui.button} to={`/unit/${unit.id}/check`}>
            Take the Kiwiz
          </Link>
          <Link className={`${ui.button} ${ui.secondary}`} to={`/unit/${unit.id}/practice`}>
            Practise again
          </Link>
        </>
      )}
      {isCheck && !passed && (
        <Link className={`${ui.button} ${ui.secondary}`} to={`/unit/${unit.id}/check`}>
          Try the Kiwiz again
        </Link>
      )}
      <Link className={`${ui.button} ${ui.secondary}`} to={`/unit/${unit.id}`}>
        Back to unit
      </Link>
      <Link className={`${ui.button} ${ui.secondary}`} to="/home">
        Path
      </Link>
    </div>
  );
}

export function Results() {
  const { roundId } = useParams();
  const location = useLocation();
  // Right after a round ends, the finished round is passed along so the page works even before the save lands.
  const passedRound = (location.state as { round?: RoundRow } | null)?.round;
  const [fetched, setRound] = useState<RoundRow | null | undefined>(undefined);
  const round = passedRound && passedRound.id === roundId ? passedRound : fetched;
  const { dueCount } = useAppData();

  useEffect(() => {
    if (!roundId || (passedRound && passedRound.id === roundId)) return;
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
  const unit = getUnit(round.unit_id ?? undefined);
  const check = summary.unitCheck;
  const isCheck = round.mode === 'unit_check';
  const next = unit ? nextUnit(unit) : undefined;
  const opened = check?.nextUnitId ? getUnit(check.nextUnitId) : undefined;

  return (
    <main className={ui.page}>
      {isCheck && check?.passed && unit && (
        <section className={`${ui.card} ${styles.unlock}`} aria-labelledby="pass-title">
          <KoruFlourish />
          <h2 id="pass-title">
            <span lang="mi">Ka rawe!</span> {check.firstCompletion ? 'Unit complete' : 'Kiwiz passed'}
          </h2>
          <p>
            You passed the <strong>{unit.title}</strong> Kiwiz with {score} out of {round.total}.
          </p>
          {opened ? (
            <p>
              The next unit is open: <strong>{opened.title}</strong>.
            </p>
          ) : next === undefined ? (
            <p>That is the last unit for now. More are on the way.</p>
          ) : null}
        </section>
      )}

      <section className={`${ui.card} ${styles.score}`} aria-labelledby="results-title">
        <p className={ui.muted}>
          {round.mode === 'review' ? 'Review' : `${unit ? unit.title : LEVEL_LABEL[round.level]} · ${ROUND_MODE_LABEL[round.mode]}`}
        </p>
        <h1 id="results-title">
          {isCheck && check ? (
            check.passed ? (
              <span lang="mi">Ka pai!</span>
            ) : (
              'Not this time'
            )
          ) : (
            <span lang="mi">Ka pai!</span>
          )}
        </h1>
        <p className={styles.big} aria-label={`Score ${score} out of ${round.total}`}>
          {score} / {round.total}
        </p>
        {isCheck && check && !check.passed && (
          <p>
            You need {passMark(round.total)} out of {round.total} to pass. Practise the words below and try the Kiwiz
            again.
          </p>
        )}
        <dl className={styles.facts}>
          <div>
            <dt>Kiwi XP earned</dt>
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

      {summary.missedItemIds && summary.missedItemIds.length > 0 && <MissedList ids={summary.missedItemIds} />}

      {unit ? (
        <UnitActions round={round} unit={unit} summary={summary} />
      ) : round.mode === 'review' ? (
        <div className={ui.row}>
          {(dueCount ?? 0) > 0 && (
            <Link className={ui.button} to="/review">
              Review more ({dueCount} due)
            </Link>
          )}
          <Link className={`${ui.button} ${ui.secondary}`} to="/home">
            Path
          </Link>
        </div>
      ) : (
        <div className={ui.row}>
          <Link className={ui.button} to={`/play/${round.level}/${round.mode}`}>
            Play again
          </Link>
          <Link className={`${ui.button} ${ui.secondary}`} to="/practice">
            Free practice
          </Link>
          <Link className={`${ui.button} ${ui.secondary}`} to="/home">
            Path
          </Link>
        </div>
      )}
    </main>
  );
}
