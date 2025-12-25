import type { DomainEvent } from '../models/base-event';

export async function waitForEvent(eventBus: any, eventType: string, timeout = 5000): Promise<DomainEvent<any>> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout')), timeout);
    eventBus.subscribe(eventType, (event: DomainEvent<any>) => {
      clearTimeout(timer);
      resolve(event);
    });
  });
}

export function assertEventPublished(events: Array<DomainEvent<any>>, eventType: string, payload?: any): void {
  const found = events.find(e => e.eventType === eventType);
  if (!found) {
    throw new Error(`Event ${eventType} not found`);
  }
  if (payload && JSON.stringify(found.payload) !== JSON.stringify(payload)) {
    throw new Error('Payload mismatch');
  }
}
