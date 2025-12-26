import { DomainEvent } from '@core/event-bus/models';

/**
 * Blueprint-scoped DomainEvent aligned to the core event bus contract.
 */
export class BlueprintDomainEvent<T = unknown> extends DomainEvent<T> {
  readonly eventType: string;

  constructor(eventType: string, payload: T, blueprintId: string, source: string, correlationId?: string) {
    super(payload, {
      aggregateId: blueprintId || 'blueprint',
      aggregateType: 'blueprint',
      source: source || 'blueprint',
      correlationId
    });
    this.eventType = eventType;
  }
}
