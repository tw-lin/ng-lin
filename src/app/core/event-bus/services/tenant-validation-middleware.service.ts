/**
 * Tenant Validation Middleware
 *
 * Validates and enforces tenant isolation on all published events.
 * Automatically injects tenant_id from TenantContextService if missing.
 *
 * Architecture:
 * - Intercepts events before publishing to Event Bus
 * - Validates tenant_id exists in event metadata
 * - Auto-injects tenant_id from TenantContextService when missing
 * - Rejects events without tenant context (throws error)
 * - Supports superadmin cross-tenant operations
 *
 * Tenant Validation Flow:
 * ```
 * Event Published
 *   ↓
 * Middleware intercepts
 *   ↓
 * Check event.metadata.tenantId
 *   ├─ Exists → Validate format → Pass through
 *   └─ Missing → Check TenantContextService
 *       ├─ Has tenant → Auto-inject → Pass through
 *       └─ No tenant → REJECT (throw error)
 * ```
 *
 * Follows: docs/⭐️/Global-Audit-Log-系統拆解與對齊方案.md (Part V - Phase 1 - Task 1.2 Part 3)
 *
 * @module core/event-bus/services
 * @version 1.0.0
 */

import { Injectable, inject } from '@angular/core';
import { DomainEvent } from '../models/base-event';
import { TenantContextService } from './tenant-context.service';

/**
 * Extended metadata interface with tenant_id
 */
export interface TenantAwareMetadata {
  version: string;
  source: string;
  correlationId?: string;
  causationId?: string;
  tenantId?: string | null;
  allowCrossTenant?: boolean; // Superadmin flag
}

/**
 * Tenant validation error
 */
export class TenantValidationError extends Error {
  constructor(
    message: string,
    public readonly event: DomainEvent
  ) {
    super(message);
    this.name = 'TenantValidationError';
  }
}

/**
 * Tenant Validation Middleware Service
 *
 * Enforces tenant isolation on all events published through Event Bus
 */
@Injectable({ providedIn: 'root' })
export class TenantValidationMiddleware {
  private readonly tenantContext = inject(TenantContextService);

  /**
   * Validate and enrich event with tenant_id
   *
   * Validation Rules:
   * 1. If event has tenant_id → Validate format (non-empty string)
   * 2. If event missing tenant_id → Auto-inject from TenantContextService
   * 3. If no tenant context available → Throw TenantValidationError
   * 4. Superadmin bypass: allowCrossTenant flag skips validation
   *
   * @param event - Domain event to validate
   * @returns Enhanced event with guaranteed tenant_id
   * @throws TenantValidationError if tenant context unavailable
   */
  validateAndEnrich<T extends DomainEvent>(event: T): T {
    const metadata = event.metadata as TenantAwareMetadata;

    // Skip validation for cross-tenant operations (superadmin)
    if (metadata.allowCrossTenant === true) {
      return event;
    }

    // Case 1: Event already has tenant_id
    if (metadata.tenantId) {
      this.validateTenantId(metadata.tenantId, event);
      return event;
    }

    // Case 2: Event missing tenant_id - auto-inject
    try {
      const currentTenantId = this.tenantContext.ensureTenantId();

      // Inject tenant_id into event metadata
      const enrichedMetadata: TenantAwareMetadata = {
        ...metadata,
        tenantId: currentTenantId
      };

      // Return event with enriched metadata
      return {
        ...event,
        metadata: enrichedMetadata
      } as T;
    } catch (error) {
      // Case 3: No tenant context available - reject event
      throw new TenantValidationError(
        `Event ${event.eventType} rejected: No tenant context available. ` +
          `Events must be published within a tenant context (user, organization, team, partner, bot). ` +
          `Current context type: ${this.tenantContext.contextType() || 'none'}`,
        event
      );
    }
  }

  /**
   * Validate batch of events
   *
   * @param events - Array of events to validate
   * @returns Array of enriched events
   * @throws TenantValidationError if any event fails validation
   */
  validateAndEnrichBatch<T extends DomainEvent>(events: T[]): T[] {
    return events.map(event => this.validateAndEnrich(event));
  }

  /**
   * Validate tenant_id format
   *
   * Rules:
   * - Must be non-empty string
   * - Must not contain whitespace
   * - Must be alphanumeric with hyphens/underscores only
   *
   * @param tenantId - Tenant ID to validate
   * @param event - Event for error context
   * @throws TenantValidationError if validation fails
   */
  private validateTenantId(tenantId: string, event: DomainEvent): void {
    // Rule 1: Non-empty string
    if (!tenantId || tenantId.trim().length === 0) {
      throw new TenantValidationError(`Event ${event.eventType} rejected: tenant_id cannot be empty`, event);
    }

    // Rule 2: No whitespace
    if (/\s/.test(tenantId)) {
      throw new TenantValidationError(`Event ${event.eventType} rejected: tenant_id cannot contain whitespace`, event);
    }

    // Rule 3: Alphanumeric + hyphens/underscores only
    if (!/^[a-zA-Z0-9_-]+$/.test(tenantId)) {
      throw new TenantValidationError(
        `Event ${event.eventType} rejected: tenant_id must be alphanumeric with hyphens/underscores only`,
        event
      );
    }
  }

  /**
   * Check if current user is superadmin
   * Superadmins can publish cross-tenant events
   *
   * @returns True if superadmin
   */
  isSuperAdmin(): boolean {
    return this.tenantContext.isSuperAdmin();
  }

  /**
   * Get current tenant ID (or null if none)
   *
   * @returns Current tenant ID
   */
  getCurrentTenantId(): string | null {
    return this.tenantContext.currentTenantId();
  }

  /**
   * Check if tenant context is available
   *
   * @returns True if tenant context available
   */
  hasTenantContext(): boolean {
    return this.tenantContext.hasTenantContext();
  }
}
