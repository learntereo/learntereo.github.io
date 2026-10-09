import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import { units } from '../content/content';
import { learnedIds } from '../game/unlock';
import { computeUnitStatuses, unlockedLevels } from '../game/unitUnlock';
import { showToast } from '../lib/toastBus';
import { AppDataContext, type AppData } from './AppDataContext';
import { getProfile, type Profile } from './profileRepo';
import { getItemProgress, type ItemProgressRow } from './progressRepo';
import { getActiveRound, type RoundRow } from './roundRepo';
import { getUnitProgress, type UnitProgressRow } from './unitProgressRepo';

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [status, setStatus] = useState<AppData['status']>('loading');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgressMap] = useState<ReadonlyMap<string, ItemProgressRow>>(new Map());
  const [unitProgress, setUnitProgressMap] = useState<ReadonlyMap<string, UnitProgressRow>>(new Map());
  const [activeRound, setActiveRound] = useState<RoundRow | null>(null);

  const reload = useCallback(async () => {
    if (!userId) return;
    try {
      const [p, rows, unitRows, round] = await Promise.all([
        getProfile(userId),
        getItemProgress(),
        getUnitProgress(),
        getActiveRound(),
      ]);
      setProfile(p);
      setProgressMap(new Map(rows.map((r) => [r.item_id, r])));
      setUnitProgressMap(new Map(unitRows.map((r) => [r.unit_id, r])));
      setActiveRound(round);
      setStatus('ready');
    } catch (error) {
      console.error('Could not load your data', error);
      showToast("Couldn't load your progress. Check your connection and try again.", 'error');
      setStatus('error');
    }
  }, [userId]);

  useEffect(() => {
    // Loading from the network is the whole point of this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, [reload]);

  const setProgress = useCallback((rows: readonly ItemProgressRow[]) => {
    setProgressMap((current) => {
      const next = new Map(current);
      for (const row of rows) next.set(row.item_id, row);
      return next;
    });
  }, []);

  const setUnitProgress = useCallback((row: UnitProgressRow) => {
    setUnitProgressMap((current) => new Map(current).set(row.unit_id, row));
  }, []);

  const value = useMemo<AppData>(() => {
    const learned = learnedIds([...progress.values()]);
    const statuses = computeUnitStatuses(units, {
      unitProgress,
      learned,
      beginnerCompleted: Boolean(profile?.beginner_completed_at),
    });
    return {
      status,
      profile,
      progress,
      learned,
      unitProgress,
      statuses,
      openLevels: unlockedLevels(units, statuses),
      activeRound,
      reload,
      setProfile,
      setProgress,
      setUnitProgress,
      setActiveRound,
    };
  }, [status, profile, progress, unitProgress, activeRound, reload, setProgress, setUnitProgress]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}
