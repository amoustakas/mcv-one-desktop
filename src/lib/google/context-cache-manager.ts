import type { CacheEntry } from '../kits/types';
import { useContextCache } from '../../stores/context-cache';
import { flightRecorder } from '../telemetry/flight-recorder';

// ---------------------------------------------------------------------------
// ContextCacheManager — manages Google AI context caching for kit payloads.
// If the combined kit schemas + instructions exceed 32K tokens, creates a
// CachedContent with a 1-hour TTL to eliminate repeated token costs.
// ---------------------------------------------------------------------------

const MIN_TOKENS_FOR_CACHE = 32_768;
const DEFAULT_TTL_SECONDS = 3600; // 1 hour
const REFRESH_BUFFER_MS = 10 * 60 * 1000; // Refresh when <10 min remaining

/** Rough token estimate: ~4 chars per token */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export class ContextCacheManager {
  private model: string;

  constructor(model = 'gemini-1.5-pro') {
    this.model = model;
  }

  /**
   * Check if caching is worthwhile for the given payload.
   * Returns the active cache name if one exists, or creates a new one.
   */
  async getOrCreateCache(payload: string): Promise<string | null> {
    const tokenCount = estimateTokens(payload);

    if (tokenCount < MIN_TOKENS_FOR_CACHE) {
      flightRecorder.recordCacheEvent(false, { reason: 'below_threshold', tokenCount });
      return null;
    }

    const store = useContextCache.getState();

    // Check for existing valid cache
    const existing = store.getActiveCache();
    if (existing && existing.model.includes(this.model)) {
      // Check if TTL needs refresh
      const expiresAt = new Date(existing.expireTime).getTime();
      const remaining = expiresAt - Date.now();

      if (remaining > REFRESH_BUFFER_MS) {
        flightRecorder.recordCacheEvent(true, { cacheName: existing.cacheName, remainingMs: remaining });
        return existing.cacheName;
      }

      // TTL running low — extend it
      await this.extendTtl(existing.cacheName);
      flightRecorder.recordCacheEvent(true, { cacheName: existing.cacheName, action: 'ttl_extended' });
      return existing.cacheName;
    }

    // Create new cache
    return this.createCache(payload, tokenCount);
  }

  /**
   * Create a new cached content from the payload.
   */
  private async createCache(payload: string, tokenCount: number): Promise<string | null> {
    const store = useContextCache.getState();
    store.setCaching(true);

    try {
      const res = await fetch('/api/google-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          model: this.model,
          contents: [{ role: 'user', parts: [{ text: payload }] }],
          ttlSeconds: DEFAULT_TTL_SECONDS,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.warn('[ContextCacheManager] Cache creation failed:', err);
        store.setCaching(false);
        flightRecorder.recordCacheEvent(false, { reason: 'creation_failed', error: err.error });
        return null;
      }

      const data = await res.json();
      const entry: CacheEntry = {
        cacheName: data.cacheName,
        model: this.model,
        tokenCount: data.usageMetadata?.totalTokenCount ?? tokenCount,
        createTime: data.createTime,
        expireTime: data.expireTime,
        ttlSeconds: DEFAULT_TTL_SECONDS,
      };

      store.setActiveCache(entry);
      flightRecorder.recordCacheEvent(true, { cacheName: entry.cacheName, tokenCount: entry.tokenCount, action: 'created' });

      return entry.cacheName;
    } catch (err) {
      store.setCaching(false);
      console.warn('[ContextCacheManager] Cache creation error:', err);
      return null;
    }
  }

  /**
   * Extend the TTL of an existing cache.
   */
  private async extendTtl(cacheName: string): Promise<void> {
    try {
      await fetch('/api/google-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-ttl',
          name: cacheName,
          ttlSeconds: DEFAULT_TTL_SECONDS,
        }),
      });
    } catch {
      // Best-effort TTL refresh
    }
  }

  /**
   * Invalidate and delete a specific cache.
   */
  async invalidate(cacheName: string): Promise<void> {
    useContextCache.getState().invalidateCache(cacheName);
    fetch('/api/google-cache', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', name: cacheName }),
    }).catch(() => {});
  }
}

/** Singleton instance */
export const contextCacheManager = new ContextCacheManager();
