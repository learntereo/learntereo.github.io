import type { Level, Unit } from './types';

export type UnitState = 'locked' | 'available' | 'in_progress' | 'complete';

/** The parts of a unit_progress row the path logic needs. */
export interface UnitProgressLike {
  unit_id: string;
  learned_at: string | null;
  completed_at: string | null;
  best_score: number | null;
  attempts: number;
}

export interface UnitStatus {
  unit: Unit;
  state: UnitState;
  /** The Learn deck has been finished. */
  deckDone: boolean;
  bestScore: number | null;
  attempts: number;
  itemsLearned: number;
  itemsTotal: number;
}

export interface UnlockInput {
  unitProgress: ReadonlyMap<string, UnitProgressLike>;
  /** Ids of items answered correctly at least once. */
  learned: ReadonlySet<string>;
  /** profiles.beginner_completed_at was set by the PoC. */
  beginnerCompleted: boolean;
}

const LEVEL_ORDER: readonly Level[] = ['beginner', 'intermediate', 'advanced'];

/**
 * A unit is complete when its check was passed, when the learner finished
 * Beginner in the PoC (every Beginner unit), or when every one of its items
 * was already learned. The last rule lets existing learners skip what they know.
 */
function isComplete(unit: Unit, input: UnlockInput): boolean {
  if (input.unitProgress.get(unit.id)?.completed_at) return true;
  if (unit.level === 'beginner' && input.beginnerCompleted) return true;
  return unit.itemIds.length > 0 && unit.itemIds.every((id) => input.learned.has(id));
}

/**
 * State of every unit. `units` must be in path order. Unit 1 of the first
 * level is always open; any other unit opens when the unit before it is
 * complete, and the first unit of a level opens when every unit of the
 * previous level is complete.
 */
export function computeUnitStatuses(units: readonly Unit[], input: UnlockInput): Map<string, UnitStatus> {
  const complete = new Map(units.map((u) => [u.id, isComplete(u, input)]));
  const levels = LEVEL_ORDER.filter((level) => units.some((u) => u.level === level));
  const result = new Map<string, UnitStatus>();

  for (const unit of units) {
    const sameLevel = units.filter((u) => u.level === unit.level);
    const position = sameLevel.findIndex((u) => u.id === unit.id);
    let open: boolean;
    if (position > 0) {
      open = complete.get(sameLevel[position - 1].id) === true;
    } else {
      const levelIndex = levels.indexOf(unit.level);
      open =
        levelIndex <= 0 ||
        units.filter((u) => u.level === levels[levelIndex - 1]).every((u) => complete.get(u.id) === true);
    }

    const progress = input.unitProgress.get(unit.id);
    const itemsLearned = unit.itemIds.filter((id) => input.learned.has(id)).length;
    let state: UnitState;
    if (complete.get(unit.id)) state = 'complete';
    else if (!open) state = 'locked';
    else if (progress?.learned_at || (progress?.attempts ?? 0) > 0 || itemsLearned > 0) state = 'in_progress';
    else state = 'available';

    result.set(unit.id, {
      unit,
      state,
      deckDone: Boolean(progress?.learned_at),
      bestScore: progress?.best_score ?? null,
      attempts: progress?.attempts ?? 0,
      itemsLearned,
      itemsTotal: unit.itemIds.length,
    });
  }
  return result;
}

/** A level is open to the learner once its first unit is not locked. */
export function isLevelUnlocked(level: Level, units: readonly Unit[], statuses: ReadonlyMap<string, UnitStatus>): boolean {
  const first = units.find((u) => u.level === level);
  if (!first) return false;
  return statuses.get(first.id)?.state !== 'locked';
}

export function unlockedLevels(units: readonly Unit[], statuses: ReadonlyMap<string, UnitStatus>): Level[] {
  return LEVEL_ORDER.filter((level) => units.some((u) => u.level === level) && isLevelUnlocked(level, units, statuses));
}

/** Units that were locked before and are open (or complete) after. */
export function newlyUnlockedUnitIds(
  before: ReadonlyMap<string, UnitStatus>,
  after: ReadonlyMap<string, UnitStatus>,
): string[] {
  return [...after]
    .filter(([id, status]) => before.get(id)?.state === 'locked' && status.state !== 'locked')
    .map(([id]) => id);
}
