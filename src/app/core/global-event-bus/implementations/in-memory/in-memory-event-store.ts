import { Injectable, signal } from '@angular/core';
import { DomainEvent } from '../../models';
import { EventCriteria, IEventStore } from '../../interfaces';

/**
 * In-Memory Event Store
 * 
 * Simple in-memory implementation of event store for development and testing.
 * For production, use a persistent store like PostgreSQL or MongoDB.
 */
@Injectable({
  providedIn: 'root'
})
export class InMemoryEventStore implements IEventStore {
  /** All stored events */
  private readonly events = signal<DomainEvent[]>([]);
  
  /**
   * Append a single event to the store
   */
  async append(event: DomainEvent): Promise<void> {
    this.events.update(events => [...events, event]);
  }
  
  /**
   * Append multiple events in a batch
   */
  async appendBatch(events: DomainEvent[]): Promise<void> {
    this.events.update(existing => [...existing, ...events]);
  }
  
  /**
   * Get events matching the criteria
   */
  async getEvents(criteria: EventCriteria): Promise<DomainEvent[]> {
    let filtered = this.events();
    
    // Filter by event type
    if (criteria.eventType) {
      filtered = filtered.filter(e => e.eventType === criteria.eventType);
    }
    
    // Filter by aggregate ID
    if (criteria.aggregateId) {
      filtered = filtered.filter(e => e.aggregateId === criteria.aggregateId);
    }
    
    // Filter by aggregate type
    if (criteria.aggregateType) {
      filtered = filtered.filter(e => e.aggregateType === criteria.aggregateType);
    }
    
    // Filter by date range
    if (criteria.since) {
      filtered = filtered.filter(e => e.timestamp >= criteria.since!);
    }
    
    if (criteria.until) {
      filtered = filtered.filter(e => e.timestamp <= criteria.until!);
    }
    
    // Sort
    const order = criteria.order ?? 'asc';
    filtered = [...filtered].sort((a, b) => {
      const diff = a.timestamp.getTime() - b.timestamp.getTime();
      return order === 'asc' ? diff : -diff;
    });
    
    // Pagination
    if (criteria.offset !== undefined) {
      filtered = filtered.slice(criteria.offset);
    }
    
    if (criteria.limit !== undefined) {
      filtered = filtered.slice(0, criteria.limit);
    }
    
    return filtered;
  }
  
  /**
   * Get all events for a specific aggregate
   */
  async getEventsByAggregate(
    aggregateId: string,
    aggregateType: string
  ): Promise<DomainEvent[]> {
    return this.getEvents({
      aggregateId,
      aggregateType,
      order: 'asc'
    });
  }
  
  /**
   * Get events since a specific timestamp
   */
  async getEventsSince(timestamp: Date): Promise<DomainEvent[]> {
    return this.getEvents({
      since: timestamp,
      order: 'asc'
    });
  }
  
  /**
   * Clear all events (mainly for testing)
   */
  async clear(): Promise<void> {
    this.events.set([]);
  }
  
  /**
   * Get total event count
   */
  count(): number {
    return this.events().length;
  }
}
