# Account Dashboard – AGENTS

## Scope
Dashboard slice (`features/account/dashboard/`). Reusable dashboard widgets and logic for account overview.

## Purpose
Provide dashboard UI components and data aggregation for account activity overview. Keep presentational and reusable.

## Constraints (Must NOT)
- ❌ Access Firebase SDK directly (use services)
- ❌ Couple to routing (pages orchestrate)
- ❌ Use NgModules or `any` types
- ❌ Use constructor injection (use `inject()`)

## Allowed Content
- ✅ Dashboard widget components (standalone, OnPush)
- ✅ Dashboard facades (consume account/core services)
- ✅ Signal-based dashboard state
- ✅ Dashboard view models

## Structure
```
dashboard/
├── components/               # Dashboard widgets
├── services/                 # Dashboard facades
├── stores/                   # Dashboard state (signals)
└── models/                   # Dashboard view models
```

## Dependencies
**Depends on**: `../` (account services), `../../../core/` (repositories)  
**Used by**: Route components

## Key Rules
1. **Reusability**: Keep components route-agnostic
2. **Standalone**: Use standalone components with OnPush
3. **Signals**: Use signals for reactive state
4. **DI**: Use `inject()` exclusively
5. **Data loading**: Route pages orchestrate, components display

## Related
- `../AGENTS.md` - Account feature
- `../../AGENTS.md` - Features root

---
Version: 1.2.0 | Updated: 2025-12-25 | Status: Active
