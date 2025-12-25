# Core Data Access – AGENTS

> **📍 Location**: `src/app/core/data-access/` - Firebase data layer  
> **👆 Parent**: [`../AGENTS.md`](../AGENTS.md) - Core infrastructure  
> **🔍 Quick Tip**: Working with specific Firebase service? Read their subdirectory AGENTS.md.

## Scope
Core Firebase data access layer (`src/app/core/data-access/`) providing wrappers and utilities for Firebase services: Auth, Firestore, Realtime Database, Storage, and FCM. No feature-specific repositories.

## Purpose
Provide thin, type-safe wrappers around Firebase SDK for core platform capabilities. Feature-specific repositories belong in `features/*/repositories/`. Keep infrastructure separate from business data.

## Constraints (Must NOT)
- ❌ Include feature-specific Firestore collections/queries
- ❌ Put blueprint, account, or task repositories here (belongs in `features/`)
- ❌ Add business logic or domain rules
- ❌ Import from `features/*`
- ❌ Use constructor injection (use `inject()`)
- ❌ Create parallel REST APIs or non-Firebase backends

## Allowed Content
- ✅ Firebase Auth wrappers (sign-in, sign-out, token management)
- ✅ Firebase Firestore utilities (batch, transaction helpers)
- ✅ Firebase Realtime Database utilities (connection state)
- ✅ Firebase Storage utilities (upload, download)
- ✅ Firebase FCM wrappers (token, messaging)
- ✅ Type definitions for Firebase responses
- ✅ Error mapping (Firebase codes → app errors)
- ✅ Connection state management

## Structure
```
data-access/
├── firebase-auth/            # Auth service wrappers
│   ├── types/
│   └── auth.service.ts
├── firebase-firestore/       # Firestore utilities
│   └── firestore-utils.ts
├── firebase-realtime-db/     # Realtime DB utilities
├── firebase-storage/         # Storage utilities
└── firebase-fcm/             # FCM messaging
```

## Dependencies
**Depends on**: @angular/fire, Firebase SDK  
**Used by**: `features/*/repositories/`, `core/services/`

## Key Rules
1. **Infrastructure only**: Cross-domain Firebase utilities, no business logic
2. **Feature repositories separate**: Blueprint, Account, Task repos go in `features/`
3. **Type safety**: Define types for all Firebase operations
4. **Error handling**: Map Firebase errors to domain errors
5. **Use inject()**: No constructor injection
6. **Async patterns**: Result pattern for error handling

## Agent Chain Integration
**Priority**: P0 (Data layer foundation)  
**Triggers**: Feature Agent (P1) for business repositories  
**Dependencies**: Architecture Agent defines data contracts

## Related
- `../AGENTS.md` - Core infrastructure rules
- `../../features/*/repositories/AGENTS.md` - Feature-specific repos
- `../../firebase/AGENTS.md` - Firebase configuration

---
Version: 1.2.0 | Updated: 2025-12-25 | Status: Active
