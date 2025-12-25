# Account Routes – AGENTS

> **Parent**: [`../AGENTS.md`](../AGENTS.md) - Account feature

## Scope
Account route components (`features/account/routes/`). Page-level components for account, user, team, org, admin routing.

## Purpose
Compose account feature slices into routable pages. Orchestrate data loading and coordinate feature components.

## Constraints (Must NOT)
- ❌ Include reusable business logic (use feature services)
- ❌ Access Firebase directly (use services)
- ❌ Create tight coupling between routes
- ❌ Use constructor injection (use `inject()`)

## Allowed Content
- ✅ Route page components (standalone)
- ✅ Route-specific compositions
- ✅ Data loading orchestration
- ✅ Breadcrumb and navigation metadata

## Structure
```
routes/
├── user/                     # User routes (see user/AGENTS.md)
├── team/                     # Team routes (see team/AGENTS.md)
├── organization/             # Org routes (see organization/AGENTS.md)
├── admin/                    # Admin routes (see admin/AGENTS.md)
├── _shared/                  # Shared route utilities
└── routes.ts                 # Route configuration
```

## Dependencies
**Depends on**: `../` (account features), `../../../../core/` (guards)  
**Used by**: Router

## Key Rules
1. **Composition**: Pages compose feature slices, not duplicate logic
2. **Orchestration**: Routes load data, components display
3. **Guards**: Use auth, permission, role guards appropriately
4. **Lazy load**: Design for code splitting
5. **Metadata**: Include title, breadcrumb, permissions in route data
6. **DI**: Use `inject()` exclusively

## Related
- `../AGENTS.md` - Account feature
- `user/AGENTS.md` - User routes
- `team/AGENTS.md` - Team routes
- `organization/AGENTS.md` - Org routes
- `admin/AGENTS.md` - Admin routes

---
Version: 1.2.0 | Updated: 2025-12-25 | Status: Active
