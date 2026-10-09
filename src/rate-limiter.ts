import { RATE_LIMIT_CAPACITY, RATE_LIMIT_REFILL_PER_SECOND } from './config.js';

interface TokenBucket {
  tokens: number;
  lastRefill: number;
  capacity: number;
  refillRate: number;
}

/**
 * Token bucket sized to the CompassOne key quota (2000 requests / 15 minutes).
 */
export class RateLimiter {
  private bucket: TokenBucket;

  constructor(
    capacity: number = RATE_LIMIT_CAPACITY,
    refillRate: number = RATE_LIMIT_REFILL_PER_SECOND
  ) {
    this.bucket = {
      tokens: capacity,
      lastRefill: Date.now(),
      capacity,
      refillRate,
    };
  }

  async acquire(tokens: number = 1): Promise<void> {
    this.refill();

    if (this.bucket.tokens >= tokens) {
      this.bucket.tokens -= tokens;
      return;
    }

    if (this.bucket.refillRate <= 0) {
      throw new Error('Rate limiter refill rate must be positive');
    }

    const tokensNeeded = tokens - this.bucket.tokens;
    const waitMs = Math.max(1, Math.ceil((tokensNeeded / this.bucket.refillRate) * 1000));

    await new Promise(resolve => setTimeout(resolve, waitMs));
    return this.acquire(tokens);
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.bucket.lastRefill) / 1000;
    if (timePassed <= 0) {
      return;
    }

    this.bucket.tokens = Math.min(
      this.bucket.capacity,
      this.bucket.tokens + timePassed * this.bucket.refillRate
    );
    this.bucket.lastRefill = now;
  }

  getAvailableTokens(): number {
    this.refill();
    return this.bucket.tokens;
  }
}
