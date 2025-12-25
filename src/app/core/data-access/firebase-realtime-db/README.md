# firebase-realtime-db (Data Access)

This module wraps **Firebase Realtime Database** for ultra low-latency,
state-oriented data access.

## Responsibility

- Real-time value synchronization
- Presence and connection-aware data
- Simple hierarchical state updates

This module **does NOT**:
- Replace Firestore for structured data
- Implement business workflows
- Coordinate cross-entity transactions

## Typical Use Cases

- Presence (online / offline)
- Live cursors or collaborative state
- Temporary or ephemeral data
- High-frequency updates

## Public API Shape (Conceptual)

- `value$<T>(path)`
- `set(path, value)`
- `update(path, partial)`
- `onDisconnect(action)`

## Architectural Notes

- Use only when Firestore latency or cost is not acceptable
- Data model should remain flat and minimal
- Long-term persistence should live in Firestore

## Dependencies

- Firebase Realtime Database SDK
- RxJS

## Usage Guidance

This module is **optional**.

Only introduce it when you have a clear real-time or presence-driven
requirement.
