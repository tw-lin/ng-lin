# Social (Friends) Feature – AGENTS

## Scope
Social/friends features (`src/app/features/social/`). Friends UI pages, services, and routing following GigHub conventions.

## Purpose
Implement friends/social functionality with list/card views, service layer, and event integration. Keep to project patterns.

## Constraints (Must NOT)
- ❌ Create UI outside this module scope
- ❌ Access Firebase directly (use services/repositories)
- ❌ Leak feature logic beyond social/friends
- ❌ Use constructor injection (use `inject()`)

## Allowed Content
- ✅ Friends list/card page components (standalone)
- ✅ Friend service and store (business logic + data)
- ✅ Event bus integration for social events
- ✅ Supporting docs and tests

## Structure
```
social/
├── pages/                    # Friends pages
│   └── friends.page.ts
├── components/               # Friend UI components
│   └── friend-card.component.ts
└── routes/                   # Route registration
    └── friends.routes.ts
```

## Dependencies
**Depends on**: `core/` (EventBus, repositories), `shared/` (UI components)  
**Used by**: `routes/social/*` (route components)

## Key Rules
1. **Standalone components**: Use standalone architecture
2. **Signals**: Use signals for state management
3. **Services**: Use FriendService for business logic
4. **Store**: Use FriendStore for local state (signals)
5. **Events**: Emit/consume via BlueprintEventBus
6. **Accessibility**: Maintain a11y in UI components
7. **Repository**: Implement Firestore calls via repository
8. **Security Rules**: Update Firestore rules for friends collection

## Related
- `../AGENTS.md` - Features root
- `../../core/AGENTS.md` - Core services
- `../../routes/AGENTS.md` - Routing

---
Version: 1.2.0 | Updated: 2025-12-25 | Status: Active
