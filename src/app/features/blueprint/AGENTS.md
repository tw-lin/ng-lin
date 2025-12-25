# Blueprint Feature – AGENTS

## Scope
Blueprint frontend feature (`src/app/features/blueprint/`). Blueprint UI, business flows, and Firestore data layer.

## Purpose
Implement blueprint container capabilities: list, detail, designer, members. Separate from core domain (`core/blueprint/` holds domain-only logic).

## Constraints (Must NOT)
- ❌ Use Firebase SDK directly (use @angular/fire via DI)
- ❌ Touch DA_SERVICE_TOKEN or auth infrastructure
- ❌ Access core domain directly (use via facades)
- ❌ Use constructor injection (use `inject()`)

## Allowed Content
- ✅ Blueprint UI components (list, detail, designer)
- ✅ Blueprint services (business logic + Firestore)
- ✅ Blueprint stores (signals-based state)
- ✅ Blueprint repositories (@angular/fire)
- ✅ Member management, audit logs, container dashboard
- ✅ Module views (see `routes/modules/AGENTS.md`)

## Structure
```
blueprint/
├── components/               # Shared blueprint UI
├── services/                 # Business logic services
├── stores/                   # Signal-based state
├── repositories/             # Firestore data access
├── routes/                   # Blueprint routes (see routes/AGENTS.md)
│   └── modules/              # Module views (see modules/AGENTS.md)
└── models/                   # Blueprint-specific types
```

## Dependencies
**Depends on**: `core/blueprint/` (domain), `core/` (auth, guards), `shared/` (UI)  
**Used by**: `routes/blueprint/*` (route components)

## Key Rules
1. **Domain separation**:
   - **Core domain** (`core/blueprint/`): Container, context, events, validators (domain-only)
   - **Feature layer** (here): UI, business flows, Firestore repositories, services, stores
2. **Three layers**: UI → Service → Repository (Firestore via @angular/fire)
3. **Event bus**: Emit domain events for all operations
4. **Signals**: Use for reactive state management
5. **Platform-1**: Follow folder structure and loose coupling
6. **DI**: Use `inject()` exclusively
7. **Migration**: Continue moving old core repos/services/stores here

## Related
- `../../core/blueprint/AGENTS.md` - Core domain logic
- `routes/AGENTS.md` - Blueprint routing
- `routes/modules/AGENTS.md` - Module view boundaries
- `../../core/AGENTS.md` - Core infrastructure

---
Version: 1.2.0 | Updated: 2025-12-25 | Status: Active
