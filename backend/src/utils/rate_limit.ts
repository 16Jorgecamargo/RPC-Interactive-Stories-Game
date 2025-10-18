import { logWarning, logDebug } from './logger.js';

interface RateLimitEntry {
  count: number;
  firstRequest: number;
  lastRequest: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    setInterval(() => this.cleanup(), windowMs);
  }

  check(identifier: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = this.limits.get(identifier);

    if (!entry) {
      this.limits.set(identifier, {
        count: 1,
        firstRequest: now,
        lastRequest: now,
      });

      logDebug(`Rate limit check: ${identifier}`, { count: 1, remaining: this.maxRequests - 1 });

      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetAt: now + this.windowMs,
      };
    }

    const windowExpired = now - entry.firstRequest > this.windowMs;

    if (windowExpired) {
      this.limits.set(identifier, {
        count: 1,
        firstRequest: now,
        lastRequest: now,
      });

      logDebug(`Rate limit reset: ${identifier}`, { count: 1, remaining: this.maxRequests - 1 });

      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetAt: now + this.windowMs,
      };
    }

    entry.count++;
    entry.lastRequest = now;

    const allowed = entry.count <= this.maxRequests;
    const remaining = Math.max(0, this.maxRequests - entry.count);

    if (!allowed) {
      logWarning(`Rate limit exceeded: ${identifier}`, {
        count: entry.count,
        maxRequests: this.maxRequests,
        windowMs: this.windowMs,
      });
    }

    return {
      allowed,
      remaining,
      resetAt: entry.firstRequest + this.windowMs,
    };
  }

  reset(identifier: string): void {
    this.limits.delete(identifier);
    logDebug(`Rate limit manually reset: ${identifier}`);
  }

  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [identifier, entry] of this.limits.entries()) {
      if (now - entry.lastRequest > this.windowMs * 2) {
        this.limits.delete(identifier);
        removed++;
      }
    }

    if (removed > 0) {
      logDebug(`Rate limiter cleanup: ${removed} entries removed`);
    }
  }

  getStats(): { totalTracked: number; windowMs: number; maxRequests: number } {
    return {
      totalTracked: this.limits.size,
      windowMs: this.windowMs,
      maxRequests: this.maxRequests,
    };
  }
}

// Rate limiter global: 1000 req/min (suporta até 30+ usuários simultâneos)
export const globalRateLimiter = new RateLimiter(60000, 1000);

// Rate limiter estrito: 100 req/min (para endpoints sensíveis)
export const strictRateLimiter = new RateLimiter(60000, 100);

// Rate limiter auth: 10 req/5min (previne brute force)
export const authRateLimiter = new RateLimiter(300000, 10);

export function createRateLimiter(windowMs: number, maxRequests: number): RateLimiter {
  return new RateLimiter(windowMs, maxRequests);
}
