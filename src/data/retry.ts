/** Delays before each retry: 0.5s, 1s, 2s (so up to 4 attempts in total). */
export const BACKOFF_MS: readonly number[] = [500, 1000, 2000];

export interface RetryOptions {
  delays?: readonly number[];
  /** Injectable for tests. */
  sleep?: (ms: number) => Promise<void>;
  shouldRetry?: (error: unknown) => boolean;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Network and server hiccups are worth retrying. Constraint violations (23xxx),
 * permission or syntax errors (42xxx) and PostgREST request errors are not.
 */
export function isTransientError(error: unknown): boolean {
  const code = typeof error === 'object' && error !== null ? (error as { code?: unknown }).code : undefined;
  if (typeof code === 'string' && /^(23|42|PGRST)/.test(code)) return false;
  return true;
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const delays = options.delays ?? BACKOFF_MS;
  const sleep = options.sleep ?? defaultSleep;
  const shouldRetry = options.shouldRetry ?? isTransientError;

  let lastError: unknown;
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === delays.length || !shouldRetry(error)) break;
      console.warn(`Request failed, retrying in ${delays[attempt]}ms`, error);
      await sleep(delays[attempt]);
    }
  }
  throw lastError;
}

export interface WriteQueueOptions {
  retry?: RetryOptions;
  /** Called when a flush gives up after retrying; the task stays queued. */
  onFailure?: (error: unknown) => void;
  /** Called when a flush finishes with nothing left pending after an earlier failure. */
  onRecovered?: () => void;
}

export interface WriteQueue {
  /** Queue a write under `key` (a newer write with the same key replaces an unsent one) and try to send everything pending. */
  enqueue: (key: string, task: () => Promise<unknown>) => Promise<void>;
  /** Try to send everything pending. */
  flush: () => Promise<void>;
  pendingCount: () => number;
}

/**
 * In-memory queue of writes. A write that fails after its retries stays
 * queued and is retried on the next enqueue or flush, so gameplay never blocks
 * on the network and later writes carry earlier ones with them.
 */
export function createWriteQueue(options: WriteQueueOptions = {}): WriteQueue {
  const pending = new Map<string, () => Promise<unknown>>();
  let chain: Promise<void> = Promise.resolve();
  let failing = false;

  async function drain(): Promise<void> {
    for (const [key, task] of [...pending]) {
      try {
        await withRetry(task, options.retry);
        if (pending.get(key) === task) pending.delete(key);
      } catch (error) {
        console.error('Write failed; will retry later', error);
        failing = true;
        options.onFailure?.(error);
        return;
      }
    }
    if (failing) {
      failing = false;
      options.onRecovered?.();
    }
  }

  function flush(): Promise<void> {
    chain = chain.then(drain, drain);
    return chain;
  }

  return {
    enqueue(key, task) {
      pending.set(key, task);
      return flush();
    },
    flush,
    pendingCount: () => pending.size,
  };
}
