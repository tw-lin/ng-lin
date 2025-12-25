# Account Feature – AGENTS

## Scope
Account feature module (`src/app/features/account/`). Reusable account domain capabilities (profile, dashboard, settings) for routes to compose.

## Purpose
Provide account UI building blocks and services. Keep components reusable, delegate data access to services that wrap `core/` repositories.

## Constraints (Must NOT)
- ❌ Access Firestore/@angular/fire in components (use services)
- ❌ Create tight coupling with layout or routing
- ❌ Include generic UI (belongs in `shared/`)
- ❌ Use NgModules or `any` types
- ❌ Use constructor injection (use `inject()`)

## Allowed Content
- ✅ Account UI components (standalone, OnPush, signals)
- ✅ Account services/facades (consume `core/` repositories)
- ✅ Signal-based stores for local state
- ✅ Account-specific types (domain models in `core/models/`)
- ✅ Profile, dashboard, settings vertical slices

## Structure
```
account/
├── components/               # Reusable account UI
├── services/                 # Account domain services
├── stores/                   # Signal-based state
├── models/                   # Account-specific types
├── profile/                  # Profile feature
├── dashboard/                # Dashboard feature
├── settings/                 # Settings feature
└── routes/                   # Account routes (see routes/AGENTS.md)
```

## Dependencies
**Depends on**: `core/` (repositories, auth), `shared/` (UI components)  
**Used by**: `routes/account/*` (route components)

## Key Rules
1. **Route-agnostic**: Keep feature components independent of routes
2. **Data via services**: Components call services, services use repositories
3. **Signals**: Use signals for state management
4. **Result pattern**: Use for async operations, `takeUntilDestroyed()` for observables
5. **Composition**: Keep components small, single-purpose
6. **Validation**: Validate inputs, respect Firestore Security Rules
7. **Lazy loading**: Design for lazy loading, no side effects in entry points
8. **Accessibility**: Maintain WCAG compliance, semantic HTML

## Related
- `../AGENTS.md` - Features root
- `../../core/AGENTS.md` - Core services
- `../../shared/AGENTS.md` - Shared UI
- `routes/AGENTS.md` - Account routes

---
Version: 1.2.0 | Updated: 2025-12-25 | Status: Active
