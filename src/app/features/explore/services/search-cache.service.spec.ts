import { TestBed, fakeAsync, tick } from '@angular/core/testing';

import { SearchCacheService } from './search-cache.service';
import { CachedSearchResult, SearchResult } from '../models';

describe('SearchCacheService', () => {
  let service: SearchCacheService;

  const mockSearchResult: SearchResult = {
    id: 'test-1',
    type: 'blueprint',
    title: 'Test Blueprint',
    subtitle: 'Test description',
    avatarUrl: null,
    relevanceScore: 80,
    metadata: {
      ownerName: 'Test User',
      ownerType: 'user',
      status: 'active',
      taskCount: 5,
      memberCount: 3,
      enabledModules: ['tasks'],
      isPublic: true,
      description: null
    },
    highlights: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockCachedResult: CachedSearchResult = {
    results: [mockSearchResult],
    pagination: {
      currentPage: 1,
      pageSize: 20,
      totalCount: 1,
      totalPages: 1
    },
    timestamp: Date.now()
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SearchCacheService]
    });
    service = TestBed.inject(SearchCacheService);

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Cache operations', () => {
    it('should store and retrieve cached results', () => {
      const key = 'search:test:{}';

      service.set(key, mockCachedResult);

      const result = service.get(key);
      expect(result).not.toBeNull();
      expect(result?.results.length).toBe(1);
      expect(result?.results[0].title).toBe('Test Blueprint');
    });

    it('should return null for non-existent keys', () => {
      const result = service.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should return null for expired cache entries', fakeAsync(() => {
      const key = 'search:expired:{}';

      // Set cache entry
      service.set(key, mockCachedResult);

      // Fast-forward past TTL (5 minutes + 1 second)
      tick(5 * 60 * 1000 + 1000);

      const result = service.get(key);
      expect(result).toBeNull();
    }));

    it('should invalidate cache entries', () => {
      const key = 'search:invalidate:{}';

      service.set(key, mockCachedResult);
      expect(service.has(key)).toBeTrue();

      service.invalidate(key);
      expect(service.has(key)).toBeFalse();
    });

    it('should clear all cache entries', () => {
      service.set('key1', mockCachedResult);
      service.set('key2', mockCachedResult);

      expect(service.size).toBe(2);

      service.clear();

      expect(service.size).toBe(0);
    });

    it('should evict oldest entries when max size exceeded', () => {
      // Fill cache beyond max size (50)
      for (let i = 0; i < 55; i++) {
        service.set(`key-${i}`, { ...mockCachedResult, timestamp: Date.now() });
      }

      // First 5 entries should be evicted
      expect(service.get('key-0')).toBeNull();
      expect(service.get('key-4')).toBeNull();

      // Newer entries should still exist
      expect(service.get('key-5')).not.toBeNull();
      expect(service.get('key-54')).not.toBeNull();

      expect(service.size).toBe(50);
    });
  });

  describe('Recent searches', () => {
    it('should add recent searches', () => {
      service.addRecentSearch('test query 1');
      service.addRecentSearch('test query 2');

      const recentSearches = service.recentSearches();
      expect(recentSearches.length).toBe(2);
      expect(recentSearches[0]).toBe('test query 2'); // Most recent first
      expect(recentSearches[1]).toBe('test query 1');
    });

    it('should not add duplicate searches', () => {
      service.addRecentSearch('duplicate query');
      service.addRecentSearch('other query');
      service.addRecentSearch('duplicate query');

      const recentSearches = service.recentSearches();
      expect(recentSearches.length).toBe(2);
      expect(recentSearches[0]).toBe('duplicate query'); // Moved to top
    });

    it('should limit recent searches to 10', () => {
      for (let i = 0; i < 15; i++) {
        service.addRecentSearch(`query ${i}`);
      }

      const recentSearches = service.recentSearches();
      expect(recentSearches.length).toBe(10);
      expect(recentSearches[0]).toBe('query 14'); // Most recent
    });

    it('should not add empty searches', () => {
      service.addRecentSearch('');
      service.addRecentSearch('   ');

      const recentSearches = service.recentSearches();
      expect(recentSearches.length).toBe(0);
    });

    it('should clear recent searches', () => {
      service.addRecentSearch('test query');
      expect(service.recentSearches().length).toBe(1);

      service.clearRecentSearches();
      expect(service.recentSearches().length).toBe(0);
    });

    it('should persist recent searches to localStorage', () => {
      service.addRecentSearch('persistent query');

      const stored = localStorage.getItem('explore-recent-searches');
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!)).toContain('persistent query');
    });
  });

  describe('Cache statistics', () => {
    it('should track cache hit rate', () => {
      const key = 'stats-test';
      service.set(key, mockCachedResult);

      // 1 hit
      service.get(key);
      // 2 misses
      service.get('miss-1');
      service.get('miss-2');

      expect(service.hitRate()).toBeCloseTo(33.33, 1); // 1/3 = 33.33%
    });

    it('should return 0 hit rate when no queries', () => {
      expect(service.hitRate()).toBe(0);
    });
  });
});
