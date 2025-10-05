import { logger, logDebug, logInfo } from './logger.js';

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

class Cache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private defaultTTL: number;

  constructor(defaultTTL: number = 3600000) {
    this.defaultTTL = defaultTTL;
  }

  set(key: string, value: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };
    this.cache.set(key, entry);
    logDebug(`Cache set: ${key}`, { ttl: entry.ttl });
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      logDebug(`Cache miss: ${key}`);
      return undefined;
    }

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      logDebug(`Cache expired: ${key}`, { age, ttl: entry.ttl });
      return undefined;
    }

    logDebug(`Cache hit: ${key}`, { age });
    return entry.value;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logDebug(`Cache invalidated: ${key}`);
    }
    return deleted;
  }

  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logInfo(`Cache cleared: ${size} entries removed`);
  }

  size(): number {
    return this.cache.size;
  }

  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      logInfo(`Cache cleanup: ${removed} expired entries removed`);
    }

    return removed;
  }
}

export const storyCache = new Cache<unknown>(3600000);

export function clearAllCaches(): void {
  storyCache.clear();
  logInfo('All caches cleared');
}

setInterval(() => {
  storyCache.cleanup();
}, 600000);
