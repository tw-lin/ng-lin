/**
 * Blueprint Domain Events
 * 
 * Defines all events related to blueprint lifecycle and operations.
 * 
 * @module DomainEvents/Blueprint
 */

import { DomainEvent } from '../models/base-event';

/**
 * Blueprint payload interface
 */
export interface Blueprint {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly ownerType: 'user' | 'organization';
  readonly ownerId: string;
  readonly status: 'draft' | 'active' | 'archived';
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Event: Blueprint Created
 * 
 * Published when a new blueprint is created.
 */
export class BlueprintCreatedEvent extends DomainEvent<{
  blueprint: Blueprint;
  userId: string;
}> {
  override readonly eventType = 'blueprint.created' as const;
  override readonly payload: { blueprint: Blueprint; userId: string };

  constructor(payload: { blueprint: Blueprint; userId: string }) {
    super(payload, {
      aggregateId: payload.blueprint.id,
      aggregateType: 'Blueprint',
      aggregateVersion: 1
    });
    this.payload = payload;
  }
}

/**
 * Event: Blueprint Updated
 * 
 * Published when blueprint is modified.
 */
export class BlueprintUpdatedEvent extends DomainEvent<{
  blueprintId: string;
  changes: Partial<Blueprint>;
  previousValues: Partial<Blueprint>;
  userId: string;
}> {
  override readonly eventType = 'blueprint.updated' as const;
  override readonly payload: {
    blueprintId: string;
    changes: Partial<Blueprint>;
    previousValues: Partial<Blueprint>;
    userId: string;
  };

  constructor(payload: {
    blueprintId: string;
    changes: Partial<Blueprint>;
    previousValues: Partial<Blueprint>;
    userId: string;
  }) {
    super(payload, {
      aggregateId: payload.blueprintId,
      aggregateType: 'Blueprint'
    });
    this.payload = payload;
  }
}

/**
 * Event: Blueprint Published
 * 
 * Published when blueprint status changes to active.
 */
export class BlueprintPublishedEvent extends DomainEvent<{
  blueprintId: string;
  userId: string;
}> {
  override readonly eventType = 'blueprint.published' as const;
  override readonly payload: { blueprintId: string; userId: string };

  constructor(payload: { blueprintId: string; userId: string }) {
    super(payload, {
      aggregateId: payload.blueprintId,
      aggregateType: 'Blueprint'
    });
    this.payload = payload;
  }
}

/**
 * Event: Blueprint Archived
 * 
 * Published when blueprint is archived.
 */
export class BlueprintArchivedEvent extends DomainEvent<{
  blueprintId: string;
  userId: string;
}> {
  override readonly eventType = 'blueprint.archived' as const;
  override readonly payload: { blueprintId: string; userId: string };

  constructor(payload: { blueprintId: string; userId: string }) {
    super(payload, {
      aggregateId: payload.blueprintId,
      aggregateType: 'Blueprint'
    });
    this.payload = payload;
  }
}

/**
 * Event: Blueprint Deleted
 * 
 * Published when blueprint is deleted.
 */
export class BlueprintDeletedEvent extends DomainEvent<{
  blueprintId: string;
  soft: boolean;
  userId: string;
}> {
  override readonly eventType = 'blueprint.deleted' as const;
  override readonly payload: {
    blueprintId: string;
    soft: boolean;
    userId: string;
  };

  constructor(payload: {
    blueprintId: string;
    soft: boolean;
    userId: string;
  }) {
    super(payload, {
      aggregateId: payload.blueprintId,
      aggregateType: 'Blueprint'
    });
    this.payload = payload;
  }
}
