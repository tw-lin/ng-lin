# Event Bus System - Deployment Guide

> **Version**: 1.0.0  
> **Last Updated**: 2025-12-26  
> **Status**: Production Ready

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Deployment Steps](#deployment-steps)
4. [Implementation Strategies](#implementation-strategies)
5. [Configuration](#configuration)
6. [Security Rules Deployment](#security-rules-deployment)
7. [Testing](#testing)
8. [Rollback Procedures](#rollback-procedures)
9. [Troubleshooting](#troubleshooting)
10. [Migration Guide](#migration-guide)
11. [Performance Tuning](#performance-tuning)

---

## Overview

This guide provides comprehensive instructions for deploying the Event Bus System in production environments. The Event Bus enables decoupled, event-driven communication between modules with support for both in-memory and distributed (Firebase-backed) implementations.

### Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Application Layer                    │
│  (Components, Services, EventConsumers)             │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│              IEventBus Interface                     │
│  (publish, subscribe, publishBatch, observe)        │
└─────────────────────┬───────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
┌───────▼─────────┐      ┌─────────▼──────────┐
│ InMemoryEventBus│      │ FirebaseEventBus   │
│ (Local Events)  │      │ (Distributed)      │
└───────┬─────────┘      └─────────┬──────────┘
        │                          │
        │                  ┌───────▼────────┐
        │                  │ IEventStore    │
        │                  │ (Firestore)    │
        │                  └────────────────┘
        │
┌───────▼─────────────────────────────────────────┐
│         Event Consumers & Services               │
│  (AuditLogService, AuthAuditService, etc.)      │
└──────────────────────────────────────────────────┘
```

### Key Features

- **Dual Implementation**: InMemoryEventBus (zero latency) and FirebaseEventBus (distributed real-time)
- **Multi-Tenant Isolation**: Events scoped by blueprintId with Security Rules enforcement
- **Persistent Event Store**: Optional Firestore-backed event sourcing
- **Automatic Retry**: Configurable retry logic with exponential backoff
- **Dead Letter Queue**: Failed events captured for investigation
- **Wildcard Subscriptions**: Subscribe to patterns (e.g., `task.*`, `*.created`)
- **Real-time Sync**: Cross-server event synchronization via Firebase Realtime Database

---

## Prerequisites

### Required Software

| Software | Minimum Version | Recommended | Purpose |
|----------|----------------|-------------|---------|
| Node.js | 20.0.0 | 20.11.0 | Runtime environment |
| npm | 10.0.0 | 10.2.0 | Package manager |
| Firebase CLI | 13.0.0 | 13.1.0 | Firebase deployment |
| Angular CLI | 19.0.0 | 20.0.0 | Angular tooling |
| @angular/fire | 18.0.0 | 18.0.1 | Firebase integration |

### Firebase Project Setup

1. **Firebase Project**: Active Firebase project with Blaze plan (for Firestore)
2. **Firestore Database**: Firestore database in Native mode
3. **Firebase Hosting**: (Optional) For Angular application hosting
4. **Service Account**: JSON key file for server-side operations (if using Cloud Functions)

### Required Permissions

- Firebase Admin SDK access
- Firestore read/write permissions
- Firebase Realtime Database read/write permissions (for FirebaseEventBus)
- Firebase Security Rules deployment permissions

### Environment Variables

```bash
# .env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

---

## Deployment Steps

### Step 1: Install Dependencies

```bash
# Install Firebase and AngularFire packages
npm install @angular/fire@latest firebase@latest

# Install Event Bus implementation (if packaged separately)
# npm install @gighub/event-bus@latest

# Install development dependencies
npm install --save-dev @angular-devkit/build-angular@latest
```

### Step 2: Configure Firestore Event Store

#### 2.1 Create Firestore Collections

The Event Store uses the following Firestore structure:

```
/event-store/{blueprintId}
  /events/{eventId}
    - type: string               # e.g., "task.created"
    - aggregateId: string        # Entity ID (e.g., task ID)
    - aggregateType: string      # Entity type (e.g., "Task")
    - version: number            # Event version for ordering
    - timestamp: Timestamp       # Event occurrence time
    - actor: string              # User ID who triggered event
    - data: map                  # Event payload
    - metadata: map              # Correlation ID, causation ID, etc.
    
  /snapshots/{aggregateId}
    - aggregateType: string
    - version: number            # Last snapshot version
    - state: map                 # Aggregate state snapshot
    - timestamp: Timestamp
```

#### 2.2 Create Firestore Indexes

Create these composite indexes in Firebase Console or via `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "events",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "aggregateId", "order": "ASCENDING" },
        { "fieldPath": "version", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "events",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "aggregateType", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "events",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "events",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "timestamp", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Deploy indexes:

```bash
firebase deploy --only firestore:indexes
```

### Step 3: Configure Event Store Service

#### 3.1 Create Event Store Configuration

```typescript
// src/app/core/event-bus/config/event-store.config.ts
import { InjectionToken } from '@angular/core';

export interface EventStoreConfig {
  collectionPrefix: string;
  enableSnapshots: boolean;
  snapshotFrequency: number;
  retentionDays?: number;
}

export const EVENT_STORE_CONFIG = new InjectionToken<EventStoreConfig>('EVENT_STORE_CONFIG');

export const defaultEventStoreConfig: EventStoreConfig = {
  collectionPrefix: 'event-store',
  enableSnapshots: true,
  snapshotFrequency: 10, // Create snapshot every 10 events
  retentionDays: 90 // Keep events for 90 days
};
```

#### 3.2 Implement Firestore Event Store

```typescript
// src/app/core/event-bus/services/firestore-event-store.service.ts
import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, query, where, orderBy, getDocs, Timestamp } from '@angular/fire/firestore';
import { IEventStore, DomainEvent } from '../interfaces/event-bus.interface';
import { EVENT_STORE_CONFIG, EventStoreConfig } from '../config/event-store.config';

@Injectable({ providedIn: 'root' })
export class FirestoreEventStore implements IEventStore {
  private firestore = inject(Firestore);
  private config = inject(EVENT_STORE_CONFIG);

  async append(blueprintId: string, event: DomainEvent): Promise<void> {
    const eventsRef = collection(
      this.firestore, 
      `${this.config.collectionPrefix}/${blueprintId}/events`
    );
    
    await addDoc(eventsRef, {
      type: event.type,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      version: event.version,
      timestamp: Timestamp.fromDate(event.timestamp),
      actor: event.actor,
      data: event.data,
      metadata: event.metadata || {}
    });
  }

  async appendBatch(blueprintId: string, events: DomainEvent[]): Promise<void> {
    const batch = writeBatch(this.firestore);
    const eventsRef = collection(
      this.firestore, 
      `${this.config.collectionPrefix}/${blueprintId}/events`
    );

    for (const event of events) {
      const docRef = doc(eventsRef);
      batch.set(docRef, {
        type: event.type,
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        version: event.version,
        timestamp: Timestamp.fromDate(event.timestamp),
        actor: event.actor,
        data: event.data,
        metadata: event.metadata || {}
      });
    }

    await batch.commit();
  }

  async getEvents(
    blueprintId: string, 
    criteria?: EventCriteria
  ): Promise<DomainEvent[]> {
    const eventsRef = collection(
      this.firestore, 
      `${this.config.collectionPrefix}/${blueprintId}/events`
    );
    
    let q = query(eventsRef);

    if (criteria?.type) {
      q = query(q, where('type', '==', criteria.type));
    }
    if (criteria?.aggregateId) {
      q = query(q, where('aggregateId', '==', criteria.aggregateId));
    }
    if (criteria?.aggregateType) {
      q = query(q, where('aggregateType', '==', criteria.aggregateType));
    }

    q = query(q, orderBy('timestamp', 'desc'));

    if (criteria?.limit) {
      q = query(q, limit(criteria.limit));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.mapToEvent(doc.data()));
  }

  private mapToEvent(data: any): DomainEvent {
    return {
      type: data.type,
      aggregateId: data.aggregateId,
      aggregateType: data.aggregateType,
      version: data.version,
      timestamp: data.timestamp.toDate(),
      actor: data.actor,
      data: data.data,
      metadata: data.metadata
    };
  }
}
```

### Step 4: Configure InMemoryEventBus

#### 4.1 Application Configuration

```typescript
// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { InMemoryEventBus } from '@core/event-bus/implementations/in-memory-event-bus';
import { EVENT_BUS_CONFIG, EventBusConfig } from '@core/event-bus/config/event-bus.config';
import { IEventBus, EVENT_BUS } from '@core/event-bus/interfaces/event-bus.interface';

const eventBusConfig: EventBusConfig = {
  retryAttempts: 3,
  retryDelay: 1000,
  enableDeadLetterQueue: true,
  maxQueueSize: 10000
};

export const appConfig: ApplicationConfig = {
  providers: [
    // Event Bus Configuration
    { provide: EVENT_BUS_CONFIG, useValue: eventBusConfig },
    { provide: EVENT_BUS, useClass: InMemoryEventBus },
    
    // ... other providers
  ]
};
```

#### 4.2 InMemoryEventBus Features

- **Zero Latency**: Events delivered synchronously within the same process
- **Automatic Retry**: Failed handlers retried with exponential backoff
- **Dead Letter Queue**: Failed events after max retries captured for analysis
- **Wildcard Subscriptions**: Support for pattern-based subscriptions

### Step 5: Configure FirebaseEventBus (Optional - Distributed Events)

#### 5.1 Firebase Realtime Database Structure

```
/events/{blueprintId}/{eventId}
  - type: string
  - aggregateId: string
  - aggregateType: string
  - version: number
  - timestamp: number (Unix ms)
  - actor: string
  - data: object
  - metadata: object
  - processed: boolean
```

#### 5.2 Application Configuration

```typescript
// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideDatabase, getDatabase } from '@angular/fire/database';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { FirebaseEventBus } from '@core/event-bus/implementations/firebase-event-bus';
import { IEventBus, EVENT_BUS } from '@core/event-bus/interfaces/event-bus.interface';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideDatabase(() => getDatabase()),
    provideFirestore(() => getFirestore()),
    
    // Use FirebaseEventBus for distributed events
    { provide: EVENT_BUS, useClass: FirebaseEventBus },
    
    // Event Store for persistence
    { provide: IEventStore, useClass: FirestoreEventStore },
    
    // ... other providers
  ]
};
```

#### 5.3 FirebaseEventBus Features

- **Real-time Sync**: Events synchronized across multiple servers
- **Persistent Storage**: Events stored in Firestore for event sourcing
- **Offline Support**: Events queued locally and synced when online
- **Multi-server**: Events published by one server received by all servers

### Step 6: Deploy Security Rules

#### 6.1 Firestore Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Event Store Rules
    match /event-store/{blueprintId}/events/{eventId} {
      // Allow authenticated Blueprint members to read events
      allow read: if isAuthenticated() && 
                     isBlueprintMember(blueprintId) &&
                     isMemberActive(blueprintId);
      
      // Allow services to append events (requires service role)
      allow create: if isAuthenticated() && 
                       isBlueprintMember(blueprintId) &&
                       hasPermission(blueprintId, 'event:create');
      
      // Events are immutable - no updates or deletes
      allow update, delete: if false;
    }
    
    match /event-store/{blueprintId}/snapshots/{aggregateId} {
      // Allow authenticated Blueprint members to read snapshots
      allow read: if isAuthenticated() && 
                     isBlueprintMember(blueprintId) &&
                     isMemberActive(blueprintId);
      
      // Allow services to create/update snapshots
      allow create, update: if isAuthenticated() && 
                               isBlueprintMember(blueprintId) &&
                               hasPermission(blueprintId, 'event:create');
      
      // Snapshots are immutable - no deletes
      allow delete: if false;
    }
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getCurrentUserId() {
      return request.auth.uid;
    }
    
    function isBlueprintMember(blueprintId) {
      let memberId = getCurrentUserId() + '_' + blueprintId;
      return exists(/databases/$(database)/documents/blueprintMembers/$(memberId));
    }
    
    function isMemberActive(blueprintId) {
      let memberId = getCurrentUserId() + '_' + blueprintId;
      let member = get(/databases/$(database)/documents/blueprintMembers/$(memberId));
      return member.data.status == 'active';
    }
    
    function hasPermission(blueprintId, permission) {
      let memberId = getCurrentUserId() + '_' + blueprintId;
      let member = get(/databases/$(database)/documents/blueprintMembers/$(memberId));
      return permission in member.data.permissions;
    }
  }
}
```

#### 6.2 Firebase Realtime Database Security Rules

```json
{
  "rules": {
    "events": {
      "$blueprintId": {
        ".read": "auth != null && root.child('blueprintMembers').child(auth.uid + '_' + $blueprintId).exists()",
        ".write": "auth != null && root.child('blueprintMembers').child(auth.uid + '_' + $blueprintId).child('permissions').child('event:create').val() == true",
        "$eventId": {
          ".validate": "newData.hasChildren(['type', 'aggregateId', 'aggregateType', 'version', 'timestamp', 'actor', 'data'])"
        }
      }
    }
  }
}
```

#### 6.3 Deploy Security Rules

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Realtime Database rules
firebase deploy --only database
```

### Step 7: Local Testing with Firebase Emulators

#### 7.1 Start Emulators

```bash
# Install emulators (if not already installed)
firebase init emulators

# Start Firestore and Realtime Database emulators
firebase emulators:start --only firestore,database
```

#### 7.2 Configure Application for Emulators

```typescript
// src/app/firebase/config/firebase.config.ts
import { connectFirestoreEmulator } from '@angular/fire/firestore';
import { connectDatabaseEmulator } from '@angular/fire/database';

if (environment.useEmulators) {
  connectFirestoreEmulator(firestore, 'localhost', 8080);
  connectDatabaseEmulator(database, 'localhost', 9000);
}
```

#### 7.3 Run Integration Tests

```bash
# Run Event Bus tests
npm run test:event-bus

# Run E2E tests
npm run e2e:event-bus
```

### Step 8: Production Deployment

#### 8.1 Build Application

```bash
# Production build
npm run build -- --configuration=production

# Verify build output
ls -la dist/
```

#### 8.2 Deploy to Firebase Hosting

```bash
# Deploy application
firebase deploy --only hosting

# Deploy Firestore indexes and rules
firebase deploy --only firestore

# Deploy Realtime Database rules
firebase deploy --only database
```

#### 8.3 Smoke Tests

```bash
# Run smoke tests against production
npm run test:smoke -- --env=production

# Verify Event Bus health
curl https://your-app.web.app/api/health/event-bus
```

#### 8.4 Post-Deployment Verification

1. **Event Publishing**: Verify events are published successfully
2. **Event Consumption**: Verify consumers receive events
3. **Event Persistence**: Verify events stored in Firestore
4. **Security Rules**: Verify unauthorized access denied
5. **Performance**: Verify event latency < 100ms (InMemory) or < 500ms (Firebase)

---

## Implementation Strategies

### Strategy 1: Pure In-Memory (Recommended for Single Server)

**Use Case**: Single server, no distributed requirements, zero latency needed

**Configuration**:
```typescript
{ provide: EVENT_BUS, useClass: InMemoryEventBus }
```

**Pros**:
- Zero latency (synchronous delivery)
- No external dependencies
- Simple configuration

**Cons**:
- No persistence
- No cross-server events
- Events lost on server restart

### Strategy 2: Hybrid (Memory + Firestore Audit)

**Use Case**: Single server with audit trail requirements

**Configuration**:
```typescript
{ provide: EVENT_BUS, useClass: InMemoryEventBus },
{ provide: IEventStore, useClass: FirestoreEventStore }
```

**Implementation**:
```typescript
@Injectable()
export class HybridEventBusService {
  private eventBus = inject<IEventBus>(EVENT_BUS);
  private eventStore = inject<IEventStore>(IEventStore);
  
  async publish(blueprintId: string, event: DomainEvent): Promise<void> {
    // Publish to in-memory bus (fast)
    await this.eventBus.publish(blueprintId, event);
    
    // Persist to Firestore (async audit trail)
    this.eventStore.append(blueprintId, event).catch(err => {
      console.error('Failed to persist event to audit log', err);
    });
  }
}
```

**Pros**:
- Zero latency for local events
- Persistent audit trail
- Event sourcing capabilities

**Cons**:
- No cross-server events
- Firestore costs for storage

### Strategy 3: Pure Firebase (Recommended for Distributed Systems)

**Use Case**: Multiple servers, real-time cross-server events needed

**Configuration**:
```typescript
{ provide: EVENT_BUS, useClass: FirebaseEventBus },
{ provide: IEventStore, useClass: FirestoreEventStore }
```

**Pros**:
- Real-time cross-server synchronization
- Persistent event storage
- Offline support
- Event sourcing capabilities

**Cons**:
- Higher latency (~500ms)
- Firebase costs
- Requires Firebase project

### Strategy 4: Custom Implementation

**Use Case**: Special requirements (e.g., Kafka, RabbitMQ integration)

**Implementation**:
```typescript
@Injectable()
export class KafkaEventBus implements IEventBus {
  // Custom implementation using Kafka
}

{ provide: EVENT_BUS, useClass: KafkaEventBus }
```

---

## Configuration

### InMemoryEventBus Configuration

```typescript
export interface EventBusConfig {
  retryAttempts: number;        // Number of retry attempts (default: 3)
  retryDelay: number;           // Initial retry delay in ms (default: 1000)
  enableDeadLetterQueue: boolean; // Enable DLQ (default: true)
  maxQueueSize: number;         // Max DLQ size (default: 10000)
}

const config: EventBusConfig = {
  retryAttempts: 3,
  retryDelay: 1000,
  enableDeadLetterQueue: true,
  maxQueueSize: 10000
};
```

### FirebaseEventBus Configuration

```typescript
export interface FirebaseEventBusConfig extends EventBusConfig {
  batchSize: number;            // Max events per batch (default: 500)
  batchInterval: number;        // Batch interval in ms (default: 1000)
  offlineQueueSize: number;     // Max offline queue size (default: 5000)
  enableCompression: boolean;   // Compress event data (default: false)
}

const config: FirebaseEventBusConfig = {
  retryAttempts: 3,
  retryDelay: 1000,
  enableDeadLetterQueue: true,
  maxQueueSize: 10000,
  batchSize: 500,
  batchInterval: 1000,
  offlineQueueSize: 5000,
  enableCompression: false
};
```

### Event Store Configuration

```typescript
export interface EventStoreConfig {
  collectionPrefix: string;     // Firestore collection prefix
  enableSnapshots: boolean;     // Enable aggregate snapshots
  snapshotFrequency: number;    // Snapshot every N events
  retentionDays?: number;       // Event retention period
}

const config: EventStoreConfig = {
  collectionPrefix: 'event-store',
  enableSnapshots: true,
  snapshotFrequency: 10,
  retentionDays: 90
};
```

---

## Security Rules Deployment

### Testing Security Rules Locally

```bash
# Start Firestore emulator with rules
firebase emulators:start --only firestore --import=./seed-data

# Run Security Rules unit tests
npm run test:security-rules
```

### Security Rules Unit Tests

```typescript
// firestore.rules.spec.ts
import * as firebase from '@firebase/rules-unit-testing';
import * as fs from 'fs';

describe('Event Store Security Rules', () => {
  let testEnv: firebase.RulesTestEnvironment;
  
  beforeAll(async () => {
    testEnv = await firebase.initializeTestEnvironment({
      projectId: 'test-project',
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8')
      }
    });
  });
  
  it('should allow Blueprint members to read events', async () => {
    const userId = 'user1';
    const blueprintId = 'blueprint1';
    
    // Set up test data
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore()
        .doc(`blueprintMembers/${userId}_${blueprintId}`)
        .set({ status: 'active', permissions: ['event:read'] });
      
      await context.firestore()
        .doc(`event-store/${blueprintId}/events/event1`)
        .set({ type: 'task.created', aggregateId: 'task1' });
    });
    
    // Test read access
    const authenticatedContext = testEnv.authenticatedContext(userId);
    await firebase.assertSucceeds(
      authenticatedContext.firestore()
        .doc(`event-store/${blueprintId}/events/event1`)
        .get()
    );
  });
  
  it('should deny non-members from reading events', async () => {
    const userId = 'user2';
    const blueprintId = 'blueprint1';
    
    const authenticatedContext = testEnv.authenticatedContext(userId);
    await firebase.assertFails(
      authenticatedContext.firestore()
        .doc(`event-store/${blueprintId}/events/event1`)
        .get()
    );
  });
});
```

---

## Testing

### Unit Tests

```typescript
// event-bus.service.spec.ts
describe('InMemoryEventBus', () => {
  let eventBus: InMemoryEventBus;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InMemoryEventBus]
    });
    eventBus = TestBed.inject(InMemoryEventBus);
  });
  
  it('should publish and receive events', async () => {
    const events: DomainEvent[] = [];
    
    eventBus.subscribe('blueprint1', 'task.created', (event) => {
      events.push(event);
    });
    
    await eventBus.publish('blueprint1', {
      type: 'task.created',
      aggregateId: 'task1',
      aggregateType: 'Task',
      version: 1,
      timestamp: new Date(),
      actor: 'user1',
      data: { title: 'New Task' }
    });
    
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('task.created');
  });
});
```

### Integration Tests

```typescript
// event-bus-integration.spec.ts
describe('Event Bus Integration', () => {
  let eventBus: IEventBus;
  let eventStore: IEventStore;
  
  beforeEach(() => {
    // Use Firebase Emulator
    connectFirestoreEmulator(getFirestore(), 'localhost', 8080);
    
    eventBus = TestBed.inject(EVENT_BUS);
    eventStore = TestBed.inject(IEventStore);
  });
  
  it('should persist events to Firestore', async () => {
    await eventBus.publish('blueprint1', {
      type: 'task.created',
      aggregateId: 'task1',
      aggregateType: 'Task',
      version: 1,
      timestamp: new Date(),
      actor: 'user1',
      data: { title: 'New Task' }
    });
    
    const events = await eventStore.getEvents('blueprint1', {
      aggregateId: 'task1'
    });
    
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('task.created');
  });
});
```

---

## Rollback Procedures

### Scenario 1: Event Publication Failures

**Symptoms**:
- Events not being published
- High error rate in Cloud Logging
- DLQ filling up rapidly

**Rollback Steps**:
1. **Stop new event publications**:
   ```typescript
   // Temporarily disable event publishing
   eventBus.pause();
   ```

2. **Revert to previous version**:
   ```bash
   # Rollback Firebase deployment
   firebase hosting:rollback
   ```

3. **Clear DLQ and retry**:
   ```typescript
   // Retrieve failed events
   const failedEvents = await eventBus.getDeadLetterQueue();
   
   // Manually retry after fix
   for (const event of failedEvents) {
     await eventBus.publish(event.blueprintId, event);
   }
   ```

### Scenario 2: Consumer Processing Errors

**Symptoms**:
- Events published but not processed
- Consumer error logs
- Aggregate state inconsistencies

**Rollback Steps**:
1. **Pause affected consumers**:
   ```typescript
   // Disable specific consumer
   consumer.pause();
   ```

2. **Rollback aggregate state** (if using Event Sourcing):
   ```typescript
   // Restore from snapshot
   const snapshot = await eventStore.getLatestSnapshot('blueprint1', 'task1');
   await aggregateRepository.restore('task1', snapshot);
   ```

3. **Replay events from last known good state**:
   ```typescript
   const events = await eventStore.getEventsByAggregate('blueprint1', 'task1', snapshot.version);
   for (const event of events) {
     await consumer.handle(event);
   }
   ```

### Scenario 3: Security Rules Deployment Issues

**Symptoms**:
- Authorization errors in Cloud Logging
- Users unable to access events
- Security Rules denying legitimate requests

**Rollback Steps**:
1. **Revert Security Rules**:
   ```bash
   # List recent deployments
   firebase hosting:rollback:list
   
   # Rollback to previous rules version
   git checkout HEAD~1 -- firestore.rules
   firebase deploy --only firestore:rules
   ```

2. **Verify rollback**:
   ```bash
   # Test Security Rules
   npm run test:security-rules
   ```

### Scenario 4: Performance Degradation

**Symptoms**:
- Event latency > 1 second
- High Firestore read/write costs
- Application slowdown

**Rollback Steps**:
1. **Switch to InMemoryEventBus temporarily**:
   ```typescript
   // Update app.config.ts
   { provide: EVENT_BUS, useClass: InMemoryEventBus }
   ```

2. **Deploy hotfix**:
   ```bash
   npm run build -- --configuration=production
   firebase deploy --only hosting
   ```

3. **Investigate Firestore performance**:
   ```bash
   # Check Firestore metrics in Firebase Console
   # Review slow queries
   # Verify indexes exist
   ```

---

## Troubleshooting

### Issue 1: Events Not Being Published

**Symptoms**:
- `eventBus.publish()` returns successfully but events not received
- No errors in logs

**Diagnosis**:
```typescript
// Enable debug logging
eventBus.enableDebugLogging();

// Check event bus health
const health = await eventBus.getHealth();
console.log('Event Bus Health:', health);
```

**Solutions**:
1. **Verify subscriptions registered**:
   ```typescript
   const subscriptions = eventBus.getSubscriptions('blueprint1');
   console.log('Active subscriptions:', subscriptions);
   ```

2. **Check wildcard pattern matching**:
   ```typescript
   // Incorrect pattern
   eventBus.subscribe('blueprint1', 'task-created', handler); // ❌
   
   // Correct pattern
   eventBus.subscribe('blueprint1', 'task.created', handler); // ✅
   ```

3. **Verify Blueprint ID**:
   ```typescript
   // Ensure correct blueprintId
   const blueprintId = await blueprintService.getCurrentBlueprintId();
   await eventBus.publish(blueprintId, event);
   ```

### Issue 2: Firestore Permission Denied Errors

**Symptoms**:
- "Missing or insufficient permissions" errors
- Events not persisted to Firestore

**Diagnosis**:
```bash
# Check Cloud Logging for Security Rules denials
gcloud logging read "resource.type=firestore_database AND protoPayload.status.message=~'PERMISSION_DENIED'" --limit 50
```

**Solutions**:
1. **Verify BlueprintMember exists**:
   ```typescript
   const memberId = `${userId}_${blueprintId}`;
   const member = await firestore.doc(`blueprintMembers/${memberId}`).get();
   console.log('Member exists:', member.exists());
   ```

2. **Check member permissions**:
   ```typescript
   const member = await firestore.doc(`blueprintMembers/${memberId}`).get();
   console.log('Permissions:', member.data()?.permissions);
   ```

3. **Test Security Rules locally**:
   ```bash
   firebase emulators:start --only firestore
   npm run test:security-rules
   ```

### Issue 3: High Event Latency

**Symptoms**:
- Events taking > 1 second to process
- Slow application performance

**Diagnosis**:
```typescript
// Measure event latency
const startTime = performance.now();
await eventBus.publish(blueprintId, event);
const latency = performance.now() - startTime;
console.log('Event latency:', latency, 'ms');
```

**Solutions**:
1. **Use batching for multiple events**:
   ```typescript
   // Instead of individual publishes
   await eventBus.publish(blueprintId, event1);
   await eventBus.publish(blueprintId, event2);
   
   // Use batch publish
   await eventBus.publishBatch(blueprintId, [event1, event2]);
   ```

2. **Optimize Firestore queries**:
   ```typescript
   // Ensure indexes exist
   // Check Firestore Console for missing indexes
   ```

3. **Switch to InMemoryEventBus for local events**:
   ```typescript
   // Use Firebase only for cross-server events
   { provide: EVENT_BUS, useClass: InMemoryEventBus }
   ```

### Issue 4: Dead Letter Queue Growing

**Symptoms**:
- DLQ size increasing rapidly
- Events failing after max retries

**Diagnosis**:
```typescript
// Check DLQ contents
const dlq = await eventBus.getDeadLetterQueue();
console.log('DLQ size:', dlq.length);
console.log('Failed events:', dlq);
```

**Solutions**:
1. **Analyze failure patterns**:
   ```typescript
   // Group by error type
   const errorGroups = dlq.reduce((acc, item) => {
     const errorType = item.error.message;
     acc[errorType] = (acc[errorType] || 0) + 1;
     return acc;
   }, {});
   console.log('Error patterns:', errorGroups);
   ```

2. **Fix consumer logic and retry**:
   ```typescript
   // After fixing consumer
   for (const item of dlq) {
     await eventBus.publish(item.blueprintId, item.event);
   }
   
   // Clear DLQ
   await eventBus.clearDeadLetterQueue();
   ```

### Issue 5: Firebase Realtime Database Quota Exceeded

**Symptoms**:
- "Quota exceeded" errors
- Events not synchronized across servers

**Diagnosis**:
```bash
# Check Firebase usage
firebase functions:log --only database

# Review Firebase Console > Usage tab
```

**Solutions**:
1. **Implement event cleanup**:
   ```typescript
   // Delete processed events older than 24 hours
   const cutoff = Date.now() - (24 * 60 * 60 * 1000);
   const oldEvents = await database.ref('events').orderByChild('timestamp')
     .endAt(cutoff).once('value');
   
   oldEvents.forEach(event => event.ref.remove());
   ```

2. **Switch to Firestore for persistence**:
   ```typescript
   // Use Realtime DB only for real-time sync
   // Use Firestore for long-term storage
   ```

### Issue 6: Consumer Not Receiving Events

**Symptoms**:
- Events published successfully but consumer not triggered
- No errors in logs

**Diagnosis**:
```typescript
// Check if consumer registered
const consumers = eventBus.getRegisteredConsumers();
console.log('Registered consumers:', consumers);

// Verify subscription
const subscriptions = eventBus.getSubscriptions('blueprint1');
console.log('Subscriptions:', subscriptions);
```

**Solutions**:
1. **Ensure consumer initialized**:
   ```typescript
   @Injectable({ providedIn: 'root' })
   export class TaskAuditConsumer extends EventConsumer {
     constructor() {
       super();
       this.initialize(); // ✅ Call initialize
     }
   }
   ```

2. **Verify @Subscribe decorator**:
   ```typescript
   @Subscribe('task.*') // ✅ Correct pattern
   async handleTaskEvent(event: DomainEvent) {
     // Handle event
   }
   ```

3. **Check event type matching**:
   ```typescript
   // Event published
   { type: 'task.created' }
   
   // Consumer subscribes to
   @Subscribe('task.created') // ✅ Exact match
   @Subscribe('task.*')       // ✅ Wildcard match
   @Subscribe('*.created')    // ✅ Wildcard match
   ```

---

## Migration Guide

### From Manual Event Handling to Event Bus

#### Step 1: Identify Existing Event Patterns

```typescript
// BEFORE: Manual event handling
export class TaskService {
  async createTask(task: Task): Promise<Task> {
    const created = await this.repository.create(task);
    
    // Manual audit logging
    await this.auditService.log({
      action: 'task.created',
      taskId: created.id,
      userId: this.currentUser.id
    });
    
    // Manual notification
    await this.notificationService.notify({
      type: 'task_created',
      userId: task.assignedTo
    });
    
    return created;
  }
}
```

#### Step 2: Migrate to Event Bus

```typescript
// AFTER: Event Bus pattern
export class TaskService {
  private eventBus = inject<IEventBus>(EVENT_BUS);
  
  async createTask(blueprintId: string, task: Task): Promise<Task> {
    const created = await this.repository.create(task);
    
    // Publish domain event
    await this.eventBus.publish(blueprintId, {
      type: 'task.created',
      aggregateId: created.id,
      aggregateType: 'Task',
      version: 1,
      timestamp: new Date(),
      actor: this.currentUser.id,
      data: created
    });
    
    return created;
  }
}
```

#### Step 3: Create Event Consumers

```typescript
// Audit consumer (replaces manual audit logging)
@Injectable({ providedIn: 'root' })
export class TaskAuditConsumer extends EventConsumer {
  private auditService = inject(AuditLogService);
  
  @Subscribe('task.*')
  async handleTaskEvent(event: DomainEvent) {
    await this.auditService.log({
      action: event.type,
      taskId: event.aggregateId,
      userId: event.actor,
      data: event.data
    });
  }
}

// Notification consumer (replaces manual notifications)
@Injectable({ providedIn: 'root' })
export class TaskNotificationConsumer extends EventConsumer {
  private notificationService = inject(NotificationService);
  
  @Subscribe('task.created')
  async handleTaskCreated(event: DomainEvent) {
    const task = event.data as Task;
    await this.notificationService.notify({
      type: 'task_created',
      userId: task.assignedTo,
      data: task
    });
  }
}
```

#### Step 4: Gradual Rollout

1. **Deploy Event Bus infrastructure** (no code changes yet)
2. **Add event publishing** alongside existing manual handling
3. **Deploy and monitor** for issues
4. **Enable consumers** one at a time
5. **Remove manual handling** after validation

---

## Performance Tuning

### Batching Events

```typescript
// Group multiple events
const events: DomainEvent[] = [];

for (const task of tasks) {
  events.push({
    type: 'task.created',
    aggregateId: task.id,
    aggregateType: 'Task',
    version: 1,
    timestamp: new Date(),
    actor: currentUser.id,
    data: task
  });
}

// Publish in single batch
await eventBus.publishBatch(blueprintId, events);
```

### Throttling Event Publishing

```typescript
// Debounce rapid events
import { debounce } from 'lodash-es';

const publishDebounced = debounce(
  (blueprintId: string, event: DomainEvent) => {
    eventBus.publish(blueprintId, event);
  },
  300 // 300ms debounce
);

// Use debounced publish for rapid events
publishDebounced(blueprintId, event);
```

### Optimizing Firestore Queries

```typescript
// Use indexes for common queries
await eventStore.getEvents(blueprintId, {
  type: 'task.created',        // Indexed
  aggregateType: 'Task',       // Indexed
  limit: 100
});

// Avoid full collection scans
await eventStore.getEventsByAggregate(blueprintId, 'task1'); // ✅ Uses index
```

### Monitoring Integration

```typescript
// Add performance tracking
import { trace } from '@angular/fire/performance';

async publishWithTracing(blueprintId: string, event: DomainEvent) {
  const t = trace(this.performance, 'event-bus-publish');
  t.start();
  
  await this.eventBus.publish(blueprintId, event);
  
  t.stop();
}
```

---

## Next Steps

After successful deployment:

1. **Monitor Event Bus health** - Review Cloud Logging and Firebase Console
2. **Set up alerting** - Configure alerts for DLQ growth and high latency
3. **Optimize costs** - Review Firestore usage and implement event cleanup
4. **Document event types** - Create catalog of all domain events
5. **Train team** - Share Event Bus patterns and best practices

---

## Related Documentation

- [Event Bus API Reference](./API_REFERENCE.md)
- [Production Runbook](./PRODUCTION_RUNBOOK.md)
- [Production Readiness Checklist](./PRODUCTION_READINESS_CHECKLIST.md)
- [Monitoring & Cost Optimization](./MONITORING_COST_OPTIMIZATION.md)
- [Validation Report](./VALIDATION_REPORT.md)

---

**Document Version**: 1.0.0  
**Last Reviewed**: 2025-12-26  
**Next Review**: 2026-03-26  
**Owner**: GigHub Development Team
