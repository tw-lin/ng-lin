# Shared Services – AGENTS

## Scope
Business services under `src/app/shared/services/`. Reusable domain logic shared across multiple features. Distinguished from core infrastructure services.

## Purpose
Encapsulate shared business logic for domain capabilities (Blueprint, Account, Organization, Team, Permission, Validation, Audit) used by multiple features.

## Constraints (Must NOT)
- ❌ Create UI components
- ❌ Include feature-specific logic (belongs in feature modules)
- ❌ Access Firebase directly (use repositories)
- ❌ Implement infrastructure concerns (belongs in `core/services/`)
- ❌ Use constructor injection (use `inject()`)

## Allowed Content
- ✅ Shared business services (`providedIn: 'root'`)
- ✅ Domain logic for Blueprint, Account, Organization, Team
- ✅ Permission helpers and validators
- ✅ Audit services
- ✅ Workspace context and menu management

## Structure
```
services/
├── blueprint/                # Blueprint business services
├── account/                  # Account business services
├── organization/             # Organization business services
├── team/                     # Team business services
├── permission/               # Permission checking
├── validation/               # Validation services
├── audit/                    # Audit logging
├── workspace-context.service.ts
├── menu-management.service.ts
└── index.ts                  # Public API exports
```

## Dependencies
**Depends on**: `core/` repositories, domain models  
**Used by**: Feature modules, components

## Key Rules
1. **Shared vs Core**:
   - **Shared Services** (here): Business logic, domain-specific, multi-feature use
   - **Core Services** (`core/services/`): Infrastructure, technical concerns (auth, logging)
2. **Singletons**: Use `providedIn: 'root'` for all services
3. **DI**: Use `inject()` exclusively
4. **State**: Use signals for shared state, keep services focused
5. **Event integration**: Emit domain events via EventBus
6. **Repositories**: Call repositories for data access, never Firestore directly
7. **Validation**: Implement business rules and validation logic
8. **Testing**: Ensure comprehensive test coverage

## Related
- `../AGENTS.md` - Shared module overview
- `../../core/services/AGENTS.md` - Core vs Shared distinction
- `../../features/AGENTS.md` - Feature modules

---
Version: 1.2.0 | Updated: 2025-12-25 | Status: Active

