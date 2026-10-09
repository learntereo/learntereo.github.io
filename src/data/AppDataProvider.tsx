import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import { allItems } from '../content/content';
import { isBeginnerComplete, learnedIds } from '../game/unlock';
import { showToast } from '../lib/toastBus';
import { AppDataContext, type AppData } from './AppDataContext';
import { getProfile, type Profile } from './profileRepo';
import { getItemProgress, type ItemProgressRow } from './progressRepo';
import { getActiveRound, type RoundRow } from './roundRepo';

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [status, setStatus] = useState<AppData['status']>('loading');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgressMap] = useState<ReadonlyMap<string, ItemProgressRow>>(new Map());
  const [activeRound, setActiveRound] = useState<RoundRow | null>(null);

  const reload = useCallback(async () => {
    if (!userId) return;
    try {
      const [p, rows, round] = await Promise.all([getProfile(userId), getItemProgress(), getActiveRound()]);
      setProfile(p);
      setProgressMap(new Map(rows.map((r) => [r.item_id, r])));
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

  const value = useMemo<AppData>(() => {
    const learned = learnedIds([...progress.values()]);
    return {
      status,
      profile,
      progress,
      learned,
      activeRound,
      intermediateUnlocked: Boolean(profile?.beginner_completed_at) || isBeginnerComplete(allItems, learned),
      reload,
      setProfile,
      setProgress,
      setActiveRound,
    };
  }, [status, profile, progress, activeRound, reload, setProgress]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}
