# GitHub Copilot Skills for ng-lin

This directory contains GitHub Copilot Agent Skills designed specifically for the ng-lin project. These skills help Copilot understand and generate code following the project's architectural patterns, conventions, and best practices.

## What are Skills?

Skills are folders containing instructions, scripts, and resources that Copilot loads when relevant to improve its performance on specialized tasks. They are part of the [Agent Skills open standard](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills) used by GitHub Copilot coding agent, GitHub Copilot CLI, and agent mode in VS Code.

## Available Skills

### 1. [firebase-repository](./firebase-repository/)
**When to use**: Creating data access layers for Firestore collections

Generate Firebase Repository classes following the three-layer architecture (UI → Service → Repository). Ensures:
- Extends `FirestoreBaseRepository<T>`
- Direct injection of `@angular/fire` services
- Exponential backoff retry logic
- Type-safe entity mapping
- Blueprint multi-tenancy support
- No business logic in repositories

### 2. [angular-component](./angular-component/)
**When to use**: Building UI components with modern Angular 20 patterns

Create standalone components using:
- Signals for state management (`signal()`, `computed()`, `effect()`)
- New syntax: `input()`, `output()`, `@if`, `@for`, `@switch`
- `inject()` dependency injection
- OnPush change detection
- Proper lifecycle management

### 3. [firestore-security-rules](./firestore-security-rules/)
**When to use**: Implementing collection-level security and access control

Write Security Rules following:
- Blueprint multi-tenancy pattern
- BlueprintMember validation
- Role-based permissions
- Data isolation enforcement
- Performance optimization (minimize `get()` calls)

### 4. [blueprint-integration](./blueprint-integration/)
**When to use**: Adding Blueprint-aware functionality to features

Integrate multi-tenancy patterns:
- Blueprint permission boundaries
- BlueprintMember access control
- Resource isolation by Blueprint
- Ownership handling (User vs Organization)
- Event-driven communication

### 5. [event-bus-integration](./event-bus-integration/)
**When to use**: Implementing cross-module communication

Use BlueprintEventBus for:
- Event-driven architecture
- Domain event publishing
- Event subscription with cleanup
- Audit logging and notifications
- Workflow orchestration

### 6. [ng-alain-component](./ng-alain-component/)
**When to use**: Building enterprise UI with ng-alain/ng-zorro-antd

Create components using:
- ST (Simple Table) for data tables
- SF (Schema Form) for dynamic forms
- ACL for access control
- PageHeader, modals, drawers
- Responsive layouts
- Theming and dark mode

### 7. [delon-form](./delon-form/)
**When to use**: Creating dynamic schema-based forms

Build forms using @delon/form SF component:
- JSON Schema-driven form generation
- Custom widgets (input, select, date, upload, etc.)
- Async data loading for dropdowns
- Conditional field visibility
- Custom validators
- Multi-step forms (wizards)
- Grid layouts and responsive design

### 8. [delon-auth](./delon-auth/)
**When to use**: Implementing authentication and authorization

Integrate authentication using @delon/auth:
- JWT token management
- Login/logout flows
- Role-based access control (RBAC)
- Permission checking
- Route guards
- HTTP token interceptors
- Firebase Auth integration
- Session management

### 9. [delon-cache](./delon-cache/)
**When to use**: Implementing caching strategies

Optimize performance with @delon/cache:
- Memory cache (fast, non-persistent)
- LocalStorage cache (persistent across sessions)
- SessionStorage cache (session-only)
- TTL-based expiration
- Cache invalidation
- HTTP request caching
- Lazy loading patterns

### 10. [rxjs-patterns](./rxjs-patterns/)
**When to use**: Working with reactive programming and async data

Master RxJS patterns for Angular:
- Signal/Observable interop (`toSignal()`, `toObservable()`)
- Common operators (switchMap, debounceTime, catchError)
- Subscription management (`takeUntilDestroyed()`)
- Error handling and retry logic
- Combining observables (combineLatest, forkJoin)
- Real-time data patterns

### 11. [tinymce-editor](./tinymce-editor/)
**When to use**: Integrating rich text editor functionality

Implement WYSIWYG editor using ngx-tinymce:
- TinyMCE configuration
- Custom toolbar and plugins
- Image upload to Firebase Storage
- Content sanitization
- Reactive forms integration
- Auto-save functionality
- Templates and code highlighting
- Mobile responsive editor

### 12. [angular-cdk](./angular-cdk/)
**When to use**: Using Angular CDK utilities for advanced UI features

Create components using Angular CDK:
- Drag-and-drop with `CdkDragDrop`
- Overlay service for tooltips/menus
- Virtual scrolling for large lists
- Accessibility (focus traps, ARIA)
- Clipboard operations
- Platform detection
- Portal for dynamic content
- Text field auto-sizing

### 13. [delon-theme](./delon-theme/)
**When to use**: Configuring application layout and theming

Implement theming and layout using @delon/theme:
- Layout configuration (side/top mode)
- Menu service and navigation
- Settings drawer for customization
- Responsive design patterns
- Theme color customization
- Logo and branding
- Header/sidebar components
- Dark mode support

### 14. [screenfull](./screenfull/)
**When to use**: Implementing fullscreen functionality

Add fullscreen capabilities using screenfull:
- Toggle fullscreen mode
- Fullscreen specific elements
- Image/video fullscreen viewers
- Presentation mode
- Dashboard fullscreen view
- Keyboard shortcuts (Escape to exit)
- Browser compatibility handling
- Mobile fullscreen support

### 15. [delon-chart](./delon-chart/)
**When to use**: Creating data visualizations and charts

Build enterprise charts using @delon/chart:
- G2 Bar/Mini-Bar charts
- G2 Pie/Donut charts
- G2 Radar charts
- Timeline charts
- Chart cards with trend indicators
- Dashboard statistics visualization
- Responsive chart layouts
- Real-time data updates with signals

### 16. [delon-util](./delon-util/)
**When to use**: Using utility functions for data manipulation

Leverage @delon/util for common operations:
- Array utilities (deepCopy, deepMerge, groupBy, orderBy)
- String formatting and case conversion
- Date utilities (getTimeDistance, formatDistanceToNow)
- Number formatting (currency, toPercent, toThousands)
- Browser utilities (copy, scrollToTop, isEmpty)
- Type-safe deep object access
- Immutable state management helpers

### 17. [delon-acl](./delon-acl/)
**When to use**: Implementing access control and permissions

Manage permissions using @delon/acl:
- Role-based access control (RBAC)
- Ability-based permissions
- ACL directives (*aclIf)
- Route guards (role/ability-based)
- Blueprint permission integration
- UI element visibility control
- Dynamic permission checking
- Combined with Security Rules

### 18. [uuid](./uuid/)
**When to use**: Generating unique identifiers

Generate UUIDs using uuid library:
- v4 (random) for general entity IDs
- v7 (timestamp-based) for sortable IDs
- Task, user, blueprint ID generation
- Session and file upload tracking
- Audit log entries (v7 for chronological order)
- Database primary keys
- Request tracking IDs

### 19. [monaco-editor](./monaco-editor/)
**When to use**: Integrating code/text editor functionality

Implement Monaco Editor using @ng-util/monaco-editor:
- VS Code-powered code editor
- Syntax highlighting for multiple languages
- IntelliSense and autocomplete
- JSON/TypeScript/HTML/CSS editing
- Diff viewer for comparisons
- Configuration file editor
- Firestore Security Rules editor
- Read-only code display

## How Skills Work

### Automatic Loading
Copilot automatically loads relevant skills based on:
1. Your prompt content
2. The skill's description
3. Current file context
4. Task requirements

### Manual Invocation
You can explicitly request a skill:
```
"Use the firebase-repository skill to create a new task repository"
"Follow the angular-component skill to build a user profile component"
```

## Skill Structure

Each skill follows this structure:
```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description, license)
│   └── Markdown instructions
├── scripts/ (optional)
│   └── Helper scripts
└── references/ (optional)
    └── Additional documentation
```

## Project Context

These skills are tailored for:

### Tech Stack
- **Frontend**: Angular 20 + TypeScript 5.9
- **UI Framework**: ng-alain 20.1 + ng-zorro-antd 20
- **UI Components**: @delon/abc, @delon/form, @delon/auth, @delon/cache, @delon/chart, @delon/theme, @delon/acl, @delon/util
- **State Management**: Angular Signals
- **Reactive Programming**: RxJS 7.8
- **Rich Text Editor**: ngx-tinymce 20
- **Code Editor**: @ng-util/monaco-editor 20.0.1
- **UI Utilities**: @angular/cdk 20.x (drag-drop, overlay, virtual scroll)
- **Fullscreen API**: screenfull 6.0
- **UUID Generation**: uuid 13.0.0
- **Backend**: Firebase (Firestore, Auth, Storage, Functions)
- **Architecture**: Three-layer (UI → Service → Repository)

### Core Patterns
- **Multi-Tenancy**: Blueprint-based permission boundaries
- **Event-Driven**: BlueprintEventBus for cross-module communication
- **Security-First**: Firestore Security Rules as first defense
- **Repository Pattern**: All Firestore access through repositories
- **Signals**: Reactive state management

### Key Constraints
- 100% standalone components (no NgModules)
- Direct `@angular/fire` injection (no FirebaseService wrapper)
- `inject()` DI (not constructor injection)
- New control flow syntax (`@if`, `@for`, `@switch`)
- OnPush change detection

## Usage Examples

### Creating a New Repository
```typescript
// Prompt: "Create a task repository using the firebase-repository skill"

// Copilot will generate:
@Injectable({ providedIn: 'root' })
export class TaskRepository extends FirestoreBaseRepository<Task> {
  protected collectionName = 'tasks';
  private firestore = inject(Firestore);
  
  protected toEntity(data: DocumentData, id: string): Task {
    // ... proper mapping
  }
  
  async findByBlueprintId(blueprintId: string): Promise<Task[]> {
    return this.executeWithRetry(async () => {
      // ... with retry logic and Blueprint filter
    });
  }
}
```

### Creating an Angular Component
```typescript
// Prompt: "Create a task list component following angular-component skill"

// Copilot will generate:
@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <nz-spin />
    } @else {
      @for (task of tasks(); track task.id) {
        <app-task-item [task]="task" />
      }
    }
  `
})
export class TaskListComponent {
  private taskService = inject(TaskService);
  loading = signal(false);
  tasks = signal<Task[]>([]);
  // ... proper implementation
}
```

### Writing Security Rules
```javascript
// Prompt: "Add security rules for tasks collection using firestore-security-rules skill"

// Copilot will generate:
match /tasks/{taskId} {
  allow read: if isAuthenticated() && 
                 isBlueprintMember(resource.data.blueprintId);
  
  allow create: if isAuthenticated() && 
                   hasPermission(request.resource.data.blueprintId, 'task:create');
  // ... complete validation
}
```

## Best Practices

### 1. Be Specific in Prompts
❌ "Create a component"
✅ "Use the angular-component skill to create a task list component with signals"

### 2. Combine Skills
```
"Create a task repository with firebase-repository skill, 
then add security rules using firestore-security-rules skill,
and integrate with blueprint-integration for multi-tenancy"
```

### 3. Reference Existing Code
```
"Follow the pattern in UserRepository but create a TaskRepository 
using the firebase-repository skill"
```

### 4. Validate Generated Code
Always review generated code against:
- [ ] Project architectural patterns
- [ ] Type safety (no `any`)
- [ ] Security considerations
- [ ] Performance implications
- [ ] Testing requirements

## Maintenance

### Adding New Skills
1. Create skill directory in `.github/skills/`
2. Add `SKILL.md` with proper frontmatter
3. Include clear description for auto-loading
4. Provide comprehensive examples
5. Update this README

### Updating Skills
- Keep skills synchronized with project evolution
- Update when architectural patterns change
- Add new examples as patterns emerge
- Remove deprecated patterns

### Testing Skills
1. Use skills in real development tasks
2. Validate generated code quality
3. Gather feedback from team
4. Refine descriptions and examples

## Related Documentation

### Core Instructions
- [Angular 20 Guidelines](.github/instructions/angular.instructions.md)
- [Architecture Principles](.github/instructions/ng-gighub-architecture.instructions.md)
- [Repository Pattern](.github/instructions/ng-gighub-firestore-repository.instructions.md)
- [Security Rules](.github/instructions/ng-gighub-security-rules.instructions.md)
- [Signals State](.github/instructions/ng-gighub-signals-state.instructions.md)
- [ng-alain Guide](.github/instructions/ng-alain-delon.instructions.md)

### Character Profiles
- [AI Behavior Guidelines](docs/⭐️/🧠AI_Behavior_Guidelines.md)
- [AI Character Profile](docs/⭐️/🤖AI_Character_Profile_Impl.md)

### Architecture Documentation
- [Executive Summary](docs/⭐️/EXECUTIVE_SUMMARY.md)
- [Architectural Analysis](docs/⭐️/ARCHITECTURAL_ANALYSIS_REPORT.md)
- [Global Event Bus](docs/⭐️/Global Event Bus.md)

## Support

### Issues with Skills
- Skill not loading: Check description clarity
- Wrong pattern generated: Refine prompt specificity
- Missing context: Add more examples to skill

### Contributing
To improve skills:
1. Identify pattern gaps
2. Create or update skill
3. Test with real use cases
4. Document changes
5. Share with team

## References

- [GitHub Copilot Skills Documentation](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills)
- [Anthropic Skills Examples](https://github.com/anthropics/skills)
- [Awesome Copilot Collection](https://github.com/github/awesome-copilot)

---

**Last Updated**: 2025-12-25  
**Skills Version**: 1.3.0  
**Skills Count**: 19  
**Compatible with**: Angular 20.3.x, ng-alain 20.1.x, Firebase 20.0.1, RxJS 7.8.x, ngx-tinymce 20.0.0, @angular/cdk 20.x, screenfull 6.0.x, uuid 13.0.0, @ng-util/monaco-editor 20.0.1
