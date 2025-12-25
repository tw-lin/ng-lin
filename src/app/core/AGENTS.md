# Core – AGENTS

# Core – AGENTS

> **📍 Location**: `src/app/core/` - Infrastructure layer  
> **👆 Parent**: [`../AGENTS.md`](../AGENTS.md) - App root  
> **🔍 Quick Tip**: Working in `core/blueprint/` or `core/net/`? Read their AGENTS.md first.

## Scope
Platform infrastructure layer (`src/app/core/`). Auth, authorization, data access, interceptors, guards, startup, shared constants, and cross-domain types. No feature UI.

## Purpose
Provide platform-level capabilities (auth, guards, repositories, logging, validation) that features consume via facades/ports. Keep infrastructure separate from business features.

## Constraints (Must NOT)
- ❌ Include feature-specific UI/flows or state
- ❌ Import from `features/*` (one-way dependency)
- ❌ Access DA_SERVICE_TOKEN outside auth chain
- ❌ Put feature Firestore repositories here (belongs in features)
- ❌ Use constructor injection (use `inject()`)

## Allowed Content
- ✅ Auth chain (auth.facade.ts, auth.port.ts, infra/firebase-auth.service.ts)
- ✅ Guards (authGuard, permissionGuard, moduleEnabledGuard)
- ✅ Interceptors (HTTP, error handling)
- ✅ Shared repositories (only if truly cross-domain)
- ✅ Startup services
- ✅ Logging, validation, permission services
- ✅ Cross-domain errors, constants, models
- ✅ Domain-only logic (context, events, validators, errors)

## Structure
```
core/
├── auth/                     # Auth chain (Firebase → @delon/auth)
├── guards/                   # Route guards
├── interceptors/             # HTTP interceptors
├── net/                      # Network utilities
├── startup/                  # App initialization
├── services/                 # Platform services (logging, etc.)
├── blueprint/                # Blueprint domain only (no data layer)
├── models/                   # Shared domain models
└── errors/                   # Shared error types
```

## Dependencies
**Depends on**: @angular/fire, @delon/auth, Angular DI  
**Used by**: `features/*`, `routes/*`, `layout/*`

## Key Rules
1. **Core vs Features**:
   - **Core**: Cross-domain reusable, global singletons, auth/authorization, network, logging, configuration, pure domain rules
   - **Features**: Business flows + UI (routes/components/stores/services), feature-specific Firestore via @angular/fire
2. **Three layers**: UI → Service/Facade → Repository (Firestore only in repos)
3. **Auth chain**: @angular/fire/auth → @delon/auth → DA_SERVICE_TOKEN
4. **No feature data**: Blueprint/Account Firestore repos belong in `features/`
5. **Async**: Use Result pattern, explicit error types
6. **DI**: Use `inject()` exclusively

## Related
- `../features/AGENTS.md` - When to use features
- `../routes/AGENTS.md` - Route guards integration
- `blueprint/AGENTS.md` - Blueprint domain vs data layer
- `net/AGENTS.md` - Network utilities

---
Version: 1.2.0 | Updated: 2025-12-25 | Status: Active
