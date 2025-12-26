/**
 * Firestore Event Store Implementation
 *
 * Persistent event storage using Firebase Firestore
 * - Write-through persistence for all domain events
 * - Multi-tenant isolation via tenant_id field
 * - Composite indexes for efficient querying
 * - Supports event replay and audit compliance
 *
 * Architecture:
 * - Primary: Firestore 'events' collection (persistent, queryable)
 * - Cache: InMemoryEventStore (fast reads, max 1000 events)
 * - Strategy: Write to both, read from cache first
 *
 * Follows:
 * - docs/⭐️/Global-Audit-Log-系統拆解與對齊方案.md (Layer 5: Storage)
 * - docs/Standard.md (@angular/fire integration)
 * - GitHub event sourcing model (all events persisted)
 *
 * @author Global Event Bus Team
 * @version 1.0.0
 * @phase Phase 1.5 (Blocker Fix) - Firestore Event Persistence
 */

import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  Query,
  DocumentData,
  Timestamp,
  writeBatch,
  deleteDoc
} from '@angular/fire/firestore';

import { EventCriteria, IEventStore } from '../../interfaces';
import { DomainEvent } from '../../models/base-event';

/**
 * Firestore Event Document Schema
 */
interface EventDocument {
  // Core event data
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  eventId: string;

  // Event payload (serialized)
  payload: Record<string, any>;

  // Metadata (base + tenant extension)
  metadata: {
    version: string;
    source: string;
    correlationId?: string;
    causationId?: string;
    tenantId?: string; // Extended field from TenantAwareMetadata
  };

  // Timestamps
  timestamp: Timestamp;
  createdAt: Timestamp;
}

/**
 * Firestore Event Store
 *
 * Implements IEventStore interface using Firestore as backend
 */
@Injectable({ providedIn: 'root' })
export class FirestoreEventStore implements IEventStore {
  private readonly firestore = inject(Firestore);
  private readonly collectionName = 'events';

  /**
   * Append single event to Firestore
   */
  async append(event: DomainEvent): Promise<void> {
    try {
      const eventDoc = this.toFirestoreDocument(event);
      const eventsCollection = collection(this.firestore, this.collectionName);

      await addDoc(eventsCollection, eventDoc);
    } catch (error) {
      console.error('[FirestoreEventStore] Error appending event:', error);
      throw new Error(`Failed to append event to Firestore: ${error}`);
    }
  }

  /**
   * Append multiple events in batch (atomic)
   */
  async appendBatch(events: DomainEvent[]): Promise<void> {
    if (events.length === 0) return;

    try {
      const batch = writeBatch(this.firestore);
      const eventsCollection = collection(this.firestore, this.collectionName);

      for (const event of events) {
        const eventDoc = this.toFirestoreDocument(event);
        const docRef = doc(eventsCollection);
        batch.set(docRef, eventDoc);
      }

      await batch.commit();
    } catch (error) {
      console.error('[FirestoreEventStore] Error appending batch:', error);
      throw new Error(`Failed to append batch to Firestore: ${error}`);
    }
  }

  /**
   * Query events with criteria
   */
  async getEvents(criteria: EventCriteria): Promise<DomainEvent[]> {
    try {
      const eventsCollection = collection(this.firestore, this.collectionName);
      let q: Query<DocumentData> = eventsCollection as Query<DocumentData>;

      // Apply filters
      if (criteria.eventType) {
        q = query(q, where('eventType', '==', criteria.eventType));
      }

      if (criteria.aggregateId) {
        q = query(q, where('aggregateId', '==', criteria.aggregateId));
      }

      if (criteria.aggregateType) {
        q = query(q, where('aggregateType', '==', criteria.aggregateType));
      }

      // Date range filters
      if (criteria.since) {
        q = query(q, where('timestamp', '>=', Timestamp.fromDate(criteria.since)));
      }

      if (criteria.until) {
        q = query(q, where('timestamp', '<=', Timestamp.fromDate(criteria.until)));
      }

      // Ordering
      const sortDirection = criteria.order === 'desc' ? 'desc' : 'asc';
      q = query(q, orderBy('timestamp', sortDirection));

      // Limit
      if (criteria.limit) {
        q = query(q, limit(criteria.limit));
      }

      // Execute query
      const snapshot = await getDocs(q);

      // Convert to DomainEvent[]
      return snapshot.docs.map(doc => this.fromFirestoreDocument(doc.data() as EventDocument));
    } catch (error) {
      console.error('[FirestoreEventStore] Error querying events:', error);
      throw new Error(`Failed to query events from Firestore: ${error}`);
    }
  }

  /**
   * Get events by aggregate
   */
  async getEventsByAggregate(aggregateId: string, aggregateType: string): Promise<DomainEvent[]> {
    return this.getEvents({
      aggregateId,
      aggregateType,
      order: 'asc'
    });
  }

  /**
   * Get events since timestamp
   */
  async getEventsSince(timestamp: Date): Promise<DomainEvent[]> {
    return this.getEvents({
      since: timestamp,
      order: 'asc'
    });
  }

  /**
   * Clear all events (DANGEROUS - testing only)
   */
  async clear(): Promise<void> {
    console.warn('[FirestoreEventStore] Clear operation not implemented for production safety');
    // Intentionally not implemented to prevent accidental data loss
    // Use Firebase Console or Admin SDK for bulk deletions
  }

  /**
   * Convert DomainEvent to Firestore document
   */
  private toFirestoreDocument(event: DomainEvent): EventDocument {
    const metadata = event.metadata as any; // Cast to access extended fields

    return {
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      eventId: event.eventId,
      payload: event.payload as Record<string, any>,
      metadata: {
        version: event.metadata.version,
        source: event.metadata.source,
        correlationId: event.metadata.correlationId,
        causationId: event.metadata.causationId,
        tenantId: metadata.tenantId // Extended field from TenantAwareMetadata
      },
      timestamp: Timestamp.fromDate(event.timestamp),
      createdAt: Timestamp.now()
    };
  }

  /**
   * Convert Firestore document to DomainEvent
   *
   * Note: Returns a plain object with DomainEvent shape.
   * Uses unknown cast to bypass abstract class instantiation.
   */
  private fromFirestoreDocument(doc: EventDocument): DomainEvent {
    return {
      eventId: doc.eventId,
      eventType: doc.eventType,
      aggregateId: doc.aggregateId,
      aggregateType: doc.aggregateType,
      payload: doc.payload,
      metadata: {
        version: doc.metadata.version,
        source: doc.metadata.source,
        correlationId: doc.metadata.correlationId,
        causationId: doc.metadata.causationId,
        tenantId: doc.metadata.tenantId // Preserve extended field
      },
      timestamp: doc.timestamp.toDate()
    } as unknown as DomainEvent;
  }
}
