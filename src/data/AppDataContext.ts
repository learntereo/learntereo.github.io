import { createContext, useContext } from 'react';
import type { Profile } from './profileRepo';
import type { ItemProgressRow } from './progressRepo';
import type { RoundRow } from './roundRepo';

export interface AppData {
  status: 'loading' | 'ready' | 'error';
  profile: Profile | null;
  progress: ReadonlyMap<string, ItemProgressRow>;
  /** Ids of items answered correctly at least once. */
  learned: ReadonlySet<string>;
  activeRound: RoundRow | null;
  /** True once Beginner is complete (profile flag or all beginner items learned). */
  intermediateUnlocked: boolean;
  reload: () => Promise<void>;
  setProfile: (profile: Profile) => void;
  setProgress: (rows: readonly ItemProgressRow[]) => void;
  setActiveRound: (round: RoundRow | null) => void;
}

export const AppDataContext = createContext<AppData | undefined>(undefined);

export function useAppData(): AppData {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within an AppDataProvider');
  return ctx;
}
