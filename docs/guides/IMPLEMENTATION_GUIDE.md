# Implementation Guide - GigHub Patterns & Best Practices

## Overview

This guide provides practical implementation patterns extracted from the GigHub codebase. Use these patterns when building similar Angular + Firebase applications.

## Table of Contents

1. [Project Setup](#project-setup)
2. [Three-Layer Architecture](#three-layer-architecture)
3. [Repository Pattern](#repository-pattern)
4. [Service Layer Pattern](#service-layer-pattern)
5. [Component Patterns](#component-patterns)
6. [State Management with Signals](#state-management-with-signals)
7. [Event-Driven Communication](#event-driven-communication)
8. [Security Implementation](#security-implementation)
9. [Testing Patterns](#testing-patterns)
10. [Performance Optimization](#performance-optimization)

---

## Project Setup

### Initial Setup Steps

```bash
# 1. Create new Angular project
ng new my-project --standalone --routing --style=less

# 2. Install ng-alain
ng add ng-alain

# 3. Install Firebase
ng add @angular/fire

# 4. Install ng-zorro-antd
npm install ng-zorro-antd
```

### Project Structure

```
src/app/
├── core/                    # Singleton services
│   ├── services/           # Core business services
│   ├── guards/             # Route guards
│   ├── interceptors/       # HTTP interceptors
│   └── repositories/       # Data access layer
├── shared/                 # Reusable components
│   ├── components/
│   ├── directives/
│   ├── pipes/
│   └── utils/
├── layout/                 # App shell layouts
│   ├── basic/             # Main layout
│   └── passport/          # Auth layout
├── routes/                 # Feature routes
│   ├── dashboard/
│   ├── tasks/
│   └── settings/
├── app.component.ts
├── app.config.ts          # App configuration
└── app.routes.ts          # Route definitions
```

---

## Three-Layer Architecture

### Layer Responsibilities

```
┌─────────────────────────────────────────┐
│  UI Components (Presentation)           │
│  - Display data                         │
│  - Handle user input                    │
│  - Inject Services only                 │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Services (Business Logic)              │
│  - Orchestrate operations               │
│  - Business rules                       │
│  - Inject Repositories                  │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Repositories (Data Access)             │
│  - Firestore operations                 │
│  - Data mapping                         │
│  - Query building                       │
└─────────────────────────────────────────┘
```

### Implementation Example

**Component (UI Layer):**
```typescript
@Component({
  selector: 'app-task-list',
  standalone: true,
  template: `
    @if (loading()) {
      <nz-spin />
    } @else {
      @for (task of tasks(); track task.id) {
        <app-task-card [task]="task" />
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskListComponent {
  // Inject service, NOT repository
  private taskService = inject(TaskService);
  
  tasks = signal<Task[]>([]);
  loading = signal(false);
  
  ngOnInit() {
    this.loadTasks();
  }
  
  private loadTasks() {
    this.loading.set(true);
    this.taskService.getTasksByBlueprint(this.blueprintId)
      .subscribe(tasks => {
        this.tasks.set(tasks);
        this.loading.set(false);
      });
  }
}
```

**Service (Business Logic Layer):**
```typescript
@Injectable({ providedIn: 'root' })
export class TaskService {
  // Inject repository
  private repository = inject(TaskRepository);
  private eventBus = inject(BlueprintEventBus);
  
  getTasksByBlueprint(blueprintId: string): Observable<Task[]> {
    return from(this.repository.getTasks(blueprintId)).pipe(
      map(tasks => this.sortByPriority(tasks)),
      catchError(error => {
        console.error('Failed to load tasks', error);
        return of([]);
      })
    );
  }
  
  private sortByPriority(tasks: Task[]): Task[] {
    const priority = { critical: 0, high: 1, medium: 2, low: 3 };
    return tasks.sort((a, b) => 
      priority[a.priority] - priority[b.priority]
    );
  }
}
```

**Repository (Data Access Layer):**
```typescript
@Injectable({ providedIn: 'root' })
export class TaskRepository {
  private firestore = inject(Firestore);
  
  async getTasks(blueprintId: string): Promise<Task[]> {
    const tasksRef = collection(
      this.firestore,
      `blueprints/${blueprintId}/tasks`
    );
    
    const q = query(
      tasksRef,
      where('status', '!=', 'deleted'),
      orderBy('status'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.mapToTask(doc));
  }
  
  private mapToTask(doc: QueryDocumentSnapshot): Task {
    const data = doc.data();
    return {
      id: doc.id,
      title: data['title'],
      description: data['description'],
      status: data['status'],
      priority: data['priority'],
      assigneeId: data['assigneeId'],
      createdAt: data['createdAt'],
      updatedAt: data['updatedAt']
    };
  }
}
```

---

## Repository Pattern

### Base Repository Template

```typescript
export abstract class BaseRepository<T> {
  protected firestore = inject(Firestore);
  
  constructor(protected collectionPath: string) {}
  
  async getAll(): Promise<T[]> {
    const ref = collection(this.firestore, this.collectionPath);
    const snapshot = await getDocs(ref);
    return snapshot.docs.map(doc => this.mapToModel(doc));
  }
  
  async getById(id: string): Promise<T | null> {
    const docRef = doc(this.firestore, this.collectionPath, id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? this.mapToModel(snapshot) : null;
  }
  
  async create(data: Omit<T, 'id'>): Promise<T> {
    const ref = collection(this.firestore, this.collectionPath);
    const docRef = await addDoc(ref, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...data } as T;
  }
  
  async update(id: string, data: Partial<T>): Promise<void> {
    const docRef = doc(this.firestore, this.collectionPath, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  }
  
  async delete(id: string): Promise<void> {
    const docRef = doc(this.firestore, this.collectionPath, id);
    await deleteDoc(docRef);
  }
  
  protected abstract mapToModel(doc: DocumentSnapshot): T;
}
```

### Concrete Repository Example

```typescript
@Injectable({ providedIn: 'root' })
export class TaskRepository extends BaseRepository<Task> {
  constructor() {
    super('tasks'); // Base collection, will be scoped by blueprint
  }
  
  async getTasksByBlueprint(blueprintId: string): Promise<Task[]> {
    const tasksRef = collection(
      this.firestore,
      `blueprints/${blueprintId}/tasks`
    );
    
    const q = query(
      tasksRef,
      where('status', '!=', 'deleted'),
      orderBy('status'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.mapToModel(doc));
  }
  
  async getTasksAssignedTo(
    blueprintId: string,
    userId: string
  ): Promise<Task[]> {
    const tasksRef = collection(
      this.firestore,
      `blueprints/${blueprintId}/tasks`
    );
    
    const q = query(
      tasksRef,
      where('assigneeId', '==', userId),
      where('status', 'in', ['pending', 'in-progress'])
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.mapToModel(doc));
  }
  
  protected mapToModel(doc: DocumentSnapshot): Task {
    const data = doc.data();
    if (!data) throw new Error('Document data is undefined');
    
    return {
      id: doc.id,
      title: data['title'] || '',
      description: data['description'] || '',
      status: data['status'] || 'pending',
      priority: data['priority'] || 'medium',
      assigneeId: data['assigneeId'],
      dueDate: data['dueDate'],
      createdAt: data['createdAt'],
      updatedAt: data['updatedAt']
    };
  }
}
```

---

## Service Layer Pattern

### Service Template

```typescript
@Injectable({ providedIn: 'root' })
export class FeatureService {
  // Dependencies
  private repository = inject(FeatureRepository);
  private auth = inject(Auth);
  private logger = inject(LoggerService);
  private eventBus = inject(BlueprintEventBus);
  
  // Public API methods
  getAll(): Observable<Feature[]> {
    return from(this.repository.getAll()).pipe(
      tap(items => this.logger.info(`Loaded ${items.length} items`)),
      catchError(this.handleError('getAll', []))
    );
  }
  
  getById(id: string): Observable<Feature | null> {
    return from(this.repository.getById(id)).pipe(
      catchError(this.handleError('getById', null))
    );
  }
  
  create(data: CreateFeatureDto): Observable<Feature> {
    // Validate
    this.validateCreate(data);
    
    // Create
    return from(this.repository.create(data)).pipe(
      tap(feature => {
        // Emit event
        this.eventBus.emit({
          type: 'feature.created',
          blueprintId: feature.blueprintId,
          payload: { featureId: feature.id }
        });
        
        // Log
        this.logger.info('Feature created', { id: feature.id });
      }),
      catchError(this.handleError('create', null as any))
    );
  }
  
  // Error handling
  private handleError<T>(operation: string, defaultValue: T) {
    return (error: any): Observable<T> => {
      this.logger.error(`${operation} failed`, error);
      return of(defaultValue);
    };
  }
  
  // Validation
  private validateCreate(data: CreateFeatureDto): void {
    if (!data.title?.trim()) {
      throw new Error('Title is required');
    }
  }
}
```

---

## Component Patterns

### Smart vs Presentational Components

**Smart Component (Container):**
```typescript
@Component({
  selector: 'app-task-list-container',
  standalone: true,
  template: `
    <app-task-list
      [tasks]="tasks()"
      [loading]="loading()"
      (taskSelected)="onTaskSelected($event)"
      (statusChanged)="onStatusChanged($event)"
    />
  `
})
export class TaskListContainerComponent {
  private taskService = inject(TaskService);
  
  tasks = signal<Task[]>([]);
  loading = signal(false);
  
  ngOnInit() {
    this.loadTasks();
  }
  
  onTaskSelected(task: Task) {
    // Navigate or show details
  }
  
  onStatusChanged(event: { taskId: string; status: string }) {
    this.taskService.updateStatus(event.taskId, event.status)
      .subscribe(() => this.loadTasks());
  }
  
  private loadTasks() {
    this.loading.set(true);
    this.taskService.getTasks()
      .subscribe(tasks => {
        this.tasks.set(tasks);
        this.loading.set(false);
      });
  }
}
```

**Presentational Component:**
```typescript
@Component({
  selector: 'app-task-list',
  standalone: true,
  template: `
    @if (loading) {
      <nz-spin />
    } @else {
      @for (task of tasks; track task.id) {
        <app-task-card
          [task]="task"
          (click)="taskSelected.emit(task)"
          (statusChange)="onStatusChange(task, $event)"
        />
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskListComponent {
  // Inputs
  @Input() tasks: Task[] = [];
  @Input() loading = false;
  
  // Outputs
  @Output() taskSelected = new EventEmitter<Task>();
  @Output() statusChanged = new EventEmitter<{
    taskId: string;
    status: string;
  }>();
  
  onStatusChange(task: Task, status: string) {
    this.statusChanged.emit({ taskId: task.id, status });
  }
}
```

---

## State Management with Signals

### Local Component State

```typescript
@Component({
  selector: 'app-task-form',
  template: `
    <form (ngSubmit)="onSubmit()">
      <input 
        [value]="title()" 
        (input)="title.set($any($event.target).value)" 
      />
      
      <button [disabled]="!isValid()">
        Submit
      </button>
    </form>
    
    @if (errorMessage()) {
      <div class="error">{{ errorMessage() }}</div>
    }
  `
})
export class TaskFormComponent {
  // Writable signals
  title = signal('');
  description = signal('');
  priority = signal<Priority>('medium');
  submitting = signal(false);
  errorMessage = signal<string | null>(null);
  
  // Computed signals
  isValid = computed(() => 
    this.title().trim().length > 0 && !this.submitting()
  );
  
  // Effects
  constructor() {
    effect(() => {
      if (this.title().length > 100) {
        this.errorMessage.set('Title too long');
      } else {
        this.errorMessage.set(null);
      }
    });
  }
  
  onSubmit() {
    if (!this.isValid()) return;
    
    this.submitting.set(true);
    this.errorMessage.set(null);
    
    const task = {
      title: this.title(),
      description: this.description(),
      priority: this.priority()
    };
    
    this.taskService.create(task).subscribe({
      next: () => {
        this.resetForm();
        this.submitting.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.message);
        this.submitting.set(false);
      }
    });
  }
  
  private resetForm() {
    this.title.set('');
    this.description.set('');
    this.priority.set('medium');
  }
}
```

### Shared State Service

```typescript
@Injectable({ providedIn: 'root' })
export class BlueprintStateService {
  // Private writable signals
  private _selectedBlueprint = signal<Blueprint | null>(null);
  private _blueprints = signal<Blueprint[]>([]);
  private _loading = signal(false);
  
  // Public readonly signals
  selectedBlueprint = this._selectedBlueprint.asReadonly();
  blueprints = this._blueprints.asReadonly();
  loading = this._loading.asReadonly();
  
  // Computed
  hasBlueprints = computed(() => this._blueprints().length > 0);
  
  // Methods to update state
  setSelectedBlueprint(blueprint: Blueprint | null) {
    this._selectedBlueprint.set(blueprint);
  }
  
  loadBlueprints() {
    this._loading.set(true);
    this.blueprintService.getAll().subscribe(blueprints => {
      this._blueprints.set(blueprints);
      this._loading.set(false);
    });
  }
}
```

---

## Event-Driven Communication

### Event Bus Implementation

```typescript
export interface BlueprintEvent {
  type: string;
  blueprintId: string;
  timestamp: Date;
  userId: string;
  payload: any;
}

@Injectable({ providedIn: 'root' })
export class BlueprintEventBus {
  private events$ = new Subject<BlueprintEvent>();
  private auth = inject(Auth);
  
  emit(event: Omit<BlueprintEvent, 'timestamp' | 'userId'>): void {
    this.events$.next({
      ...event,
      timestamp: new Date(),
      userId: this.auth.currentUser?.uid || 'system'
    });
  }
  
  on(eventType: string): Observable<BlueprintEvent> {
    return this.events$.pipe(
      filter(event => event.type === eventType)
    );
  }
  
  onBlueprint(blueprintId: string): Observable<BlueprintEvent> {
    return this.events$.pipe(
      filter(event => event.blueprintId === blueprintId)
    );
  }
}
```

### Event Publisher

```typescript
@Injectable({ providedIn: 'root' })
export class TaskService {
  private eventBus = inject(BlueprintEventBus);
  
  completeTask(blueprintId: string, taskId: string): Observable<void> {
    return from(
      this.repository.updateTask(blueprintId, taskId, {
        status: 'completed',
        completedAt: serverTimestamp()
      })
    ).pipe(
      tap(() => {
        this.eventBus.emit({
          type: 'task.completed',
          blueprintId,
          payload: { taskId }
        });
      })
    );
  }
}
```

### Event Subscriber

```typescript
@Injectable({ providedIn: 'root' })
export class QualityService {
  private eventBus = inject(BlueprintEventBus);
  
  constructor() {
    // Subscribe to task completion events
    this.eventBus.on('task.completed')
      .pipe(
        debounceTime(1000),
        switchMap(event => this.updateQualityMetrics(event))
      )
      .subscribe();
  }
  
  private updateQualityMetrics(event: BlueprintEvent): Observable<void> {
    // Update quality dashboard when tasks complete
    return this.recalculateMetrics(event.blueprintId);
  }
}
```

---

## Security Implementation

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserId() {
      return request.auth.uid;
    }
    
    function isBlueprintMember(blueprintId) {
      return isAuthenticated() &&
        exists(/databases/$(database)/documents/blueprints/$(blueprintId)/members/$(getUserId()));
    }
    
    function getBlueprintMember(blueprintId) {
      return get(/databases/$(database)/documents/blueprints/$(blueprintId)/members/$(getUserId())).data;
    }
    
    function hasRole(blueprintId, role) {
      let member = getBlueprintMember(blueprintId);
      return member.role == role;
    }
    
    function canWrite(blueprintId) {
      let member = getBlueprintMember(blueprintId);
      return member.role in ['owner', 'admin', 'member'];
    }
    
    // Blueprint rules
    match /blueprints/{blueprintId} {
      allow read: if isBlueprintMember(blueprintId);
      allow create: if isAuthenticated();
      allow update, delete: if hasRole(blueprintId, 'owner') || 
                               hasRole(blueprintId, 'admin');
      
      // Tasks
      match /tasks/{taskId} {
        allow read: if isBlueprintMember(blueprintId);
        allow create, update: if canWrite(blueprintId);
        allow delete: if hasRole(blueprintId, 'owner') ||
                         hasRole(blueprintId, 'admin');
      }
      
      // Members
      match /members/{userId} {
        allow read: if isBlueprintMember(blueprintId);
        allow create, update, delete: if hasRole(blueprintId, 'owner') ||
                                          hasRole(blueprintId, 'admin');
      }
    }
  }
}
```

### Frontend Guard

```typescript
export const blueprintGuard: CanActivateFn = (route, state) => {
  const blueprintService = inject(BlueprintService);
  const router = inject(Router);
  
  const blueprintId = route.params['blueprintId'];
  
  return blueprintService.hasAccess(blueprintId).pipe(
    map(hasAccess => {
      if (hasAccess) {
        return true;
      } else {
        return router.createUrlTree(['/unauthorized']);
      }
    }),
    catchError(() => of(router.createUrlTree(['/error'])))
  );
};
```

---

## Testing Patterns

### Unit Test Example

```typescript
describe('TaskService', () => {
  let service: TaskService;
  let repository: jasmine.SpyObj<TaskRepository>;
  let eventBus: jasmine.SpyObj<BlueprintEventBus>;
  
  beforeEach(() => {
    const repoSpy = jasmine.createSpyObj('TaskRepository', [
      'getTasks',
      'createTask',
      'updateTask'
    ]);
    const eventSpy = jasmine.createSpyObj('BlueprintEventBus', ['emit']);
    
    TestBed.configureTestingModule({
      providers: [
        TaskService,
        { provide: TaskRepository, useValue: repoSpy },
        { provide: BlueprintEventBus, useValue: eventSpy }
      ]
    });
    
    service = TestBed.inject(TaskService);
    repository = TestBed.inject(TaskRepository) as jasmine.SpyObj<TaskRepository>;
    eventBus = TestBed.inject(BlueprintEventBus) as jasmine.SpyObj<BlueprintEventBus>;
  });
  
  it('should fetch tasks and sort by priority', (done) => {
    const mockTasks = [
      { id: '1', title: 'Low', priority: 'low' },
      { id: '2', title: 'High', priority: 'high' }
    ];
    repository.getTasks.and.returnValue(Promise.resolve(mockTasks));
    
    service.getTasks('bp-1').subscribe(tasks => {
      expect(tasks[0].priority).toBe('high');
      expect(tasks[1].priority).toBe('low');
      done();
    });
  });
  
  it('should emit event when task completed', (done) => {
    repository.updateTask.and.returnValue(Promise.resolve());
    
    service.completeTask('bp-1', 'task-1').subscribe(() => {
      expect(eventBus.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          type: 'task.completed',
          blueprintId: 'bp-1'
        })
      );
      done();
    });
  });
});
```

---

## Performance Optimization

### OnPush + trackBy

```typescript
@Component({
  selector: 'app-task-list',
  template: `
    @for (task of tasks(); track trackByTaskId($index, task)) {
      <app-task-card [task]="task" />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskListComponent {
  tasks = signal<Task[]>([]);
  
  trackByTaskId(index: number, task: Task): string {
    return task.id;
  }
}
```

### Virtual Scrolling

```typescript
@Component({
  template: `
    <cdk-virtual-scroll-viewport itemSize="72" style="height: 600px">
      @for (task of tasks(); track task.id) {
        <app-task-card [task]="task" />
      }
    </cdk-virtual-scroll-viewport>
  `
})
export class LargeTaskListComponent { }
```

---

**Document Version**: 1.0
**Last Updated**: December 24, 2025
**Maintainer**: Development Team
