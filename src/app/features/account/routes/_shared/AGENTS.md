# Account Routes Shared – AGENTS

> **Parent**: [`../AGENTS.md`](../AGENTS.md) - Account routes

## Scope
Shared utilities for account routes (`features/account/routes/_shared/`). Route-specific helpers and guards.

## Purpose
Provide reusable utilities shared across account sub-routes. Keep route-specific concerns separate from core.

## Constraints (Must NOT)
- ❌ Include feature business logic (use account services)
- ❌ Access Firebase directly
- ❌ Create UI components (use account/components)
- ❌ Use constructor injection (use `inject()`)

## Allowed Content
- ✅ Route guards specific to account module
- ✅ Route resolvers and utilities
- ✅ Navigation helpers
- ✅ Breadcrumb helpers

## Structure
```
_shared/
├── guards/                   # Account route guards
├── resolvers/                # Route resolvers
└── utils/                    # Route utilities
```

## Dependencies
**Depends on**: `../../` (account services), `../../../../core/` (guards)  
**Used by**: Account sub-routes

## Key Rules
1. **Route-specific**: Only route-level concerns, not business logic
2. **Reusability**: Shared across account routes only
3. **DI**: Use `inject()` exclusively
4. **Composition**: Compose core guards, don't duplicate

## Related
- `../AGENTS.md` - Account routes
- `../../AGENTS.md` - Account feature

---
Version: 1.2.0 | Updated: 2025-12-25 | Status: Active
