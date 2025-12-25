# Environments – AGENTS

## Scope
Environment configuration under `src/environments/`. Build-time configuration, provider selection, and global toggles. No runtime logic or secrets.

## Purpose
Define build-time environment configuration with type safety. Ensure consistent structure across dev/prod environments. Separate secrets from configuration.

## Constraints (Must NOT)
- ❌ Include secrets, credentials, or API keys
- ❌ Add runtime business logic
- ❌ Create UI components
- ❌ Access Firebase directly
- ❌ Include feature-specific configuration
- ❌ Use inconsistent structure across environments

## Allowed Content
- ✅ Build-time configuration flags
- ✅ Provider selection (prod vs dev)
- ✅ Global feature toggles
- ✅ Environment-specific endpoint URLs
- ✅ Logging level configuration

## Structure
```
environments/
├── environment.ts             # Development config
├── environment.prod.ts        # Production config
└── environment.interface.ts   # Shared type definition
```

## Dependencies
**Depends on**: Angular build system, TypeScript  
**Used by**: `src/app/` (via Angular's build replacements)

## Key Rules
1. **Type safety**: All environments must conform to `Environment` interface
2. **Development**: `production: false`, enable verbose logging, use dev endpoints
3. **Production**: `production: true`, disable debugging, use prod endpoints, no mocks
4. **Build integration**: Use `angular.json` fileReplacements for environment switching
5. **No secrets**: Inject sensitive values via deployment config, never in code
6. **Structural consistency**: All environment files must have identical structure
7. **Validation**: Validate all environment values at build/runtime

## Related
- `../app/AGENTS.md` - Application configuration
- `../app/firebase/AGENTS.md` - Firebase configuration
- `../docs/security/` - Security guidelines

---
Version: 1.2.0 | Updated: 2025-12-25 | Status: Active
