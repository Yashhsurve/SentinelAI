import crypto from 'crypto';

/**
 * In-Memory LRU Cache with TTL expiry
 */
export class LruCache {
  constructor(maxSize = 500, defaultTtlMs = 10 * 60 * 1000) {
    this.maxSize = maxSize;
    this.defaultTtlMs = defaultTtlMs;
    this.cache = new Map();
  }

  /**
   * Generates a deterministic SHA-256 hash for cache keying
   */
  hashKey(input) {
    const serialized = typeof input === 'string' ? input : JSON.stringify(input);
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  get(key) {
    if (!this.cache.has(key)) return null;

    const entry = this.cache.get(key);
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    // Refresh LRU position by re-inserting
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key, value, ttlMs = this.defaultTtlMs) {
    // Evict oldest if capacity exceeded
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlMs,
    });
  }

  has(key) {
    return this.get(key) !== null;
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

export const agentCache = new LruCache(500, 10 * 60 * 1000);
