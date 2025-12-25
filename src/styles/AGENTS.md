# Styles – AGENTS

## Scope
Global styles, theming, and design tokens under `src/styles/`. No UI components or business logic.

## Purpose
Manage global SCSS, theme variables, typography tokens, and shared style utilities. Maintain design system consistency and accessibility.

## Constraints (Must NOT)
- ❌ Create UI components
- ❌ Add feature-specific styling
- ❌ Access Firebase or business logic
- ❌ Include inline secrets or data
- ❌ Duplicate component-level styles

## Allowed Content
- ✅ Global SCSS variables and mixins
- ✅ Theme definitions (ng-zorro, ng-alain integration)
- ✅ Reset/normalize styles
- ✅ Typography tokens and utilities
- ✅ Responsive breakpoint definitions
- ✅ Accessibility utilities

## Structure
```
styles/
├── index.less                # Global entry (imports theme.less)
├── theme.less                # Theme variables (ng-zorro tokens)
├── variables/                # SCSS variables
├── mixins/                   # Reusable mixins
├── utilities/                # Utility classes
└── animations/               # Global animations
```

## Dependencies
**Depends on**: SCSS, Less, ng-zorro-antd, ng-alain  
**Used by**: All components (via `angular.json` global styles)

## Key Rules
1. **Entry point**: `index.less` is the single global style entry
2. **Theming**: Use ng-zorro-antd tokens for consistency
3. **Variables**: Use CSS custom properties or SCSS variables for tokens
4. **Accessibility**: Ensure WCAG-compliant contrast ratios
5. **Responsive**: Support mobile-first responsive design
6. **Performance**: Lightweight animations, avoid heavy selectors
7. **Generic**: Utilities must be reusable, avoid feature-specific classes
8. **Integration**: Configured via `angular.json` styles array

## Related
- `../app/shared/AGENTS.md` - Shared component styles
- `../app/layout/AGENTS.md` - Layout component styles
- `../docs/design-system/` - Design system documentation

---
Version: 1.2.0 | Updated: 2025-12-25 | Status: Active

