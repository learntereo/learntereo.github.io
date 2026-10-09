import { createContext, useContext } from 'react';
import type { Level } from '../game/types';
import type { UnitStatus } from '../game/unitUnlock';
import type { Profile } from './profileRepo';
import type { ItemProgressRow } from './progressRepo';
import type { RoundRow } from './roundRepo';
import type { UnitProgressRow } from './unitProgressRepo';

export interface AppData {
  status: 'loading' | 'ready' | 'error';
  profile: Profile | null;
  progress: ReadonlyMap<string, ItemProgressRow>;
  /** Ids of items answered correctly at least once. */
  learned: ReadonlySet<string>;
  unitProgress: ReadonlyMap<string, UnitProgressRow>;
  /** State of every unit on the path. */
  statuses: ReadonlyMap<string, UnitStatus>;
  /** Levels whose first unit is open: these can be used in Free Practice. */
  openLevels: readonly Level[];
  activeRound: RoundRow | null;
  reload: () => Promise<void>;
  setProfile: (profile: Profile) => void;
  setProgress: (rows: readonly ItemProgressRow[]) => void;
  setUnitProgress: (row: UnitProgressRow) => void;
  setActiveRound: (round: RoundRow | null) => void;
}

export const AppDataContext = createContext<AppData | undefined>(undefined);

export function useAppData(): AppData {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within an AppDataProvider');
  return ctx;
}
