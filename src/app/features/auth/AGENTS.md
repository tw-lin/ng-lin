# Auth Feature – AGENTS

> **📍 Location**: `src/app/features/auth/` - Authentication feature  
> **👆 Parent**: [`../AGENTS.md`](../AGENTS.md) - Features layer  

## Scope
Authentication feature (`src/app/features/auth/`) handling user sign-in, sign-up, password reset, email verification, and OAuth flows. UI layer for auth operations.

## Purpose
Provide user-facing authentication UI and flows. Delegates actual auth operations to `core/auth/` services. Manages auth state display and user onboarding.

## Constraints (Must NOT)
- ❌ Implement auth logic directly (delegate to `core/auth/`)
- ❌ Access Firebase Auth SDK directly (use services)
- ❌ Store sensitive data in local storage
- ❌ Use constructor injection (use `inject()`)
- ❌ Create duplicate auth state (use @delon/auth)

## Allowed Content
- ✅ Login page component
- ✅ Sign-up page component
- ✅ Password reset page
- ✅ Email verification page
- ✅ OAuth callback pages
- ✅ Auth error handling UI
- ✅ Routing configuration for auth pages
- ✅ Auth page layouts (passport layout)

## Structure
```
auth/
├── pages/
│   ├── login/                # Login page
│   ├── register/             # Sign-up page
│   ├── forgot-password/      # Password reset
│   └── verify-email/         # Email verification
├── routes.ts                 # Auth routing
└── README.md
```

## Dependencies
**Depends on**: `core/auth/`, `layout/passport/`, @delon/auth  
**Used by**: `routes/` (lazy loaded)

## Key Rules
1. **Delegate auth**: Use `core/auth/` services for all operations
2. **Use signals**: State management with Angular Signals
3. **Standalone components**: No NgModules
4. **Lazy loading**: Auth feature is lazy loaded
5. **Use inject()**: No constructor injection
6. **Passport layout**: Use dedicated auth layout

## Agent Chain Integration
**Priority**: P1 (User-facing authentication)  
**Depends on**: Architecture Agent (P0) for auth flow design  
**Triggers**: Security Agent (P2) for auth vulnerability checks

## Related
- `../../core/auth/AGENTS.md` - Auth services (if exists)
- `../../layout/passport/AGENTS.md` - Auth layout
- `../AGENTS.md` - Feature development rules

---
Version: 1.2.0 | Updated: 2025-12-25 | Status: Active
