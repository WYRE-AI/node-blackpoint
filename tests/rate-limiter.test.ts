import { afterEach, describe, expect, it, vi } from 'vitest';
import { RateLimiter } from '../src/rate-limiter.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('RateLimiter', () => {
  it('spends tokens and refills up to capacity', () => {
    let now = 1_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    const limiter = new RateLimiter(10, 1);
    expect(limiter.getAvailableTokens()).toBe(10);
    expect(limiter.getAvailableTokens()).toBe(10);
    now += 2_000;
    expect(limiter.getAvailableTokens()).toBe(10);
  });

  it('waits when the bucket is empty', async () => {
    const limiter = new RateLimiter(1, 10_000);
    await limiter.acquire();
    const started = Date.now();
    await limiter.acquire();
    expect(Date.now() - started).toBeGreaterThanOrEqual(0);
    expect(limiter.getAvailableTokens()).toBeLessThan(1);
  });

  it('refuses to wait forever when the refill rate is zero', async () => {
    const limiter = new RateLimiter(0, 0);
    await expect(limiter.acquire()).rejects.toThrow(/refill rate/);
  });
});
