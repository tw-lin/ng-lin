# App – AGENTS

# App Root – AGENTS

> **📍 Location**: `src/app/` - Application root  
> **👆 Parent**: [`../AGENTS.md`](../AGENTS.md) - Source root  
> **🔍 Quick Tip**: Working in a sub-folder? Read that folder's AGENTS.md first, then come back here.

## Scope
Application root (`src/app/`). Defines core vs features separation, routing, and module organization.

## Purpose
Prevent core/feature confusion. Maintain minimal bootstrap. Separate infrastructure (core), business features, and UI components with clear boundaries.

## Constraints (Must NOT)
- ❌ Use Firebase SDK directly (only via @angular/fire in repositories)
- ❌ Create feature-to-feature coupling (use facades/ports)
- ❌ Put business logic in shared/layout/routes bootstrap
- ❌ Use constructor injection (use `inject()`)
- ❌ Use NgModules or `any` types
- ❌ Access @delon/auth directly (use core auth facade)

## Allowed Content
- ✅ App bootstrap files (`app.config.ts`, `app.component.ts`)
- ✅ Core infrastructure (auth, guards, repositories)
- ✅ Feature modules (business UI + Firestore data layer)
- ✅ Layout components (chrome, no business logic)
- ✅ Route definitions (lazy loading)
- ✅ Shared reusable UI components

## Structure
```
app/
├── app.config.ts             # Bootstrap + routing
├── app.component.ts          # Root component
├── core/                     # Infrastructure (see core/AGENTS.md)
├── features/                 # Business modules (see features/AGENTS.md)
├── firebase/                 # @angular/fire config
├── layout/                   # App chrome (see layout/AGENTS.md)
├── routes/                   # Route definitions (see routes/AGENTS.md)
└── shared/                   # Reusable UI (see shared/AGENTS.md)
```

## Dependencies
**Depends on**: `src/` infrastructure, Angular framework  
**Used by**: All feature modules and components

## Key Rules
1. **Three layers**: UI → Service/Facade → Repository (Firestore only in repositories)
2. **Core vs Features**: 
   - **Core**: Platform infrastructure, auth chain, guards, interceptors, repositories, shared domain types
   - **Features**: Business UI/flows, feature-specific Firestore data layer via @angular/fire
3. **DI**: Use `inject()` exclusively
4. **State**: Signals + standalone components
5. **Auth**: Features trigger flows, core manages @angular/fire/auth → DA_SERVICE_TOKEN
6. **No coupling**: Features call core via facades/ports, not direct dependencies

## Related
- `core/AGENTS.md` - Infrastructure layer
- `features/AGENTS.md` - Business features
- `layout/AGENTS.md` - Layout components
- `routes/AGENTS.md` - Routing
- `shared/AGENTS.md` - Shared UI

---
Version: 1.2.0 | Updated: 2025-12-25 | Status: Active
