# Account Settings – AGENTS

## Scope
Settings slice (`features/account/settings/`). Reusable settings UI and logic.

## Purpose
Provide settings UI components for account preferences, notifications, and configuration. Keep routing separate.

## Constraints (Must NOT)
- ❌ Access Firebase SDK directly (use services)
- ❌ Include routing logic (belongs in `routes/account/*`)
- ❌ Use NgModules or `any` types
- ❌ Use constructor injection (use `inject()`)

## Allowed Content
- ✅ Settings UI elements (standalone, OnPush)
- ✅ Settings facades (consume account/core services)
- ✅ Signal-based settings state
- ✅ Settings view models

## Structure
```
settings/
├── components/               # Settings UI elements
├── services/                 # Settings facades
├── stores/                   # Signal state (if needed)
└── models/                   # View models for settings
```

## Dependencies
**Depends on**: `../` (account services), `../../../core/` (repositories)  
**Used by**: Route components

## Key Rules
1. **Separation**: Keep routing out, settings pages in `routes/account/*`
2. **Standalone**: Use standalone components with OnPush
3. **Signals**: Use signals for reactive state
4. **DI**: Use `inject()` exclusively
5. **Validation**: Validate settings before save

## Related
- `../AGENTS.md` - Account feature
- `../../AGENTS.md` - Features root

---
Version: 1.2.0 | Updated: 2025-12-25 | Status: Active
