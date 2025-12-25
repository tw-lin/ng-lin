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
  readonly eventType = 'blueprint.created' as const;

  constructor(payload: { blueprint: Blueprint; userId: string }) {
    super(payload, {
      aggregateId: payload.blueprint.id,
      aggregateType: 'Blueprint',
      aggregateVersion: 1
    });
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
  readonly eventType = 'blueprint.updated' as const;

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
  readonly eventType = 'blueprint.published' as const;

  constructor(payload: { blueprintId: string; userId: string }) {
    super(payload, {
      aggregateId: payload.blueprintId,
      aggregateType: 'Blueprint'
    });
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
  readonly eventType = 'blueprint.archived' as const;

  constructor(payload: { blueprintId: string; userId: string }) {
    super(payload, {
      aggregateId: payload.blueprintId,
      aggregateType: 'Blueprint'
    });
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
  readonly eventType = 'blueprint.deleted' as const;

  constructor(payload: {
    blueprintId: string;
    soft: boolean;
    userId: string;
  }) {
    super(payload, {
      aggregateId: payload.blueprintId,
      aggregateType: 'Blueprint'
    });
  }
}
