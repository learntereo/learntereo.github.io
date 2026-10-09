import type { Level, RoundMode, RoundState } from '../game/types';
import { requireClient } from './profileRepo';
import { withRetry } from './retry';

export type RoundStatus = 'in_progress' | 'completed' | 'abandoned';

export interface RoundRow {
  id: string;
  user_id: string;
  level: Level;
  mode: RoundMode;
  status: RoundStatus;
  state: unknown;
  score: number | null;
  total: number;
  xp_earned: number;
  started_at: string;
  completed_at: string | null;
}

/** Thrown when the learner already has an in-progress round (unique index, FR9.6). */
export class RoundConflictError extends Error {
  constructor() {
    super('A round is already in progress');
    this.name = 'RoundConflictError';
  }
}

const UNIQUE_VIOLATION = '23505';

export function getActiveRound(): Promise<RoundRow | null> {
  return withRetry(async () => {
    const { data, error } = await requireClient().from('rounds').select('*').eq('status', 'in_progress').maybeSingle();
    if (error) throw error;
    return (data as RoundRow | null) ?? null;
  });
}

export function getRound(id: string): Promise<RoundRow | null> {
  return withRetry(async () => {
    const { data, error } = await requireClient().from('rounds').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return (data as RoundRow | null) ?? null;
  });
}

export async function startRound(userId: string, level: Level, mode: RoundMode, state: RoundState): Promise<RoundRow> {
  return withRetry(async () => {
    const { data, error } = await requireClient()
      .from('rounds')
      .insert({ user_id: userId, level, mode, state, total: state.originalCount })
      .select()
      .single();
    if (error) {
      if (error.code === UNIQUE_VIOLATION) throw new RoundConflictError();
      throw error;
    }
    return data as RoundRow;
  }, { shouldRetry: (e) => !(e instanceof RoundConflictError) && (e as { code?: string })?.code !== UNIQUE_VIOLATION });
}

export async function saveRoundState(id: string, state: RoundState): Promise<void> {
  const { error } = await requireClient().from('rounds').update({ state }).eq('id', id).eq('status', 'in_progress');
  if (error) throw error;
}

export interface CompleteRoundInput {
  id: string;
  state: RoundState;
  score: number;
  xpEarned: number;
}

export async function completeRound({ id, state, score, xpEarned }: CompleteRoundInput): Promise<void> {
  const { error } = await requireClient()
    .from('rounds')
    .update({ state, status: 'completed', score, xp_earned: xpEarned, completed_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function abandonRound(id: string): Promise<void> {
  await withRetry(async () => {
    const { error } = await requireClient().from('rounds').update({ status: 'abandoned' }).eq('id', id);
    if (error) throw error;
  });
}

export function getHistory(limit = 20): Promise<RoundRow[]> {
  return withRetry(async () => {
    const { data, error } = await requireClient()
      .from('rounds')
      .select('*')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as RoundRow[];
  });
}
