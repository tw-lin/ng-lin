/**
 * Tenant Context Service
 * 
 * Global tenant context provider for multi-tenant isolation in audit system
 * Integrates with existing WorkspaceContextService to provide tenant_id for all audit operations
 * 
 * Tenant Hierarchy:
 * - User Context: tenant_id = user.uid (personal workspace)
 * - Organization Context: tenant_id = organization.id (organization workspace)
 * - Team Context: tenant_id = team.organization_id (team's parent organization)
 * - Partner Context: tenant_id = partner.organization_id (partner's organization)
 * 
 * Follows docs/⭐️/Global-Audit-Log-系統拆解與對齊方案.md specifications
 * 
 * @author Global Event Bus Team
 * @version 1.0.0
 * @phase Phase 1 (P0 - Critical) - Task 1.2 Part 2
 */

import { Injectable, inject, computed, Signal } from '@angular/core';
import { WorkspaceContextService } from '@shared/services/workspace-context.service';
import { FirebaseService } from '@core/services/firebase.service';
import { ContextType } from '@core';

/**
 * Tenant Metadata
 * Provides additional context about the current tenant
 */
export interface TenantMetadata {
  tenantId: string;
  tenantType: ContextType;
  tenantName: string;
  ownerId?: string; // For Organization/Team/Partner
  parentOrgId?: string; // For Team/Partner
}

/**
 * Tenant Context Service
 * 
 * Manages global tenant context for multi-tenant isolation
 * Reuses existing WorkspaceContextService for context switching
 * Provides tenant_id for all audit operations
 */
@Injectable({
  providedIn: 'root'
})
export class TenantContextService {
  private readonly workspaceContext = inject(WorkspaceContextService);
  private readonly firebaseService = inject(FirebaseService);

  // ============================================================================
  // Core Signals: Tenant Context
  // ============================================================================

  /**
   * Current Tenant ID
   * Extracted from workspace context (User/Organization/Team/Partner)
   * 
   * Tenant ID Mapping:
   * - User: user.uid
   * - Organization: organization.id
   * - Team: team.organization_id (parent organization)
   * - Partner: partner.organization_id (parent organization)
   */
  readonly currentTenantId: Signal<string | null> = computed(() => {
    const contextType = this.workspaceContext.contextType();
    const contextId = this.workspaceContext.contextId();

    if (!contextType || !contextId) {
      // Fallback to current user if no workspace context
      return this.firebaseService.getCurrentUserId();
    }

    switch (contextType) {
      case 'user':
        return contextId; // user.uid

      case 'organization':
        return contextId; // organization.id

      case 'team': {
        // Team belongs to an organization, use organization_id as tenant
        const team = this.workspaceContext.teams()?.find(t => t.id === contextId);
        return team?.organization_id ?? null;
      }

      case 'partner': {
        // Partner belongs to an organization, use organization_id as tenant
        const partner = this.workspaceContext.partners()?.find(p => p.id === contextId);
        return partner?.organization_id ?? null;
      }

      default:
        return null;
    }
  });

  /**
   * Tenant Type
   * Current workspace context type
   */
  readonly tenantType: Signal<ContextType | null> = computed(() => {
    return this.workspaceContext.contextType();
  });

  /**
   * Is Superadmin
   * Superadmins can access all tenants (cross-tenant queries)
   * 
   * TODO: Integrate with actual role/permission system
   * For now, check custom claim 'role' === 'superadmin' from Firebase Auth
   */
  readonly isSuperAdmin: Signal<boolean> = computed(() => {
    const user = this.firebaseService.getCurrentUser();
    if (!user) return false;

    // Check custom claims (requires Firebase Admin SDK to set)
    const customClaims = (user as any).reloadUserInfo?.customAttributes;
    if (customClaims) {
      try {
        const claims = JSON.parse(customClaims);
        return claims.role === 'superadmin' || claims.is_superadmin === true;
      } catch {
        return false;
      }
    }

    return false;
  });

  /**
   * Tenant Metadata
   * Provides additional context about the current tenant
   */
  readonly tenantMetadata: Signal<TenantMetadata | null> = computed(() => {
    const tenantId = this.currentTenantId();
    const tenantType = this.tenantType();

    if (!tenantId || !tenantType) return null;

    switch (tenantType) {
      case 'user': {
        const user = this.workspaceContext.currentWorkspace()?.user;
        return user ? {
          tenantId,
          tenantType,
          tenantName: user.name || user.email || 'User'
        } : null;
      }

      case 'organization': {
        const org = this.workspaceContext.organizations()?.find(o => o.id === tenantId);
        return org ? {
          tenantId,
          tenantType,
          tenantName: org.name,
          ownerId: org.created_by || org.creator_id
        } : null;
      }

      case 'team': {
        const contextId = this.workspaceContext.contextId();
        const team = this.workspaceContext.teams()?.find(t => t.id === contextId);
        return team ? {
          tenantId, // organization_id
          tenantType,
          tenantName: team.name,
          parentOrgId: team.organization_id
        } : null;
      }

      case 'partner': {
        const contextId = this.workspaceContext.contextId();
        const partner = this.workspaceContext.partners()?.find(p => p.id === contextId);
        return partner ? {
          tenantId, // organization_id
          tenantType,
          tenantName: partner.name,
          parentOrgId: partner.organization_id
        } : null;
      }

      default:
        return null;
    }
  });

  // ============================================================================
  // Validation Methods
  // ============================================================================

  /**
   * Ensure Tenant ID Exists
   * Throws error if no tenant context is available
   * 
   * Use this before any audit operation to ensure tenant isolation
   */
  ensureTenantId(): string {
    const tenantId = this.currentTenantId();
    if (!tenantId) {
      throw new Error(
        '[TenantContextService] No tenant context available. ' +
        'User must be authenticated and have a workspace context.'
      );
    }
    return tenantId;
  }

  /**
   * Get Tenant ID or Throw
   * Alias for ensureTenantId()
   */
  getTenantIdOrThrow(): string {
    return this.ensureTenantId();
  }

  /**
   * Has Tenant Context
   * Check if tenant context is available (non-throwing)
   */
  hasTenantContext(): boolean {
    return this.currentTenantId() !== null;
  }

  // ============================================================================
  // Context Switching (Delegates to WorkspaceContextService)
  // ============================================================================

  /**
   * Switch to User Context
   * Delegates to WorkspaceContextService
   */
  switchToUser(userId: string): void {
    this.workspaceContext.switchToUser(userId);
  }

  /**
   * Switch to Organization Context
   * Delegates to WorkspaceContextService
   */
  switchToOrganization(orgId: string): void {
    this.workspaceContext.switchToOrganization(orgId);
  }

  /**
   * Switch to Team Context
   * Delegates to WorkspaceContextService
   */
  switchToTeam(teamId: string): void {
    this.workspaceContext.switchToTeam(teamId);
  }

  /**
   * Switch to Partner Context
   * Delegates to WorkspaceContextService
   */
  switchToPartner(partnerId: string): void {
    this.workspaceContext.switchToPartner(partnerId);
  }
}
