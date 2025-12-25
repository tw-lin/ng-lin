# Shared Components – AGENTS

> **📍 Location**: `src/app/shared/components/` - Reusable UI components  
> **👆 Parent**: [`../AGENTS.md`](../AGENTS.md) - Shared layer  

## Scope
Shared UI components (`src/app/shared/components/`) providing reusable, presentational components consumed by features. No business logic or feature-specific flows.

## Purpose
Centralize reusable UI components to avoid duplication across features. Provide consistent UI patterns, form controls, and display components following ng-alain/ng-zorro standards.

## Constraints (Must NOT)
- ❌ Include feature-specific business logic
- ❌ Access Firestore directly (use inputs/outputs)
- ❌ Import from `features/*` (creates circular dependencies)
- ❌ Use constructor injection (use `inject()`)
- ❌ Create stateful components without careful consideration

## Allowed Content
- ✅ Presentational components (display data only)
- ✅ Form controls (inputs, selects, date pickers)
- ✅ Display components (cards, lists, tables)
- ✅ Modal/drawer components (team, organization)
- ✅ Breadcrumb components
- ✅ Type definitions for component interfaces
- ✅ Component-specific utilities

## Structure
```
components/
├── breadcrumb/               # Breadcrumb navigation
├── create-organization/      # Organization creation modal
├── create-team-modal/        # Team creation modal
├── edit-team-modal/          # Team edit modal
├── team-detail-drawer/       # Team details drawer
├── types/                    # Component types
└── [component-name]/         # Individual components
```

## Dependencies
**Depends on**: ng-zorro-antd, @delon/abc, Angular core  
**Used by**: `features/*`, `routes/*`

## Key Rules
1. **Presentational only**: Components receive data via inputs
2. **Use signals**: input(), output(), model() for component API
3. **Standalone components**: No NgModules
4. **Use inject()**: No constructor injection when needed
5. **OnPush detection**: Use ChangeDetectionStrategy.OnPush
6. **Type safety**: Strong typing for all inputs/outputs
7. **Accessibility**: Follow ARIA guidelines

## Agent Chain Integration
**Priority**: P1 (UI foundation)  
**Depends on**: Architecture Agent (P0) for component design  
**Triggers**: Test Agent (P1) for component testing  
**Triggers**: Documentation Agent (P2) for Storybook/examples

## Related
- `../AGENTS.md` - Shared layer rules
- `../../features/AGENTS.md` - Feature consumption patterns
- `../services/AGENTS.md` - Shared services

---
Version: 1.2.0 | Updated: 2025-12-25 | Status: Active
