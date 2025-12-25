/**
 * Explore Search - Data Models
 *
 * Type definitions for the Explore Search feature.
 * Based on docs/Explore_Search_Architecture.md
 */

/**
 * Entity types that can be searched
 */
export type SearchEntityType = 'account' | 'organization' | 'blueprint';

/**
 * Search visibility filter options
 */
export type SearchVisibility = 'public' | 'private' | 'all';

/**
 * Sort options for search results
 */
export type SearchSortBy = 'relevance' | 'created' | 'updated' | 'name';

/**
 * Sort order
 */
export type SearchSortOrder = 'asc' | 'desc';

/**
 * Search filter configuration
 */
export interface SearchFilters {
  /** Entity types to include in search */
  entityTypes: SearchEntityType[];

  /** Filter by visibility (public/private) */
  visibility: SearchVisibility;

  /** Filter by status (for blueprints) */
  status: 'draft' | 'active' | 'archived' | 'all';

  /** Sort configuration */
  sortBy: SearchSortBy;
  sortOrder: SearchSortOrder;
}

/**
 * Default search filters
 */
export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  entityTypes: ['account', 'organization', 'blueprint'],
  visibility: 'all',
  status: 'all',
  sortBy: 'relevance',
  sortOrder: 'desc'
};

/**
 * Account-specific metadata in search results
 */
export interface AccountMetadata {
  email: string;
  organizationCount: number;
  blueprintCount: number;
}

/**
 * Organization-specific metadata in search results
 */
export interface OrganizationMetadata {
  memberCount: number;
  blueprintCount: number;
  isPublic: boolean;
  description: string | null;
}

/**
 * Blueprint-specific metadata in search results
 */
export interface BlueprintMetadata {
  ownerName: string;
  ownerType: 'user' | 'organization' | 'team';
  status: 'draft' | 'active' | 'archived';
  taskCount: number;
  memberCount: number;
  enabledModules: string[];
  isPublic: boolean;
  description: string | null;
}

/**
 * Text match highlight for search results
 */
export interface SearchHighlight {
  field: string;
  matches: string[];
}

/**
 * Unified search result type for all entities
 */
export interface SearchResult {
  /** Unique identifier */
  id: string;

  /** Entity type discriminator */
  type: SearchEntityType;

  /** Display title (name) */
  title: string;

  /** Secondary text (description excerpt or subtitle) */
  subtitle: string;

  /** Avatar or cover image URL */
  avatarUrl: string | null;

  /** Relevance score (0-100) */
  relevanceScore: number;

  /** Entity-specific metadata */
  metadata: AccountMetadata | OrganizationMetadata | BlueprintMetadata;

  /** Highlighted text matches */
  highlights: SearchHighlight[];

  /** Creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Pagination state
 */
export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/**
 * Default pagination state
 */
export const DEFAULT_PAGINATION_STATE: PaginationState = {
  currentPage: 1,
  pageSize: 20,
  totalCount: 0,
  totalPages: 0
};

/**
 * Search options for advanced search
 */
export interface SearchOptions {
  /** Override default filters */
  filters?: Partial<SearchFilters>;

  /** Reset pagination to first page */
  resetPagination?: boolean;
}

/**
 * Search suggestion for autocomplete
 */
export interface SearchSuggestion {
  text: string;
  type: 'recent' | 'popular' | 'entity';
  entityType?: SearchEntityType;
  entityId?: string;
}

/**
 * Cached search response
 */
export interface CachedSearchResult {
  results: SearchResult[];
  pagination: PaginationState;
  timestamp: number;
}
