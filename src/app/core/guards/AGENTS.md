# Core Guards – AGENTS

> **📍 Location**: `src/app/core/guards/` - Route guards  
> **👆 Parent**: [`../AGENTS.md`](../AGENTS.md) - Core infrastructure  

## Scope
Route guards (`src/app/core/guards/`) protecting routes with authentication, authorization, and permission checks. Implements CanActivate, CanActivateChild, CanDeactivate patterns.

## Purpose
Centralize route protection logic. Prevent unauthorized access, ensure user authentication, validate permissions, and check module enablement before route activation.

## Constraints (Must NOT)
- ❌ Include business logic (delegate to services)
- ❌ Directly access Firestore (use repositories)
- ❌ Import from `features/*` (use dependency injection)
- ❌ Use constructor injection (use `inject()`)
- ❌ Create stateful guards

## Allowed Content
- ✅ authGuard (check authentication status)
- ✅ permissionGuard (check user permissions)
- ✅ roleGuard (check user roles)
- ✅ moduleEnabledGuard (check feature flags)
- ✅ blueprintMemberGuard (check blueprint membership)
- ✅ Guard composition utilities
- ✅ Redirect logic after failed checks

## Structure
```
guards/
├── auth.guard.ts             # Authentication check
├── permission.guard.ts       # Permission check
├── role.guard.ts             # Role-based access
├── module-enabled.guard.ts   # Feature flag check
├── blueprint-member.guard.ts # Blueprint membership
└── index.ts                  # Public exports
```

## Dependencies
**Depends on**: Angular Router, @delon/auth, `core/services/`  
**Used by**: `routes/*`, `features/*/routes.ts`

## Key Rules
1. **Functional guards**: Use Angular 19+ functional guard pattern
2. **Use inject()**: No constructor injection
3. **Async resolution**: Return Observable/Promise for async checks
4. **Clear error messages**: Provide user-friendly feedback
5. **Redirect strategy**: Define fallback routes on failure
6. **Composable**: Guards should be chainable

## Agent Chain Integration
**Priority**: P1 (Security critical)  
**Triggered by**: Feature Agent when adding protected routes  
**Triggers**: Security Agent (P2) for permission validation

## Related
- `../AGENTS.md` - Core infrastructure rules
- `../../routes/AGENTS.md` - Route configuration
- `../../features/AGENTS.md` - Feature route protection

---
Version: 1.2.0 | Updated: 2025-12-25 | Status: Active
