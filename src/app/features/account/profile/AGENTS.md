# Account Profile – AGENTS

## Scope
Profile slice (`features/account/profile/`). Reusable profile UI and logic without page routing.

## Purpose
Provide profile display and editing components. Keep UI reusable and separate from routing concerns.

## Constraints (Must NOT)
- ❌ Access Firebase SDK directly (use services/facades)
- ❌ Include routing logic (belongs in `routes/account/*`)
- ❌ Use NgModules or `any` types
- ❌ Use constructor injection (use `inject()`)

## Allowed Content
- ✅ Profile UI components (standalone, OnPush)
- ✅ Profile facades (consume core repositories)
- ✅ Signal-based profile state
- ✅ Profile view models

## Structure
```
profile/
├── components/               # Profile UI pieces
├── services/                 # Profile-specific facades
├── stores/                   # Signal state (if needed)
└── models/                   # Profile view models
```

## Dependencies
**Depends on**: `../` (account services), `../../../core/` (repositories)  
**Used by**: Route components

## Key Rules
1. **UI focus**: Components display/edit profile, no routing
2. **Standalone**: Use standalone components with OnPush
3. **Signals**: Use signals for reactive state
4. **DI**: Use `inject()` exclusively
5. **Domain models**: Keep in `core/models/`, view models here

## Related
- `../AGENTS.md` - Account feature
- `../../AGENTS.md` - Features root

---
Version: 1.2.0 | Updated: 2025-12-25 | Status: Active
