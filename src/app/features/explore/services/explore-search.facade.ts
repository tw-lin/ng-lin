import { Injectable, signal, computed, inject, Injector, runInInjectionContext } from '@angular/core';
import { Firestore, collection, query, where, orderBy, limit, getDocs, Timestamp, QueryConstraint } from '@angular/fire/firestore';
import { LoggerService } from '@core';

import {
  SearchResult,
  SearchFilters,
  PaginationState,
  SearchOptions,
  AccountMetadata,
  OrganizationMetadata,
  BlueprintMetadata,
  DEFAULT_SEARCH_FILTERS,
  DEFAULT_PAGINATION_STATE
} from '../models';
import { SearchCacheService } from './search-cache.service';

/**
 * Firestore Document Interfaces
 * Define explicit types for Firestore documents to avoid `any` usage
 */
interface AccountFirestoreDoc {
  uid: string;
  name: string;
  email: string;
  avatar_url?: string;
  is_discoverable?: boolean;
  organization_count?: number;
  blueprint_count?: number;
  created_at: Timestamp;
}

interface OrganizationFirestoreDoc {
  name: string;
  description?: string;
  logo_url?: string;
  is_public: boolean;
  is_discoverable?: boolean;
  created_by: string;
  member_count?: number;
  blueprint_count?: number;
  created_at: Timestamp;
}

interface BlueprintFirestoreDoc {
  name: string;
  description?: string;
  coverUrl?: string;
  ownerId: string;
  ownerType: 'user' | 'organization' | 'team';
  ownerName?: string;
  isPublic: boolean;
  status: 'draft' | 'active' | 'archived';
  enabledModules: string[];
  taskCount?: number;
  memberCount?: number;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Explore Search Facade
 *
 * Unified search interface for Users, Organizations, and Blueprints.
 * Implements the Facade pattern to coordinate multiple entity searches
 * and manage search state.
 *
 * Features:
 * - Parallel multi-entity search
 * - Client-side relevance scoring
 * - Result caching with TTL
 * - Debounced search input (handled by component)
 * - Pagination support
 *
 * Based on docs/Explore_Search_Architecture.md
 */
@Injectable({ providedIn: 'root' })
export class ExploreSearchFacade {
  // Dependencies
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly cache = inject(SearchCacheService);
  private readonly injector = inject(Injector);

  // Configuration constants
  private readonly SEARCH_BATCH_LIMIT = 50;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  // Cached escaped query for current search (performance optimization)
  private _escapedQuery = '';

  // Private state signals
  private _query = signal('');
  private _filters = signal<SearchFilters>(DEFAULT_SEARCH_FILTERS);
  private _results = signal<SearchResult[]>([]);
  private _allResults = signal<SearchResult[]>([]); // Full result set for client-side pagination
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  private _pagination = signal<PaginationState>(DEFAULT_PAGINATION_STATE);

  // Public read-only signals
  readonly query = this._query.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly results = this._results.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly pagination = this._pagination.asReadonly();

  // Recent searches from cache service
  readonly recentSearches = this.cache.recentSearches;

  // Computed signals
  readonly hasMore = computed(() => {
    const p = this._pagination();
    return p.currentPage < p.totalPages;
  });

  readonly resultCount = computed(() => this._results().length);
  readonly totalCount = computed(() => this._pagination().totalCount);

  readonly resultsByType = computed(() => {
    const results = this._results();
    return {
      accounts: results.filter(r => r.type === 'account'),
      organizations: results.filter(r => r.type === 'organization'),
      blueprints: results.filter(r => r.type === 'blueprint')
    };
  });

  readonly isEmpty = computed(() => !this._loading() && this._results().length === 0 && this._query().length > 0);

  readonly hasQuery = computed(() => this._query().length > 0);

  /**
   * Execute search query across all enabled entity types
   *
   * @param searchQuery Search query string (min 1 char, max 100 chars)
   * @param options Optional search configuration
   */
  async search(searchQuery: string, options?: SearchOptions): Promise<void> {
    // Validate and sanitize query
    const sanitizedQuery = this.sanitizeQuery(searchQuery);
    if (sanitizedQuery.length < 1) {
      this.clearSearch();
      return;
    }

    this._query.set(sanitizedQuery);
    this._loading.set(true);
    this._error.set(null);

    // Cache escaped query for relevance calculations (performance optimization)
    this._escapedQuery = this.escapeRegex(sanitizedQuery.toLowerCase());

    // Apply filter overrides if provided
    if (options?.filters) {
      this._filters.update(f => ({ ...f, ...options.filters }));
    }

    // Reset pagination if requested
    if (options?.resetPagination !== false) {
      this._pagination.set(DEFAULT_PAGINATION_STATE);
    }

    try {
      // Check cache first
      const cacheKey = this.getCacheKey(sanitizedQuery, this._filters());
      const cached = this.cache.get(cacheKey);

      if (cached) {
        this.logger.debug('[ExploreSearch] Cache hit:', cacheKey);
        this._allResults.set(cached.results);
        this.applyPagination(cached.results);
        this._loading.set(false);
        return;
      }

      // Execute parallel searches for each entity type
      const filters = this._filters();
      const searchPromises: Array<Promise<SearchResult[]>> = [];

      if (filters.entityTypes.includes('account')) {
        searchPromises.push(this.searchAccounts(sanitizedQuery));
      }
      if (filters.entityTypes.includes('organization')) {
        searchPromises.push(this.searchOrganizations(sanitizedQuery));
      }
      if (filters.entityTypes.includes('blueprint')) {
        searchPromises.push(this.searchBlueprints(sanitizedQuery));
      }

      const results = await Promise.all(searchPromises);

      // Aggregate and sort results
      const allResults = this.aggregateResults(results.flat(), sanitizedQuery);

      // Cache results
      this.cache.set(cacheKey, {
        results: allResults,
        pagination: {
          ...DEFAULT_PAGINATION_STATE,
          totalCount: allResults.length,
          totalPages: Math.ceil(allResults.length / DEFAULT_PAGINATION_STATE.pageSize)
        },
        timestamp: Date.now()
      });

      // Add to recent searches
      this.cache.addRecentSearch(sanitizedQuery);

      // Update state
      this._allResults.set(allResults);
      this.applyPagination(allResults);

      this.logger.info('[ExploreSearch]', `Found ${allResults.length} results for "${sanitizedQuery}"`);
    } catch (error) {
      this.logger.error('[ExploreSearch]', 'Search failed', error instanceof Error ? error : new Error(String(error)));
      this._error.set('搜尋失敗，請稍後再試。');
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Update search filters and re-execute search
   *
   * @param filters Partial filter updates
   */
  async updateFilters(filters: Partial<SearchFilters>): Promise<void> {
    this._filters.update(f => ({ ...f, ...filters }));

    // Invalidate cache for current query with old filters
    const currentQuery = this._query();
    if (currentQuery) {
      await this.search(currentQuery, { resetPagination: true });
    }
  }

  /**
   * Load next page of results (for infinite scroll)
   */
  loadNextPage(): void {
    if (!this.hasMore()) return;

    this._pagination.update(p => ({
      ...p,
      currentPage: p.currentPage + 1
    }));

    // Apply pagination to cached results
    const endIndex = this._pagination().currentPage * this._pagination().pageSize;
    this._results.set(this._allResults().slice(0, endIndex));
  }

  /**
   * Clear all search state and reset to initial
   */
  clearSearch(): void {
    this._query.set('');
    this._results.set([]);
    this._allResults.set([]);
    this._error.set(null);
    this._filters.set(DEFAULT_SEARCH_FILTERS);
    this._pagination.set(DEFAULT_PAGINATION_STATE);
  }

  /**
   * Clear recent searches history
   */
  clearRecentSearches(): void {
    this.cache.clearRecentSearches();
  }

  // ========== Private Methods ==========

  /**
   * Sanitize search query input
   * Removes all HTML-related characters and limits length
   */
  private sanitizeQuery(queryInput: string): string {
    // First, remove all angle brackets and quotes in a loop until stable
    // This prevents bypass attempts like "<scr<script>ipt>"
    let sanitized = queryInput.trim();
    let previousLength: number;
    let iterations = 0;
    const MAX_ITERATIONS = 10; // Safety limit to prevent potential performance issues

    do {
      previousLength = sanitized.length;
      sanitized = sanitized
        .replace(/</g, '') // Remove all < characters
        .replace(/>/g, '') // Remove all > characters
        .replace(/"/g, '') // Remove double quotes
        .replace(/'/g, '') // Remove single quotes
        .replace(/`/g, '') // Remove backticks
        .replace(/&/g, ''); // Remove ampersands (prevent HTML entities)
      iterations++;
    } while (sanitized.length !== previousLength && iterations < MAX_ITERATIONS);

    // Limit length
    return sanitized.substring(0, 100);
  }

  /**
   * Generate cache key from query and filters
   */
  private getCacheKey(searchQuery: string, filters: SearchFilters): string {
    return `search:${searchQuery.toLowerCase()}:${JSON.stringify(filters)}`;
  }

  /**
   * Search accounts collection
   * Only returns accounts with is_discoverable = true (defaults to true if not set)
   */
  private async searchAccounts(searchQuery: string): Promise<SearchResult[]> {
    try {
      const accountsRef = collection(this.firestore, 'accounts');

      // Note: Firestore doesn't support case-insensitive search
      // We fetch by name range and filter client-side
      const constraints: QueryConstraint[] = [
        where('name', '>=', searchQuery),
        where('name', '<=', `${searchQuery}\uf8ff`),
        orderBy('name', 'asc'),
        limit(this.SEARCH_BATCH_LIMIT)
      ];

      const q = query(accountsRef, ...constraints);
      const snapshot = await runInInjectionContext(this.injector, () => getDocs(q));

      return snapshot.docs
        .filter(doc => {
          const data = doc.data() as AccountFirestoreDoc;
          // Filter: only include accounts where is_discoverable is true or undefined (default to true)
          return data.is_discoverable !== false;
        })
        .map(doc => {
          const data = doc.data() as AccountFirestoreDoc;
          return this.transformAccountToResult(doc.id, data, searchQuery);
        });
    } catch (error) {
      this.logger.error('[ExploreSearch]', 'Account search failed', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  /**
   * Search organizations collection
   * Only returns organizations with is_discoverable = true (defaults to true if not set)
   */
  private async searchOrganizations(searchQuery: string): Promise<SearchResult[]> {
    try {
      const orgsRef = collection(this.firestore, 'organizations');

      const constraints: QueryConstraint[] = [
        where('name', '>=', searchQuery),
        where('name', '<=', `${searchQuery}\uf8ff`),
        orderBy('name', 'asc'),
        limit(this.SEARCH_BATCH_LIMIT)
      ];

      const q = query(orgsRef, ...constraints);
      const snapshot = await runInInjectionContext(this.injector, () => getDocs(q));

      return snapshot.docs
        .filter(doc => {
          const data = doc.data() as OrganizationFirestoreDoc;
          // Filter: only include organizations where is_discoverable is true or undefined (default to true)
          return data.is_discoverable !== false;
        })
        .map(doc => {
          const data = doc.data() as OrganizationFirestoreDoc;
          return this.transformOrganizationToResult(doc.id, data, searchQuery);
        });
    } catch (error) {
      this.logger.error('[ExploreSearch]', 'Organization search failed', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  /**
   * Search blueprints collection
   * Only returns blueprints with isPublic = true
   *
   * Note: Simplified query to avoid composite index requirement.
   * Filters by isPublic first, then filters by name client-side.
   */
  private async searchBlueprints(searchQuery: string): Promise<SearchResult[]> {
    try {
      const blueprintsRef = collection(this.firestore, 'blueprints');
      const filters = this._filters();

      // Simplified query: only filter by isPublic and optional status
      // Name filtering will be done client-side to avoid composite index requirement
      const constraints: QueryConstraint[] = [where('isPublic', '==', true)];

      // Apply status filter if not 'all'
      if (filters.status !== 'all') {
        constraints.push(where('status', '==', filters.status));
      }

      constraints.push(limit(this.SEARCH_BATCH_LIMIT));

      const q = query(blueprintsRef, ...constraints);
      const snapshot = await runInInjectionContext(this.injector, () => getDocs(q));

      // Filter by name client-side (case-insensitive)
      const normalizedQuery = searchQuery.toLowerCase();
      return snapshot.docs
        .map(doc => {
          const data = doc.data() as BlueprintFirestoreDoc;
          return this.transformBlueprintToResult(doc.id, data, searchQuery);
        })
        .filter(result => {
          // Client-side name filtering (case-insensitive)
          return result.title.toLowerCase().includes(normalizedQuery);
        });
    } catch (error) {
      this.logger.error('[ExploreSearch]', 'Blueprint search failed', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  /**
   * Transform Firestore account document to SearchResult
   */
  private transformAccountToResult(id: string, data: AccountFirestoreDoc, searchQuery: string): SearchResult {
    const createdAt = data.created_at instanceof Timestamp ? data.created_at.toDate() : new Date(data.created_at || Date.now());

    const metadata: AccountMetadata = {
      email: data.email || '',
      organizationCount: data.organization_count || 0,
      blueprintCount: data.blueprint_count || 0
    };

    return {
      id,
      type: 'account',
      title: data.name || 'Unknown User',
      subtitle: data.email || '',
      avatarUrl: data.avatar_url || null,
      relevanceScore: this.calculateRelevance(data.name || '', searchQuery, this._escapedQuery),
      metadata,
      highlights: this.extractHighlights(data, searchQuery),
      createdAt,
      updatedAt: createdAt
    };
  }

  /**
   * Transform Firestore organization document to SearchResult
   */
  private transformOrganizationToResult(id: string, data: OrganizationFirestoreDoc, searchQuery: string): SearchResult {
    const createdAt = data.created_at instanceof Timestamp ? data.created_at.toDate() : new Date(data.created_at || Date.now());

    const metadata: OrganizationMetadata = {
      memberCount: data.member_count || 0,
      blueprintCount: data.blueprint_count || 0,
      isPublic: data.is_public || false,
      description: data.description || null
    };

    const subtitle = data.description ? data.description.substring(0, 100) + (data.description.length > 100 ? '...' : '') : '組織';

    return {
      id,
      type: 'organization',
      title: data.name || 'Unknown Organization',
      subtitle,
      avatarUrl: data.logo_url || null,
      relevanceScore: this.calculateRelevance(data.name || '', searchQuery, this._escapedQuery),
      metadata,
      highlights: this.extractHighlights(data, searchQuery),
      createdAt,
      updatedAt: createdAt
    };
  }

  /**
   * Transform Firestore blueprint document to SearchResult
   */
  private transformBlueprintToResult(id: string, data: BlueprintFirestoreDoc, searchQuery: string): SearchResult {
    const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt || Date.now());

    const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : createdAt;

    const metadata: BlueprintMetadata = {
      ownerName: data.ownerName || 'Unknown',
      ownerType: data.ownerType || 'user',
      status: data.status || 'draft',
      taskCount: data.taskCount || 0,
      memberCount: data.memberCount || 0,
      enabledModules: data.enabledModules || [],
      isPublic: data.isPublic || false,
      description: data.description || null
    };

    const statusText = { draft: '草稿', active: '啟用', archived: '封存' }[metadata.status] || metadata.status;
    const subtitle = data.description
      ? data.description.substring(0, 100) + (data.description.length > 100 ? '...' : '')
      : `${statusText} • ${metadata.enabledModules.length} 模組`;

    return {
      id,
      type: 'blueprint',
      title: data.name || 'Unknown Blueprint',
      subtitle,
      avatarUrl: data.coverUrl || null,
      relevanceScore: this.calculateRelevance(data.name || '', searchQuery, this._escapedQuery),
      metadata,
      highlights: this.extractHighlights(data, searchQuery),
      createdAt,
      updatedAt
    };
  }

  /**
   * Calculate relevance score for a result
   *
   * @param name The name to score
   * @param searchQuery The search query (normalized)
   * @param escapedQuery Pre-escaped query for regex (to avoid redundant escaping)
   */
  private calculateRelevance(name: string, searchQuery: string, escapedQuery?: string): number {
    const normalizedQuery = searchQuery.toLowerCase();
    const normalizedName = name.toLowerCase();

    // Exact match: 100 points
    if (normalizedName === normalizedQuery) return 100;

    // Starts with: 80 points
    if (normalizedName.startsWith(normalizedQuery)) return 80;

    // Contains as word: 60 points
    // Use pre-escaped query if provided to avoid redundant escapeRegex calls
    const escaped = escapedQuery || this.escapeRegex(normalizedQuery);
    if (new RegExp(`\\b${escaped}`, 'i').test(normalizedName)) return 60;

    // Contains anywhere: 40 points
    if (normalizedName.includes(normalizedQuery)) return 40;

    // Partial match: 20 points
    return 20;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Extract highlighted text matches from entity data
   */
  private extractHighlights(data: any, searchQuery: string): Array<{ field: string; matches: string[] }> {
    const highlights: Array<{ field: string; matches: string[] }> = [];
    const regex = new RegExp(`(${this.escapeRegex(searchQuery)})`, 'gi');

    const searchableFields = ['name', 'description', 'email'];

    for (const field of searchableFields) {
      const value = data[field];
      if (typeof value === 'string' && regex.test(value)) {
        highlights.push({
          field,
          matches: value.match(regex) || []
        });
      }
    }

    return highlights;
  }

  /**
   * Aggregate and sort results from multiple sources
   */
  private aggregateResults(results: SearchResult[], searchQuery: string): SearchResult[] {
    // Recalculate relevance scores and sort
    const scored = results.map(result => ({
      ...result,
      relevanceScore: this.calculateRelevance(result.title, searchQuery)
    }));

    // Sort by relevance score (descending)
    return scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Apply pagination to results
   */
  private applyPagination(allResults: SearchResult[]): void {
    const pageSize = this._pagination().pageSize;
    const totalCount = allResults.length;
    const totalPages = Math.ceil(totalCount / pageSize);

    this._pagination.set({
      currentPage: 1,
      pageSize,
      totalCount,
      totalPages
    });

    // Set first page of results
    this._results.set(allResults.slice(0, pageSize));
  }
}
