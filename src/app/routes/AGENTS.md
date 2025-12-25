# Routes – AGENTS

## Scope
Routing layer (`src/app/routes/`). Route definitions, lazy loading, guards, and navigation services. No UI implementation.

## Purpose
Configure application routing with lazy-loaded features, guards, and route metadata. Keep routing concerns separate from business logic.

## Constraints (Must NOT)
- ❌ Create UI components (use feature modules)
- ❌ Include feature-specific logic
- ❌ Access Firebase directly
- ❌ Implement business operations
- ❌ Use constructor injection (use `inject()`)

## Allowed Content
- ✅ Route configuration (`routes.ts`)
- ✅ Lazy-load module references
- ✅ Guards (auth, permission, module-enabled)
- ✅ Route-level services (navigation helpers, breadcrumb)
- ✅ Global navigation interceptors

## Structure
```
routes/
├── routes.ts                 # Primary router configuration
├── guards/                   # Route guards
└── [feature]/                # Feature-specific route folders
    ├── routes.ts             # Feature routes
    └── AGENTS.md             # Feature routing rules
```

## Dependencies
**Depends on**: `core/` guards, feature modules  
**Used by**: `app.config.ts` (router configuration)

## Key Rules
1. **Lazy loading**: All features must be lazy-loaded
2. **Guard order**: Auth → Permission → Module enabled
3. **Route data**: Include title, breadcrumb, permission, module, showInMenu, icon, order
4. **Layout**: Use LayoutBasicComponent (auth required) or LayoutPassportComponent (public)
5. **Exception routes**: `/exception/*` do not require authentication
6. **Navigation**: Use router.navigate(), avoid manual URL manipulation
7. **Breadcrumbs**: Use computed() for dynamic breadcrumbs

## Related
- `../core/guards/` - Route guards
- `../features/AGENTS.md` - Feature modules
- `../layout/AGENTS.md` - Layout components

---
Version: 1.2.0 | Updated: 2025-12-25 | Status: Active

