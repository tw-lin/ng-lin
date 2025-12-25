# Shared – AGENTS

## Scope
Reusable UI components, directives, pipes, and utilities (`src/app/shared/`). Pure presentation, no business logic.

## Purpose
Provide reusable, generic UI building blocks used across features. Keep components dumb and composable.

## Constraints (Must NOT)
- ❌ Include feature-specific logic or domain knowledge
- ❌ Access Firebase/Firestore directly
- ❌ Import from `features/*`
- ❌ Manage business state
- ❌ Use constructor injection (use `inject()`)

## Allowed Content
- ✅ Reusable UI components (buttons, cards, modals)
- ✅ Directives (structural, attribute)
- ✅ Pipes (formatting, transformation)
- ✅ UI utilities (helpers, formatters)
- ✅ UI-only services (local state, UI helpers)
- ✅ SHARED_IMPORTS barrel

## Structure
```
shared/
├── components/               # Reusable components
├── directives/               # Custom directives
├── pipes/                    # Custom pipes
├── utils/                    # Utility functions
├── services/                 # UI-only services (see services/AGENTS.md)
└── index.ts                  # SHARED_IMPORTS barrel
```

## Dependencies
**Depends on**: Angular, ng-zorro, ng-alain  
**Used by**: All feature modules, routes, layout

## Key Rules
1. **Dumb components**: Receive data via inputs, emit events via outputs
2. **No business logic**: Components don't know about domain models or features
3. **Standalone**: All components use standalone architecture
4. **Signals**: Use signals for local UI state
5. **DI**: Use `inject()` for dependency injection
6. **Accessibility**: Follow WCAG guidelines, use semantic HTML
7. **OnPush**: Use ChangeDetectionStrategy.OnPush for performance

## Related
- `services/AGENTS.md` - Shared business services (domain logic)
- `../core/AGENTS.md` - Core infrastructure
- `../features/AGENTS.md` - Feature modules

---
Version: 1.2.0 | Updated: 2025-12-25 | Status: Active
