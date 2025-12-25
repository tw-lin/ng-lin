# Exception Feature – AGENTS

## Scope
Error and exception pages (`src/app/features/exception/`). Standardized error routing and UI for 403/404/500 and testing.

## Purpose
Provide consistent error pages and testing utilities. Keep views generic and reusable without leaking business logic.

## Constraints (Must NOT)
- ❌ Include business logic or feature-specific code
- ❌ Access Firebase/Firestore directly
- ❌ Create UI beyond exception pages
- ❌ Use constructor injection (use `inject()`)

## Allowed Content
- ✅ Exception routes and components (403/404/500)
- ✅ Trigger component for manual error testing (dev only)
- ✅ Shared exception helpers and styles
- ✅ Tests verifying navigation and guard behavior

## Structure
```
exception/
├── routes.ts                 # Exception routing
├── exception.component.ts    # Reusable exception display
└── trigger.component.ts      # Manual error testing
```

## Dependencies
**Depends on**: ng-zorro Result components, `core/` guards  
**Used by**: Router (error redirects), guards

## Key Rules
1. **Generic messages**: Keep error messages clear, no business details
2. **Navigation**: Provide actions (home, back)
3. **Guards integration**: Guards may redirect here
4. **Stateless**: Use signals for minimal UI state
5. **Accessibility**: Ensure WCAG compliance
6. **Localization**: Use i18n patterns for text
7. **Testing only**: Trigger component for development/testing only

## Related
- `../AGENTS.md` - Features root
- `../../routes/AGENTS.md` - Routing integration
- `../../core/guards/` - Guard redirects

---
Version: 1.2.0 | Updated: 2025-12-25 | Status: Active
