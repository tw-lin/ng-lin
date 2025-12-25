# Blueprint Routes – AGENTS

> **Parent**: [`../AGENTS.md`](../AGENTS.md) - Blueprint feature

## Scope
Blueprint route components (`features/blueprint/routes/`). Page-level components for blueprint list, detail, designer, and modules.

## Purpose
Compose blueprint feature slices into routable pages. Orchestrate blueprint data loading and navigation.

## Constraints (Must NOT)
- ❌ Include reusable business logic (use blueprint services)
- ❌ Access Firebase directly (use services)
- ❌ Duplicate blueprint domain logic
- ❌ Use constructor injection (use `inject()`)

## Allowed Content
- ✅ Blueprint page components (standalone)
- ✅ Route-specific compositions
- ✅ Data loading orchestration
- ✅ Blueprint navigation and breadcrumbs

## Structure
```
routes/
├── modules/                  # Module views (see modules/AGENTS.md)
├── pages/                    # Blueprint pages
└── routes.ts                 # Route configuration
```

## Dependencies
**Depends on**: `../` (blueprint feature), `../../../core/blueprint/` (domain)  
**Used by**: Router

## Key Rules
1. **Composition**: Pages compose feature components
2. **Orchestration**: Routes load data, components display
3. **Guards**: Use blueprint permission guards
4. **Lazy load**: Design for code splitting
5. **Metadata**: Include blueprint context in route data
6. **DI**: Use `inject()` exclusively
7. **Events**: Subscribe to blueprint events

## Related
- `../AGENTS.md` - Blueprint feature
- `modules/AGENTS.md` - Module views
- `../../../core/blueprint/AGENTS.md` - Domain logic

---
Version: 1.2.0 | Updated: 2025-12-25 | Status: Active
