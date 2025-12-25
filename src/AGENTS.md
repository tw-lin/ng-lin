# Source Directory – AGENTS

## Scope
Source root (`src/`) containing application bootstrap, Angular app, global styles/assets, environment config, and TypeScript definitions. Infrastructure layer only.

## Purpose
Define boundaries for src/ directory infrastructure. All business logic must live under `src/app/`. Bootstrap files remain minimal and declarative. Prevent business logic leakage into infrastructure.

## Constraints (Must NOT)
- ❌ Create UI components at src/ root (belong under `src/app/`)
- ❌ Add feature-specific business logic outside `src/app/`
- ❌ Access Firebase directly outside repository adapters
- ❌ Add business logic to `main.ts`, `index.html`, or environment files
- ❌ Manually modify auto-generated files (e.g., `style-icons-auto.ts`)
- ❌ Include API keys or secrets in frontend code

## Allowed Content
- ✅ Infrastructure-oriented singleton services
- ✅ Global interceptors and cross-cutting concerns (logging, error handling)
- ✅ Global TypeScript declarations (no domain models)
- ✅ Global styles, assets, environment configuration
- ✅ Minimal bootstrapping code (framework-agnostic)

## Structure
```
src/
├── app/                      # Angular application (see app/AGENTS.md)
├── assets/                   # Static assets only
├── environments/             # Environment config (no secrets)
├── styles/                   # Global styles/themes
├── main.ts                   # Bootstrap entry (minimal)
├── app.config.ts             # App configuration
└── index.html                # HTML entry
```

## Dependencies
**Depends on**: Angular platform, TypeScript  
**Used by**: `src/app/` (application layer)

## Key Rules
1. **Bootstrap minimal**: Keep `main.ts` and `app.config.ts` declarative only
2. **Infrastructure only**: No feature imports or business logic
3. **DI pattern**: Use `inject()` for dependency injection
4. **Firebase access**: Only via @angular/fire adapters in `src/app/` repositories
5. **No secrets**: Environment files must not contain API keys or credentials
6. **Type safety**: Respect TypeScript strict mode and linting rules
7. **Composition**: Prefer composition over inheritance for utilities

## Related
- `app/AGENTS.md` - Application-level rules
- `environments/AGENTS.md` - Environment configuration
- `styles/AGENTS.md` - Global styles
- `../docs/architecture/` - Architecture documentation

---
Version: 1.2.0 | Updated: 2025-12-25 | Status: Active
