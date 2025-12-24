# Architecture Overview - GigHub System

## Table of Contents
- [System Context](#system-context)
- [Architectural Principles](#architectural-principles)
- [System Layers](#system-layers)
- [Blueprint Architecture](#blueprint-architecture)
- [Data Flow](#data-flow)
- [Security Architecture](#security-architecture)
- [Event-Driven Communication](#event-driven-communication)

## System Context

### Business Context

GigHub is an **enterprise construction site progress tracking system** that enables:

- Multi-organization management
- Real-time collaboration across teams
- Comprehensive project tracking
- Quality assurance and compliance
- Document and contract management

### Technical Context

```
┌──────────────────────────────────────────────────────────────┐
│                         Users                                 │
│  (Project Managers, Workers, Inspectors, Executives)         │
└────────────────────┬─────────────────────────────────────────┘
                     │ HTTPS
                     ▼
┌──────────────────────────────────────────────────────────────┐
│                  Angular 20 SPA (Browser)                     │
│  ┌────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │  UI Layer  │  │   Service   │  │   Repository Layer  │   │
│  │ Components │─▶│    Layer    │─▶│  (Firestore Access) │   │
│  └────────────┘  └─────────────┘  └─────────────────────┘   │
└────────────────────┬─────────────────────────────────────────┘
                     │ Firebase SDK
                     ▼
┌──────────────────────────────────────────────────────────────┐
│                     Firebase Platform                         │
│  ┌────────────┐  ┌──────────┐  ┌────────────┐  ┌─────────┐ │
│  │ Firestore  │  │   Auth   │  │  Storage   │  │Functions│ │
│  │  (NoSQL)   │  │          │  │   (Files)  │  │(Serverl)│ │
│  └────────────┘  └──────────┘  └────────────┘  └─────────┘ │
└──────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│                    External Services                          │
│         (Gemini AI, Third-party APIs, Webhooks)              │
└──────────────────────────────────────────────────────────────┘
```

## Architectural Principles

### 1. Three-Layer Architecture

**Strict separation of concerns** with clear boundaries:

```
UI Layer (Components)
    ↓ only uses ↓
Service Layer (Business Logic)
    ↓ only uses ↓
Repository Layer (Data Access)
    ↓ only uses ↓
Firestore (Database)
```

**Rules:**
- ✅ UI components inject services only
- ✅ Services inject repositories
- ✅ Repositories handle Firestore operations only
- ❌ UI components never inject repositories directly
- ❌ Services never access Firestore directly

### 2. Blueprint as Authorization Boundary

Every piece of data belongs to a **Blueprint**:

```
Organization
  └── Blueprints (Projects/Sites)
        ├── Members (with roles)
        ├── Tasks
        ├── Logs
        ├── Documents
        ├── Quality Reports
        └── Issues
```

**Implications:**
- All queries filter by blueprint ID
- Security rules validate blueprint membership
- Cross-blueprint operations require explicit authorization
- Audit trails track blueprint-level changes

### 3. Event-Driven Module Communication

Modules are decoupled via `BlueprintEventBus`:

```typescript
// Instead of direct service calls
Module A ──╳──> Module B (tight coupling)

// Use event bus
Module A ──event──> EventBus ──subscribe──> Module B
```

**Benefits:**
- Modules can be added/removed independently
- No circular dependencies
- Easier testing with event mocks
- Clear module boundaries

### 4. Security in Depth

**Multiple security layers** working together:

```
Layer 1: Firebase Authentication
   ↓ (user identity)
Layer 2: Frontend Guards (Angular)
   ↓ (route protection)
Layer 3: Service-Level Checks
   ↓ (business rules)
Layer 4: Firestore Security Rules
   ↓ (server-side enforcement - final authority)
```

### 5. Signals-First State Management

Prefer **Angular Signals** over RxJS for local state:

```typescript
// Signals for component state
tasks = signal<Task[]>([]);
loading = signal(false);
selectedTask = signal<Task | null>(null);

// Computed values
completedCount = computed(() => 
  this.tasks().filter(t => t.status === 'completed').length
);

// RxJS for async operations only
this.taskService.getTasks()
  .subscribe(tasks => this.tasks.set(tasks));
```

### 6. Standalone Components

All components are **standalone** (no NgModules):

```typescript
@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, NzTableModule, ...],
  templateUrl: './task-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskListComponent { }
```

## System Layers

### Layer 1: UI Components

**Responsibility**: Presentation and user interaction

**Structure:**
```
src/app/
├── layout/              # App shell, header, sidebar
│   ├── basic/
│   └── passport/
├── routes/              # Feature routes
│   ├── blueprint/
│   │   ├── components/  # Presentational components
│   │   └── modules/     # Feature modules
│   │       ├── tasks/
│   │       ├── logs/
│   │       └── quality/
│   ├── passport/        # Auth pages
│   └── exception/       # Error pages
└── shared/              # Reusable components
    ├── components/
    ├── directives/
    └── pipes/
```

**Key Patterns:**
- Standalone components
- OnPush change detection
- Signal-based state
- New control flow syntax (@if, @for, @switch)
- Smart/presentational component split

**Example:**
```typescript
@Component({
  selector: 'app-task-list',
  standalone: true,
  template: `
    @if (loading()) {
      <nz-spin />
    } @else {
      @for (task of tasks(); track task.id) {
        <app-task-card 
          [task]="task"
          (statusChange)="updateStatus($event)" />
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskListComponent {
  private taskService = inject(TaskService);
  
  tasks = signal<Task[]>([]);
  loading = signal(false);
  
  ngOnInit() {
    this.loadTasks();
  }
  
  loadTasks() {
    this.loading.set(true);
    this.taskService.getTasksByBlueprint(this.blueprintId)
      .subscribe(tasks => {
        this.tasks.set(tasks);
        this.loading.set(false);
      });
  }
}
```

### Layer 2: Service Layer

**Responsibility**: Business logic and orchestration

**Structure:**
```
src/app/core/
├── services/
│   ├── firebase-auth.service.ts
│   ├── logger.service.ts
│   └── performance-monitoring.service.ts
└── blueprint/
    ├── services/
    │   ├── blueprint.service.ts
    │   ├── validation.service.ts
    │   └── dependency-validator.service.ts
    └── events/
        └── enhanced-event-bus.service.ts
```

**Responsibilities:**
- Coordinate multiple repositories
- Implement business rules
- Transform data for UI
- Handle cross-cutting concerns
- Emit/listen to events

**Example:**
```typescript
@Injectable({ providedIn: 'root' })
export class TaskService {
  private repository = inject(TaskRepository);
  private eventBus = inject(BlueprintEventBus);
  private logger = inject(LoggerService);
  
  completeTask(blueprintId: string, taskId: string): Observable<void> {
    return from(this.repository.updateTask(blueprintId, taskId, {
      status: 'completed',
      completedAt: Timestamp.now()
    })).pipe(
      tap(() => {
        // Emit event for other modules
        this.eventBus.emit({
          type: 'task.completed',
          blueprintId,
          payload: { taskId }
        });
        
        // Log activity
        this.logger.info('Task completed', { taskId });
      }),
      catchError(error => {
        this.logger.error('Failed to complete task', error);
        return throwError(() => error);
      })
    );
  }
}
```

### Layer 3: Repository Layer

**Responsibility**: Data access and Firestore operations

**Structure:**
```
src/app/core/blueprint/repositories/
├── blueprint.repository.ts
├── blueprint-member.repository.ts
└── [module-specific repositories in module folders]

src/app/routes/blueprint/shared/repositories/
├── task.repository.ts
├── log.repository.ts
└── document.repository.ts
```

**Responsibilities:**
- Execute Firestore queries
- Map Firestore documents to domain models
- Handle pagination and filtering
- Implement retry logic
- Cache optimization

**Example:**
```typescript
@Injectable({ providedIn: 'root' })
export class TaskRepository {
  private firestore = inject(Firestore);
  
  async getTasksByBlueprint(
    blueprintId: string,
    options?: QueryOptions
  ): Promise<Task[]> {
    const tasksRef = collection(
      this.firestore,
      `blueprints/${blueprintId}/tasks`
    );
    
    let q = query(tasksRef);
    
    // Apply filters
    if (options?.status) {
      q = query(q, where('status', '==', options.status));
    }
    
    // Apply sorting
    q = query(q, orderBy('createdAt', 'desc'));
    
    // Apply pagination
    if (options?.limit) {
      q = query(q, limit(options.limit));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.mapDocToTask(doc));
  }
  
  private mapDocToTask(doc: QueryDocumentSnapshot): Task {
    const data = doc.data();
    return {
      id: doc.id,
      title: data['title'],
      description: data['description'],
      status: data['status'],
      assigneeId: data['assigneeId'],
      createdAt: data['createdAt'],
      updatedAt: data['updatedAt']
    };
  }
}
```

## Blueprint Architecture

### Blueprint Lifecycle

```
┌─────────────┐
│   Created   │ (Owner creates blueprint)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Active    │ (Normal operations)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Archived   │ (Project completed)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Deleted   │ (Soft delete, recoverable)
└─────────────┘
```

### Module Configuration

Each Blueprint can enable/disable modules:

```typescript
interface BlueprintModules {
  tasks: boolean;        // Task management
  logs: boolean;         // Daily logs
  documents: boolean;    // Document storage
  quality: boolean;      // Quality control
  issues: boolean;       // Issue tracking
  cloud: boolean;        // Cloud integrations
}
```

**Dynamic Module Loading:**
```typescript
// Only load enabled modules
if (blueprint.modules.tasks) {
  const { TaskModule } = await import('./modules/tasks/task.module');
  // Register module with Blueprint container
}
```

### Permission Model

```typescript
enum BlueprintRole {
  OWNER = 'owner',      // Full control
  ADMIN = 'admin',      // Manage content & members
  MEMBER = 'member',    // Create/edit content
  VIEWER = 'viewer'     // Read-only
}

interface BlueprintMember {
  userId: string;
  role: BlueprintRole;
  permissions: string[];  // Granular permissions
  addedAt: Timestamp;
  addedBy: string;
}
```

**Permission Checking:**
```typescript
class BlueprintService {
  hasPermission(
    blueprintId: string,
    userId: string,
    permission: string
  ): Observable<boolean> {
    return this.getMember(blueprintId, userId).pipe(
      map(member => {
        if (!member) return false;
        
        // Role-based permissions
        if (member.role === 'owner') return true;
        if (member.role === 'admin' && this.isAdminPermission(permission)) {
          return true;
        }
        
        // Granular permissions
        return member.permissions.includes(permission);
      })
    );
  }
}
```

## Data Flow

### Read Flow

```
1. User Action
   ↓
2. Component calls Service
   ↓
3. Service calls Repository
   ↓
4. Repository queries Firestore
   ↓ (with security rules check)
5. Firestore returns data
   ↓
6. Repository maps to domain model
   ↓
7. Service transforms for UI
   ↓
8. Component updates Signal
   ↓
9. Template re-renders (OnPush)
```

### Write Flow

```
1. User Action (e.g., create task)
   ↓
2. Component validates form
   ↓
3. Component calls Service method
   ↓
4. Service validates business rules
   ↓
5. Service calls Repository
   ↓
6. Repository writes to Firestore
   ↓ (security rules validation)
7. Firestore confirms write
   ↓
8. Repository returns success
   ↓
9. Service emits event
   ↓
10. Component updates UI
    ↓
11. Other modules react to event
```

### Real-time Subscription Flow

```
1. Component subscribes via Service
   ↓
2. Service sets up Repository listener
   ↓
3. Repository creates Firestore snapshot listener
   ↓
4. Firestore sends initial data + updates
   ↓
5. Repository maps each change
   ↓
6. Service transforms data
   ↓
7. Component Signal updates
   ↓
8. UI re-renders automatically
```

## Security Architecture

### Firestore Security Rules Structure

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isBlueprintMember(blueprintId) {
      return isAuthenticated() &&
        exists(/databases/$(database)/documents/blueprints/$(blueprintId)/members/$(request.auth.uid));
    }
    
    function getBlueprintMember(blueprintId) {
      return get(/databases/$(database)/documents/blueprints/$(blueprintId)/members/$(request.auth.uid)).data;
    }
    
    function hasRole(blueprintId, role) {
      let member = getBlueprintMember(blueprintId);
      return member.role == role;
    }
    
    // Blueprint rules
    match /blueprints/{blueprintId} {
      allow read: if isBlueprintMember(blueprintId);
      allow create: if isAuthenticated();
      allow update, delete: if hasRole(blueprintId, 'owner') || 
                               hasRole(blueprintId, 'admin');
      
      // Tasks sub-collection
      match /tasks/{taskId} {
        allow read: if isBlueprintMember(blueprintId);
        allow create, update: if isBlueprintMember(blueprintId);
        allow delete: if hasRole(blueprintId, 'admin') || 
                         hasRole(blueprintId, 'owner');
      }
      
      // Members sub-collection
      match /members/{userId} {
        allow read: if isBlueprintMember(blueprintId);
        allow create, update, delete: if hasRole(blueprintId, 'owner') ||
                                          hasRole(blueprintId, 'admin');
      }
    }
  }
}
```

### Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Blueprint files
    match /blueprints/{blueprintId}/{allPaths=**} {
      allow read: if request.auth != null &&
        firestore.get(/databases/(default)/documents/blueprints/$(blueprintId)/members/$(request.auth.uid)).data.role != null;
      
      allow write: if request.auth != null &&
        request.resource.size < 50 * 1024 * 1024 && // 50MB limit
        request.resource.contentType.matches('image/.*|application/pdf|video/.*');
    }
  }
}
```

## Event-Driven Communication

### BlueprintEventBus

**Core event bus implementation:**

```typescript
interface BlueprintEvent {
  type: string;           // e.g., 'task.created'
  blueprintId: string;
  timestamp: Date;
  userId: string;
  payload: any;
}

@Injectable({ providedIn: 'root' })
export class BlueprintEventBus {
  private events$ = new Subject<BlueprintEvent>();
  
  emit(event: Omit<BlueprintEvent, 'timestamp' | 'userId'>): void {
    const auth = inject(Auth);
    this.events$.next({
      ...event,
      timestamp: new Date(),
      userId: auth.currentUser?.uid || 'system'
    });
  }
  
  on(eventType: string): Observable<BlueprintEvent> {
    return this.events$.pipe(
      filter(event => event.type === eventType)
    );
  }
  
  onBlueprint(
    blueprintId: string,
    eventType?: string
  ): Observable<BlueprintEvent> {
    return this.events$.pipe(
      filter(event => event.blueprintId === blueprintId),
      filter(event => !eventType || event.type === eventType)
    );
  }
}
```

### Event Naming Convention

```
<module>.<entity>.<action>

Examples:
- task.created
- task.updated
- task.deleted
- task.status.changed
- log.submitted
- quality.inspection.completed
- document.uploaded
```

### Event Prevention Strategies

**Problem**: Event storms can cause performance issues

**Solutions:**

1. **Throttling**:
```typescript
this.eventBus.on('task.updated')
  .pipe(throttleTime(1000)) // Max once per second
  .subscribe(handleUpdate);
```

2. **Debouncing**:
```typescript
this.eventBus.on('search.query')
  .pipe(debounceTime(300)) // Wait for typing to stop
  .subscribe(performSearch);
```

3. **Batching**:
```typescript
this.eventBus.on('task.updated')
  .pipe(bufferTime(1000)) // Collect events for 1 second
  .subscribe(batch => processBatch(batch));
```

4. **Circuit Breaker**:
```typescript
let eventCount = 0;
const maxEvents = 100;

this.eventBus.on('any')
  .subscribe(event => {
    if (eventCount++ > maxEvents) {
      console.error('Event storm detected!');
      // Pause event processing
    }
  });
```

## Performance Optimization

### Change Detection Strategy

```typescript
// Always use OnPush
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyComponent { }

// Use trackBy for lists
@Component({
  template: `
    @for (item of items(); track item.id) {
      <div>{{ item.name }}</div>
    }
  `
})
```

### Virtual Scrolling

```typescript
// For large lists
<cdk-virtual-scroll-viewport itemSize="50">
  @for (item of items(); track item.id) {
    <div class="item">{{ item.name }}</div>
  }
</cdk-virtual-scroll-viewport>
```

### Firestore Optimization

```typescript
// Use indexes for compound queries
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "blueprintId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}

// Pagination for large datasets
const q = query(
  tasksRef,
  orderBy('createdAt'),
  startAfter(lastDoc),
  limit(25)
);
```

---

**Document Version**: 1.0
**Last Updated**: December 24, 2025
**Maintainer**: Architecture Team
