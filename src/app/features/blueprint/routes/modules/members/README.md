# Members Module - Architecture Documentation

## Overview

The Members Module follows a feature-based architecture pattern (similar to the Cloud Module #75) to achieve high cohesion, low coupling, and extensibility.

## Structure

```
src/app/routes/blueprint/modules/members/
├── members-module-view.component.ts  # Main orchestrator
├── features/                          # Feature components
│   ├── member-list/                   # Member list display feature
│   │   ├── member-list.component.ts
│   │   └── index.ts
│   └── member-form/                   # Member form feature
│       ├── member-form-modal.component.ts
│       └── index.ts
├── shared/                            # Shared utilities
│   └── index.ts
└── index.ts                           # Public API
```

## Components

### Main Orchestrator
- **MembersModuleViewComponent**: Main entry point that delegates to feature components

### Features
1. **member-list**: Displays member list table with CRUD actions
   - Component: `MemberListComponent`
   - Responsibilities: Display members, trigger add/edit/delete operations
   
2. **member-form**: Modal form for adding/editing members
   - Component: `MemberFormModalComponent`
   - Responsibilities: Member form validation, submit logic

## Design Principles

### High Cohesion (高內聚性)
All member-related functionality is grouped in one module:
- List display
- Form operations
- Member management logic

### Low Coupling (低耦合性)
- Clear interfaces via barrel exports (index.ts)
- Features communicate through well-defined inputs/outputs
- No direct dependencies between features

### Extensibility (可擴展性)
Easy to add new features:
```
features/
├── member-list/           # Existing
├── member-form/           # Existing
├── member-import/         # Future: Bulk import
├── member-export/         # Future: Export/reports
├── member-activity/       # Future: Activity history
└── member-permissions/    # Future: Permissions matrix
```

## Usage

### Importing the Module
```typescript
// Import the main orchestrator
import { MembersModuleViewComponent } from './modules/members';

// Or import specific features
import { MemberListComponent, MemberFormModalComponent } from './modules/members';
```

### Using in Routes
```typescript
{
  path: ':id/members',
  loadComponent: () => import('./modules/members').then(m => m.MembersModuleViewComponent),
  data: { title: '成員管理' }
}
```

### Using in Components
```typescript
import { MemberListComponent } from './modules/members';

@Component({
  imports: [MemberListComponent],
  template: `
    <app-member-list
      [blueprintId]="blueprintId()"
      [blueprintOwnerType]="blueprintOwnerType()"
    />
  `
})
```

## Extension Guidelines

### Adding a New Feature

1. **Create Feature Directory**
   ```bash
   mkdir -p features/new-feature
   ```

2. **Create Component**
   ```typescript
   // features/new-feature/new-feature.component.ts
   @Component({
     selector: 'app-new-feature',
     // ...
   })
   export class NewFeatureComponent { }
   ```

3. **Create Barrel Export**
   ```typescript
   // features/new-feature/index.ts
   export { NewFeatureComponent } from './new-feature.component';
   ```

4. **Add to Main Index**
   ```typescript
   // index.ts
   export * from './features/new-feature';
   ```

5. **Use in Orchestrator (if needed)**
   ```typescript
   // members-module-view.component.ts
   imports: [MemberListComponent, NewFeatureComponent]
   ```

## Migration Notes

### Changes from Old Structure

**Old Structure:**
```
src/app/routes/blueprint/members/
├── blueprint-members.component.ts
└── member-modal.component.ts
```

**New Structure:**
```
src/app/routes/blueprint/modules/members/
├── members-module-view.component.ts
├── features/
│   ├── member-list/
│   │   ├── member-list.component.ts
│   │   └── index.ts
│   └── member-form/
│       ├── member-form-modal.component.ts
│       └── index.ts
├── shared/
│   └── index.ts
└── index.ts
```

### Import Path Changes

**Before:**
```typescript
import { BlueprintMembersComponent } from './members/blueprint-members.component';
import { MemberModalComponent } from './members/member-modal.component';
```

**After:**
```typescript
import { MemberListComponent, MemberFormModalComponent } from './modules/members';
// Or use main orchestrator
import { MembersModuleViewComponent } from './modules/members';
```

### Component Name Changes

| Old Name | New Name |
|----------|----------|
| `BlueprintMembersComponent` | `MemberListComponent` |
| `MemberModalComponent` | `MemberFormModalComponent` |
| N/A | `MembersModuleViewComponent` (new orchestrator) |

## Benefits

1. **Modularity**: Easy to understand and maintain each feature independently
2. **Scalability**: Simple to add new features without affecting existing ones
3. **Testability**: Features can be tested in isolation
4. **Reusability**: Components can be reused in different contexts
5. **Consistency**: Follows established patterns (Cloud Module #75)

## Future Enhancements

Potential features to add:
- [ ] Member bulk import (CSV, Excel)
- [ ] Member export and reports
- [ ] Member activity history/audit log
- [ ] Member permissions matrix view
- [ ] Member invitation workflow
- [ ] Member role templates
- [ ] Member onboarding checklist
