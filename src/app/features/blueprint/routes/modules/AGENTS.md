# Blueprint Module Views – AGENTS

> **Parent**: [`../AGENTS.md`](../AGENTS.md) - Blueprint routes

## Scope
Module view components (`features/blueprint/routes/modules/`). Pluggable module-specific views within blueprint container.

## Purpose
Provide module-specific UI that plugs into blueprint container. Each module (quality, log, task) has its own view.

## Constraints (Must NOT)
- ❌ Access blueprint context directly (use services)
- ❌ Create tight coupling between modules
- ❌ Access Firebase directly (use module services)
- ❌ Use constructor injection (use `inject()`)

## Allowed Content
- ✅ Module view components (quality, log, task, etc.)
- ✅ Module-specific UI compositions
- ✅ Module routing and guards
- ✅ Module event handlers

## Structure
```
modules/
├── quality/                  # Quality module view
├── log/                      # Log module view
├── task/                     # Task module view
└── routes.ts                 # Module routes
```

## Dependencies
**Depends on**: `../../` (blueprint feature), module-specific services  
**Used by**: Blueprint container

## Key Rules
1. **Module isolation**: Keep modules independent
2. **Container integration**: Modules register with container
3. **Event-based**: Use EventBus for module communication
4. **Lazy load**: Each module can be lazy-loaded
5. **Permissions**: Module-level permission checks
6. **DI**: Use `inject()` exclusively
7. **Composition**: Modules are composable plugins

## Related
- `../AGENTS.md` - Blueprint routes
- `../../AGENTS.md` - Blueprint feature
- `../../../../core/blueprint/AGENTS.md` - Container logic

---
Version: 1.2.0 | Updated: 2025-12-25 | Status: Active
