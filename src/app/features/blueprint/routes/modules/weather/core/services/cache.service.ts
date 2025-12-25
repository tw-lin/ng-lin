/**
 * Cache Service
 * 記憶體快取服務
 */

import { Injectable } from '@angular/core';

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

@Injectable({ providedIn: 'root' })
export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * 取得快取資料
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // 檢查是否過期
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * 設定快取資料
   *
   * @param key 快取鍵
   * @param data 資料
   * @param ttl 存活時間 (毫秒)
   */
  set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  }

  /**
   * 刪除快取
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 清除所有快取
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 清除過期快取
   */
  clearExpired(): number {
    let count = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * 取得快取統計
   */
  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}
