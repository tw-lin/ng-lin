# Core Services – AGENTS

> **📍 Location**: `src/app/core/services/` - Platform services layer  
> **👆 Parent**: [`../AGENTS.md`](../AGENTS.md) - Core infrastructure  
> **🔍 Quick Tip**: Working in subdirectories (api/, logger/, mention/)? Check for their specific AGENTS.md.

## Scope
Core platform services (`src/app/core/services/`) providing cross-cutting concerns: logging, error tracking, performance monitoring, API utilities, mentions, namespaces, notifications, and realtime features. No feature-specific business logic.

## Purpose
Centralize infrastructure services consumed by features. Ensure consistent logging, error handling, performance tracking, and utility functions across the application while maintaining single responsibility.

## Constraints (Must NOT)
- ❌ Include feature-specific business logic
- ❌ Import from `features/*` (strict one-way dependency)
- ❌ Access Firestore directly (use repositories)
- ❌ Use constructor injection (use `inject()`)
- ❌ Create stateful services without careful consideration

## Allowed Content
- ✅ Logger service (console, remote logging)
- ✅ Error tracking service (Sentry, Firebase Crashlytics)
- ✅ Performance monitoring service
- ✅ Firebase service wrapper (configuration only)
- ✅ Push messaging service (FCM)
- ✅ API utilities (HTTP helpers, interceptors)
- ✅ Mention service (tagging users in content)
- ✅ Namespace service (multi-tenancy context)
- ✅ Notification service (in-app notifications)
- ✅ Realtime service (WebSocket, SSE management)

## Structure
```
services/
├── api/                      # HTTP API utilities
├── logger/                   # Logging service
├── mention/                  # User mention/tagging
├── namespace/                # Multi-tenancy namespace
├── notification/             # In-app notifications
├── realtime/                 # Realtime communication
├── error-tracking.service.ts # Error monitoring
├── firebase.service.ts       # Firebase config wrapper
├── performance-monitoring.service.ts
└── push-messaging.service.ts # FCM push notifications
```

## Dependencies
**Depends on**: Angular DI, @angular/fire, Firebase SDK  
**Used by**: `features/*`, `core/*`, `shared/*`

## Key Rules
1. **Singleton pattern**: All services `providedIn: 'root'`
2. **Use inject()**: No constructor injection
3. **Error boundaries**: All services handle errors gracefully
4. **Type safety**: Strong typing, no `any`
5. **Performance**: Lazy load heavy dependencies
6. **Testing**: Mock-friendly interfaces

## Agent Chain Integration
**Priority**: P0 (Infrastructure foundation)  
**Triggers**: Feature Agent (P1), Security Agent (P2)  
**Dependencies**: Architecture Agent defines service contracts

## Related
- `../AGENTS.md` - Core infrastructure rules
- `../../features/AGENTS.md` - Feature consumption patterns
- `api/AGENTS.md` - HTTP utilities (if exists)
- `logger/AGENTS.md` - Logging patterns (if exists)

---
Version: 1.2.0 | Updated: 2025-12-25 | Status: Active
