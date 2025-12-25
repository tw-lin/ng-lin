# firebase-firestore (Data Access)

This module provides access to **Cloud Firestore** as a reactive
data source for the application.

## Responsibility

- Read and write Firestore documents
- Real-time data synchronization
- Query execution

This module **does NOT**:
- Implement business rules
- Enforce authorization logic (handled by Firestore Rules)
- Coordinate multi-step workflows

## Typical Capabilities

- Document read/write
- Collection queries
- Real-time subscriptions

## Public API Shape (Conceptual)

- `doc$<T>(path)`
- `collection$<T>(query)`
- `setDoc(path, data)`
- `updateDoc(path, partial)`
- `deleteDoc(path)`

## Architectural Notes

- Firestore is treated as a **primary data store**
- Domain validation belongs outside this layer
- Prefer composition over deeply nested queries

## Dependencies

- Firebase Firestore SDK
- RxJS / Signals

## Usage Guidance

Use from:
- Feature facades
- State management layers
- Read-only views (via async / signal bindings)

Avoid embedding Firestore queries directly in components.
