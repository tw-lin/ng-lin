/**
 * Context Type
 *
 * Defines the scope level of a blueprint's execution context.
 * Determines data isolation and access control boundaries.
 */
export enum ContextType {
  /** Organization-wide context - shared across all teams */
  ORGANIZATION = 'organization',

  /** Team-level context - isolated to specific team */
  TEAM = 'team',

  /** User-level context - personal/private to user */
  USER = 'user'
}

/**
 * Tenant Information
 *
 * Identifies the multi-tenant scope for a blueprint execution.
 * Used for data isolation and access control.
 */
export interface TenantInfo {
  /** Organization ID - always required */
  organizationId: string;

  /** Team ID - required for team-level context */
  teamId?: string;

  /** User ID - current user executing operations */
  userId: string;

  /** Context type - determines isolation level */
  contextType: ContextType;
}
