import { describe, expect, it, vi } from 'vitest';
import { BACKOFF_MS, createWriteQueue, isTransientError, withRetry } from './retry';

const noSleep = () => Promise.resolve();

describe('withRetry', () => {
  it('uses 0.5s, 1s, 2s backoff', () => {
    expect(BACKOFF_MS).toEqual([500, 1000, 2000]);
  });

  it('returns the value without retrying on success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    await expect(withRetry(fn, { sleep: noSleep })).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries up to 3 times with growing delays then succeeds', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('a'))
      .mockRejectedValueOnce(new Error('b'))
      .mockRejectedValueOnce(new Error('c'))
      .mockResolvedValue('ok');
    const sleep = vi.fn(noSleep);
    await expect(withRetry(fn, { sleep })).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(4);
    expect(sleep.mock.calls.map((c) => c[0])).toEqual([500, 1000, 2000]);
  });

  it('throws the last error after 3 retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('down'));
    await expect(withRetry(fn, { sleep: noSleep })).rejects.toThrow('down');
    expect(fn).toHaveBeenCalledTimes(4);
  });

  it('does not retry non-transient errors', async () => {
    const fn = vi.fn().mockRejectedValue({ code: '23505', message: 'duplicate' });
    await expect(withRetry(fn, { sleep: noSleep })).rejects.toMatchObject({ code: '23505' });
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('isTransientError', () => {
  it('treats constraint, permission and request errors as permanent', () => {
    expect(isTransientError({ code: '23505' })).toBe(false);
    expect(isTransientError({ code: '42501' })).toBe(false);
    expect(isTransientError({ code: 'PGRST116' })).toBe(false);
  });

  it('treats everything else as transient', () => {
    expect(isTransientError(new TypeError('Failed to fetch'))).toBe(true);
    expect(isTransientError({ code: '57014' })).toBe(true);
    expect(isTransientError(undefined)).toBe(true);
  });
});

describe('createWriteQueue', () => {
  it('runs a write immediately and clears it', async () => {
    const queue = createWriteQueue({ retry: { sleep: noSleep } });
    const task = vi.fn().mockResolvedValue(undefined);
    await queue.enqueue('a', task);
    expect(task).toHaveBeenCalledTimes(1);
    expect(queue.pendingCount()).toBe(0);
  });

  it('keeps a failed write and retries it on the next enqueue', async () => {
    const onFailure = vi.fn();
    const onRecovered = vi.fn();
    const queue = createWriteQueue({ retry: { sleep: noSleep }, onFailure, onRecovered });
    let down = true;
    const first = vi.fn(async () => {
      if (down) throw new Error('offline');
    });
    const second = vi.fn().mockResolvedValue(undefined);

    await queue.enqueue('first', first);
    expect(onFailure).toHaveBeenCalledTimes(1);
    expect(queue.pendingCount()).toBe(1);

    down = false;
    await queue.enqueue('second', second);
    expect(second).toHaveBeenCalledTimes(1);
    expect(queue.pendingCount()).toBe(0);
    expect(onRecovered).toHaveBeenCalledTimes(1);
  });

  it('replaces an unsent write that has the same key', async () => {
    const queue = createWriteQueue({ retry: { delays: [], sleep: noSleep } });
    let down = true;
    const old = vi.fn(async () => {
      if (down) throw new Error('offline');
    });
    const latest = vi.fn().mockResolvedValue(undefined);
    await queue.enqueue('round', old);
    down = false;
    await queue.enqueue('round', latest);
    expect(latest).toHaveBeenCalledTimes(1);
    expect(old).toHaveBeenCalledTimes(1);
    expect(queue.pendingCount()).toBe(0);
  });

  it('flush sends pending writes', async () => {
    const queue = createWriteQueue({ retry: { delays: [], sleep: noSleep } });
    let down = true;
    const task = vi.fn(async () => {
      if (down) throw new Error('offline');
    });
    await queue.enqueue('k', task);
    down = false;
    await queue.flush();
    expect(queue.pendingCount()).toBe(0);
  });
});
