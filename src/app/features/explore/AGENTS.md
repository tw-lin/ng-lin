# Explore Feature – AGENTS

> **📍 Location**: `src/app/features/explore/` - Discovery feature  
> **👆 Parent**: [`../AGENTS.md`](../AGENTS.md) - Features layer  

## Scope
Explore feature (`src/app/features/explore/`) for discovering blueprints, organizations, teams, and users. Includes search, filtering, and browse capabilities.

## Purpose
Enable users to discover and explore public content, search across entities, and find relevant blueprints/organizations. Provides discovery UI separate from account/blueprint management.

## Constraints (Must NOT)
- ❌ Include account management logic (use `features/account/`)
- ❌ Include blueprint editing logic (use `features/blueprint/`)
- ❌ Access Firestore directly (use repositories)
- ❌ Use constructor injection (use `inject()`)
- ❌ Create duplicate search implementations

## Allowed Content
- ✅ Explore page components
- ✅ Search components
- ✅ Filter components
- ✅ Browse/listing components
- ✅ Explore-specific models
- ✅ Explore services (search, filter logic)
- ✅ Routing configuration
- ✅ Explore-specific repositories (if needed)

## Structure
```
explore/
├── components/               # Reusable explore components
├── models/                   # Explore-specific models
├── pages/                    # Explore pages
│   ├── browse/
│   ├── search/
│   └── details/
├── routing/                  # Explore routing
└── services/                 # Search/filter services
```

## Dependencies
**Depends on**: `core/services/`, `shared/components/`, Firebase Search  
**Used by**: `routes/` (lazy loaded)

## Key Rules
1. **Read-only focus**: Explore is for discovery, not editing
2. **Use signals**: State management with Angular Signals
3. **Standalone components**: No NgModules
4. **Lazy loading**: Feature is lazy loaded
5. **Use inject()**: No constructor injection
6. **Public data only**: No sensitive information display

## Agent Chain Integration
**Priority**: P1 (User-facing feature)  
**Depends on**: Architecture Agent (P0) for search strategy  
**Triggers**: Performance Agent (P2) for search optimization

## Related
- `../account/AGENTS.md` - Account management
- `../blueprint/AGENTS.md` - Blueprint feature
- `../../shared/AGENTS.md` - Shared components

---
Version: 1.2.0 | Updated: 2025-12-25 | Status: Active
