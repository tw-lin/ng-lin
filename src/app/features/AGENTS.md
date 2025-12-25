# Features – AGENTS

# Features – AGENTS

> **📍 Location**: `src/app/features/` - Business features  
> **👆 Parent**: [`../AGENTS.md`](../AGENTS.md) - App root  
> **🔍 Quick Tip**: Working in a specific feature? Read that feature's AGENTS.md first (account/blueprint/exception/social).

## Scope
Business feature modules (`src/app/features/`). Business UI, flows, and feature-specific Firestore data layer.

## Purpose
Implement business capabilities (account, blueprint, exceptions, social) with clear boundaries. Features own their UI and data layer, call core via facades/ports.

## Constraints (Must NOT)
- ❌ Access Firebase SDK directly (use @angular/fire via DI)
- ❌ Touch infrastructure (auth chain, DA_SERVICE_TOKEN, global interceptors)
- ❌ Import from other features (use events/facades)
- ❌ Put shared UI here (use `shared/`)
- ❌ Use constructor injection (use `inject()`)

## Allowed Content
- ✅ Feature pages and components (UI)
- ✅ Feature services and facades (business logic)
- ✅ Feature stores (signals-based state)
- ✅ Feature models (domain types)
- ✅ Firestore repositories for this feature (@angular/fire DI)
- ✅ Feature routes and guards

## Structure
```
features/
├── account/                  # Account feature (see account/AGENTS.md)
├── blueprint/                # Blueprint feature (see blueprint/AGENTS.md)
├── exception/                # Exception pages (see exception/AGENTS.md)
└── social/                   # Social feature (see social/AGENTS.md)
```

## Dependencies
**Depends on**: `core/` (facades, domain), `shared/` (UI components)  
**Used by**: `routes/` (lazy loaded)

## Key Rules
1. **Core vs Features**:
   - **Core**: Platform infrastructure, global singletons, auth/permissions, @angular/fire/DA_SERVICE_TOKEN, pure domain rules
   - **Features**: Business flows + UI, feature Firestore data layer via @angular/fire, call core APIs
2. **Three layers**: UI → Feature service/store → Core facade/repo
3. **No direct Firestore SDK**: Use @angular/fire injected services
4. **DI**: Standalone + signals + `inject()`
5. **No NgModules**: Use standalone components
6. **Lazy load**: Features can be lazy-loaded, avoid circular imports
7. **Events**: Features communicate via explicit interfaces or events

## Related
- `../core/AGENTS.md` - Core infrastructure
- `../routes/AGENTS.md` - Routing layer
- `account/AGENTS.md` - Account feature
- `blueprint/AGENTS.md` - Blueprint feature

---
Version: 1.2.0 | Updated: 2025-12-25 | Status: Active
