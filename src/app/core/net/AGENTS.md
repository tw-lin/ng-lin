# Core Networking – AGENTS

## Scope
HTTP utilities and network concerns (`src/app/core/net/`). Application-wide HTTP behaviors, interceptors, and networking helpers.

## Purpose
Provide HTTP interceptors, token refresh mechanism, and network utilities for cross-cutting HTTP concerns. Keep networking generic and feature-agnostic.

## Constraints (Must NOT)
- ❌ Create UI components
- ❌ Include feature-specific logic
- ❌ Access Firebase directly (use repositories)
- ❌ Implement business logic
- ❌ Use constructor injection (use `inject()`)

## Allowed Content
- ✅ HTTP interceptors (default, auth, error handling)
- ✅ Token refresh mechanism
- ✅ Network helper functions
- ✅ HTTP utilities (retry, timeout, caching)
- ✅ Request/response transformers

## Structure
```
net/
├── default.interceptor.ts    # Default HTTP interceptor
├── refresh-token.ts          # Token refresh mechanism
├── helper.ts                 # Network helper functions
└── index.ts                  # Public API exports
```

## Dependencies
**Depends on**: Angular HttpClient, `core/auth/` (for tokens)  
**Used by**: All HTTP requests throughout app

## Key Rules
1. **Generic**: Keep networking concerns feature-agnostic
2. **Interceptors**: Use `HttpInterceptorFn` interface
3. **Token refresh**: Auto-refresh expired tokens, retry failed requests
4. **Error handling**: Transform HTTP errors to domain errors
5. **DI**: Use `inject()` for dependencies
6. **Registration**: Configure in `app.config.ts` via `withInterceptors()`
7. **Order**: Ensure interceptor execution order is correct
8. **Logging**: Log requests in development, avoid in production
9. **Result pattern**: Use for async error handling

## Related
- `../auth/AGENTS.md` - Auth token integration
- `../../app.config.ts` - Interceptor registration
- `../services/AGENTS.md` - Core services

---
Version: 1.2.0 | Updated: 2025-12-25 | Status: Active

