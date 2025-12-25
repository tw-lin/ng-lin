# Admin Routes – AGENTS

> **Parent**: [`../AGENTS.md`](../AGENTS.md) - Account routes

## Scope
Admin route components (`features/account/routes/admin/`). Admin-specific pages and management UI.

## Purpose
Provide admin interface for user management, system settings, and monitoring. Enforce admin-only access.

## Constraints (Must NOT)
- ❌ Allow access without admin role (use guards)
- ❌ Include business logic (use services)
- ❌ Access Firebase directly (use services)
- ❌ Use constructor injection (use `inject()`)

## Allowed Content
- ✅ Admin page components (standalone)
- ✅ Admin UI compositions
- ✅ System management interfaces
- ✅ Admin guards and metadata

## Structure
```
admin/
├── pages/                    # Admin pages
├── components/               # Admin UI (if specific)
└── routes.ts                 # Admin routes
```

## Dependencies
**Depends on**: `../../` (account services), `../../../../core/` (admin guards)  
**Used by**: Router (admin users only)

## Key Rules
1. **Admin-only**: Enforce admin role via guards
2. **Audit**: Log all admin actions
3. **Validation**: Strict validation for system changes
4. **Confirmation**: Require confirmation for destructive actions
5. **Monitoring**: Include logging and error tracking
6. **DI**: Use `inject()` exclusively

## Related
- `../AGENTS.md` - Account routes
- `../../AGENTS.md` - Account feature
- `../../../../core/guards/` - Admin guards

---
Version: 1.2.0 | Updated: 2025-12-25 | Status: Active
