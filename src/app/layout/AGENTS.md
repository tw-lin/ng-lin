# Layout – AGENTS

## Scope
App layout components and chrome (`src/app/layout/`). Page framework only (Basic/Blank/Passport layouts), no business logic.

## Purpose
Provide consistent page layouts and navigation chrome. Keep layout presentational, delegate business logic to services.

## Constraints (Must NOT)
- ❌ Include feature business logic or state
- ❌ Access Firebase/Firestore directly
- ❌ Create cross-feature coupling
- ❌ Implement data operations or complex logic
- ❌ Use constructor injection (use `inject()`)

## Allowed Content
- ✅ Layout container components (Basic, Blank, Passport)
- ✅ Layout services (breakpoints, theme, navigation)
- ✅ Header, sidebar, footer components
- ✅ Lightweight guards/interceptors for layout needs only

## Structure
```
layout/
├── basic/                    # Main app layout (with sidebar)
├── blank/                    # Minimal layout (no chrome)
├── passport/                 # Auth layout (login/signup)
└── shared/                   # Shared layout utilities
```

## Dependencies
**Depends on**: `core/` services, `shared/` components  
**Used by**: Route components via router

## Key Rules
1. **Presentational**: Layouts render structure, no business decisions
2. **Three layers**: UI → layout service → shared/core APIs (no repositories)
3. **DI**: Use `inject()` + signals
4. **Stateless**: Keep layouts composable and stateless where possible
5. **Navigation**: Layout chrome can show navigation, but routes define structure
6. **Responsive**: Support mobile/tablet/desktop breakpoints

## Related
- `../routes/AGENTS.md` - Route layout assignments
- `../core/AGENTS.md` - Core services
- `../shared/AGENTS.md` - Shared components

---
Version: 1.2.0 | Updated: 2025-12-25 | Status: Active
