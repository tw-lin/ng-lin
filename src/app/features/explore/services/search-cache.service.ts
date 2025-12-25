import { Injectable, signal, computed } from '@angular/core';

import { CachedSearchResult } from '../models';

/**
 * Search Cache Service
 *
 * Implements an LRU (Least Recently Used) cache for search results.
 * Features:
 * - In-memory cache with configurable max size
 * - TTL (Time-To-Live) based expiration
 * - Browser LocalStorage persistence for recent searches
 *
 * Based on docs/Explore_Search_Architecture.md
 */
@Injectable({ providedIn: 'root' })
export class SearchCacheService {
  /** Maximum number of cached queries */
  private readonly MAX_CACHE_SIZE = 50;

  /** Default TTL in milliseconds (5 minutes) */
  private readonly DEFAULT_TTL_MS = 5 * 60 * 1000;

  /** LocalStorage key for recent searches */
  private readonly RECENT_SEARCHES_KEY = 'explore-recent-searches';

  /** In-memory cache storage */
  private cache = new Map<string, CachedSearchResult>();

  /** Track access order for LRU eviction */
  private accessOrder: string[] = [];

  /** Recent searches signal (persisted to LocalStorage) */
  private _recentSearches = signal<string[]>(this.loadRecentSearches());
  readonly recentSearches = this._recentSearches.asReadonly();

  /** Cache statistics */
  private _hits = signal(0);
  private _misses = signal(0);

  readonly hitRate = computed(() => {
    const total = this._hits() + this._misses();
    return total > 0 ? (this._hits() / total) * 100 : 0;
  });

  /**
   * Get cached results for a query
   *
   * @param key Cache key (usually query + filters)
   * @returns Cached results or null if not found/expired
   */
  get(key: string): CachedSearchResult | null {
    const cached = this.cache.get(key);

    if (!cached) {
      this._misses.update(m => m + 1);
      return null;
    }

    // Check TTL expiration
    const now = Date.now();
    if (now - cached.timestamp > this.DEFAULT_TTL_MS) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      this._misses.update(m => m + 1);
      return null;
    }

    // Update access order (LRU)
    this.updateAccessOrder(key);
    this._hits.update(h => h + 1);

    return cached;
  }

  /**
   * Store search results in cache
   *
   * @param key Cache key
   * @param result Cached result data
   */
  set(key: string, result: CachedSearchResult): void {
    // Evict oldest entries if at capacity
    while (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldest = this.accessOrder.shift();
      if (oldest) {
        this.cache.delete(oldest);
      }
    }

    // Store with timestamp
    this.cache.set(key, {
      ...result,
      timestamp: Date.now()
    });

    // Update access order
    this.updateAccessOrder(key);
  }

  /**
   * Invalidate cache entry
   *
   * @param key Cache key to invalidate
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    this.removeFromAccessOrder(key);
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this._hits.set(0);
    this._misses.set(0);
  }

  /**
   * Check if cache contains a key
   */
  has(key: string): boolean {
    return this.cache.has(key) && this.get(key) !== null;
  }

  /**
   * Get current cache size
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Add a search to recent searches history
   *
   * @param query Search query to add
   */
  addRecentSearch(query: string): void {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 1) return;

    const current = this._recentSearches();
    // Remove duplicate if exists, then add to front
    const updated = [trimmed, ...current.filter(s => s !== trimmed)].slice(0, 10);
    this._recentSearches.set(updated);
    this.saveRecentSearches(updated);
  }

  /**
   * Clear recent searches history
   */
  clearRecentSearches(): void {
    this._recentSearches.set([]);
    try {
      localStorage.removeItem(this.RECENT_SEARCHES_KEY);
    } catch {
      // LocalStorage may be unavailable
    }
  }

  // Private helpers

  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  private loadRecentSearches(): string[] {
    try {
      const stored = localStorage.getItem(this.RECENT_SEARCHES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveRecentSearches(searches: string[]): void {
    try {
      localStorage.setItem(this.RECENT_SEARCHES_KEY, JSON.stringify(searches));
    } catch {
      // LocalStorage may be unavailable or full
    }
  }
}
