# Technical Stack - GigHub

## Overview

GigHub is built with modern, enterprise-grade technologies optimized for performance, scalability, and developer experience. This document details the complete technology stack and the rationale behind each choice.

## Frontend Stack

### Core Framework

#### Angular 20.3.0
**Why Angular?**
- 🏢 **Enterprise-ready** - Proven at scale in large organizations
- 📦 **Complete framework** - Routing, forms, HTTP, testing all included
- 🔒 **Type safety** - TypeScript first-class support
- 🚀 **Performance** - Ahead-of-time compilation, tree-shaking
- 🔄 **Modern features** - Signals, standalone components, new control flow

**Key Angular Features Used:**
- **Standalone Components** - No NgModules, simpler architecture
- **Signals** - Reactive state management without RxJS complexity
- **New Control Flow** - `@if`, `@for`, `@switch` instead of directives
- **inject()** - Function-based dependency injection
- **OnPush** - Optimized change detection
- **Application Builder** - esbuild for faster builds

**Version Justification:**
Angular 20 is the latest stable version (as of analysis), providing:
- Best performance
- Latest features
- Long-term support (LTS)
- Active community

---

### UI Framework

#### ng-alain 20.1.0
**What is ng-alain?**
ng-alain is an enterprise-class UI solution based on Ant Design and Angular. It provides:
- 📊 **Business components** - Charts, dashboards, advanced tables
- 🎨 **Professional design** - Consistent enterprise UI patterns
- 🔧 **Development toolkit** - Scaffolding, themes, plugins
- 📱 **Responsive layouts** - Pre-built responsive templates

**Components Included:**
- Page layouts (basic, full, passport)
- Dashboard widgets
- Advanced data tables
- Form builders
- Chart components
- Error pages
- Authentication pages

**Configuration:**
```json
// ng-alain.json
{
  "theme": {
    "primary": "#1890ff",
    "success": "#52c41a",
    "warning": "#faad14"
  },
  "i18n": ["zh-CN", "en-US"],
  "mobile": true
}
```

#### ng-zorro-antd 20.3.1
**What is ng-zorro-antd?**
Angular implementation of Ant Design, providing 60+ high-quality components.

**Key Components Used:**
- **Layout** - Header, sidebar, content areas
- **Navigation** - Menus, tabs, breadcrumbs
- **Data Entry** - Forms, inputs, selects, date pickers
- **Data Display** - Tables, cards, lists, trees
- **Feedback** - Modals, messages, notifications, progress
- **Other** - Upload, calendar, timeline, steps

**Why Ant Design?**
- ✅ Professional enterprise look
- ✅ Comprehensive component library
- ✅ Excellent documentation
- ✅ Accessibility support
- ✅ Active maintenance

---

### Programming Language

#### TypeScript 5.9.2
**Benefits:**
- 🔒 **Type safety** - Catch errors at compile time
- 📝 **IntelliSense** - Better IDE support
- 🔧 **Refactoring** - Safe code changes
- 📚 **Documentation** - Types serve as documentation
- 🚀 **Modern features** - Latest ECMAScript support

**TypeScript Configuration:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "skipLibCheck": true
  }
}
```

**Key Features Used:**
- Generics for type-safe repositories
- Union types for state management
- Type guards for runtime safety
- Utility types (Partial, Pick, Omit)
- Decorators for Angular components

---

### State Management

#### Angular Signals (Native)
**What are Signals?**
Signals are Angular's native reactive primitive for managing state.

```typescript
// Simple signal
const count = signal(0);

// Computed signal
const doubled = computed(() => count() * 2);

// Effect
effect(() => {
  console.log('Count is:', count());
});

// Update
count.set(5);
count.update(c => c + 1);
```

**Why Signals over RxJS?**
- ✅ Simpler mental model
- ✅ Better performance
- ✅ Less boilerplate
- ✅ Easier debugging
- ✅ Native framework integration

**When to use RxJS:**
- HTTP requests (already returns Observables)
- Complex async operations
- Event streams from external sources
- Advanced operators (debounce, throttle, switchMap)

#### RxJS 7.8.0
**Used For:**
- HTTP client operations
- Form validation streams
- Real-time Firestore subscriptions
- Event bus implementation
- Complex async orchestration

**Common Patterns:**
```typescript
// HTTP with error handling
this.http.get<Task[]>('/api/tasks').pipe(
  retry(3),
  catchError(error => {
    this.logger.error('Failed to fetch tasks', error);
    return of([]);
  })
);

// Firestore real-time subscription
const tasksRef = collection(this.firestore, 'tasks');
return collectionData(tasksRef).pipe(
  map(docs => docs.map(d => this.mapToTask(d)))
);

// Event bus
this.eventBus.on('task.completed').pipe(
  debounceTime(300),
  switchMap(event => this.updateDashboard(event))
).subscribe();
```

---

## Backend Stack

### Firebase Platform 20.0.1

#### Why Firebase?
- ⚡ **Real-time** - Built-in real-time data synchronization
- 🔐 **Security** - Declarative security rules
- 🚀 **Serverless** - No server management
- 📈 **Scalable** - Automatic scaling
- 💰 **Cost-effective** - Pay for usage
- 🛠️ **Complete** - Auth, database, storage, functions, hosting

---

### Firestore (NoSQL Database)

**Data Model:**
```
organizations/{orgId}
  └── blueprints/{blueprintId}
        ├── members/{userId}
        ├── tasks/{taskId}
        ├── logs/{logId}
        ├── documents/{docId}
        └── quality/{inspectionId}
```

**Advantages:**
- 📱 **Real-time listeners** - Instant updates
- 🌍 **Offline support** - Local cache + sync
- 🔍 **Flexible queries** - Complex filtering
- 🔐 **Security rules** - Server-side validation
- 📊 **Scalable** - Automatic sharding

**Indexing Strategy:**
```json
{
  "indexes": [
    {
      "collectionGroup": "tasks",
      "fields": [
        { "fieldPath": "blueprintId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "dueDate", "order": "ASCENDING" }
      ]
    }
  ]
}
```

**Query Examples:**
```typescript
// Get overdue tasks
const q = query(
  collection(db, `blueprints/${blueprintId}/tasks`),
  where('status', '!=', 'completed'),
  where('dueDate', '<', new Date()),
  orderBy('dueDate', 'asc')
);

// Pagination
const q = query(
  tasksRef,
  orderBy('createdAt', 'desc'),
  startAfter(lastDoc),
  limit(25)
);
```

---

### Cloud Functions (Serverless)

**Languages:** TypeScript (Node.js runtime)

**Function Codebases:**

1. **functions-ai** - AI image analysis
2. **functions-ai-document** - Document OCR/extraction
3. **functions-calculation** - Progress calculations
4. **functions-event** - Event-driven workflows
5. **functions-integration** - Third-party APIs
6. **functions-scheduler** - Cron jobs
7. **functions-firestore** - Advanced Firestore ops
8. **functions-auth** - Custom auth logic
9. **functions-analytics** - Metrics aggregation
10. **functions-observability** - Logging/monitoring

**Deployment Configuration:**
```json
// firebase.json
{
  "functions": [
    {
      "source": "functions-ai",
      "codebase": "ai",
      "runtime": "nodejs22"
    },
    {
      "source": "functions-calculation",
      "codebase": "calculation",
      "runtime": "nodejs22"
    }
  ]
}
```

**Example Function:**
```typescript
import { onCall } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

export const calculateProgress = onCall(async (request) => {
  const { blueprintId } = request.data;
  
  // Verify authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User not authenticated');
  }
  
  const db = getFirestore();
  const tasksSnapshot = await db
    .collection(`blueprints/${blueprintId}/tasks`)
    .get();
  
  const total = tasksSnapshot.size;
  const completed = tasksSnapshot.docs
    .filter(d => d.data().status === 'completed')
    .length;
  
  const progress = total > 0 ? (completed / total) * 100 : 0;
  
  // Update blueprint
  await db.doc(`blueprints/${blueprintId}`).update({
    progress,
    updatedAt: FieldValue.serverTimestamp()
  });
  
  return { progress };
});
```

---

### Cloud Storage

**Purpose:** Store images, documents, CAD files

**Organization:**
```
/blueprints/{blueprintId}/
  ├── tasks/{taskId}/
  │     └── attachments/
  ├── logs/{logId}/
  │     └── photos/
  ├── documents/
  │     ├── contracts/
  │     ├── blueprints/
  │     └── photos/
  └── quality/{inspectionId}/
        └── evidence/
```

**Security Rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /blueprints/{blueprintId}/{allPaths=**} {
      allow read: if isBlueprintMember(blueprintId);
      allow write: if isBlueprintMember(blueprintId) &&
        request.resource.size < 50 * 1024 * 1024 && // 50MB
        request.resource.contentType.matches('image/.*|application/pdf|video/.*');
    }
  }
}
```

**Upload Example:**
```typescript
async uploadTaskPhoto(
  blueprintId: string,
  taskId: string,
  file: File
): Promise<string> {
  const path = `blueprints/${blueprintId}/tasks/${taskId}/${Date.now()}_${file.name}`;
  const storageRef = ref(this.storage, path);
  
  // Upload with metadata
  const metadata = {
    contentType: file.type,
    customMetadata: {
      blueprintId,
      taskId,
      uploadedBy: this.auth.currentUser.uid
    }
  };
  
  await uploadBytes(storageRef, file, metadata);
  return await getDownloadURL(storageRef);
}
```

---

### Firebase Authentication

**Providers Supported:**
- 📧 Email/Password
- 🔗 Google OAuth
- 🔗 Microsoft OAuth
- 📱 Phone (SMS)
- 🔗 Custom token (for SSO)

**Authentication Flow:**
```typescript
// Sign in
async signIn(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(
    this.auth,
    email,
    password
  );
  
  // Get custom claims (roles)
  const idTokenResult = await userCredential.user.getIdTokenResult();
  const roles = idTokenResult.claims['roles'] || [];
  
  return { user: userCredential.user, roles };
}

// Check permissions
async hasPermission(permission: string): Promise<boolean> {
  const user = this.auth.currentUser;
  if (!user) return false;
  
  const token = await user.getIdTokenResult();
  const permissions = token.claims['permissions'] || [];
  return permissions.includes(permission);
}
```

---

## Build Tools & Development

### Package Manager

#### Yarn 4.9.2 (with Workspaces)

**Why Yarn?**
- ⚡ **Fast** - Parallel installation
- 🔒 **Reliable** - Lock file for consistent installs
- 📦 **Workspaces** - Monorepo support for functions
- 💾 **Offline cache** - Faster reinstalls

**Workspace Configuration:**
```json
// package.json
{
  "packageManager": "yarn@4.9.2",
  "workspaces": [
    "functions",
    "functions-*"
  ]
}
```

**Commands:**
```bash
# Install all dependencies (including workspaces)
yarn install

# Add dependency to specific workspace
yarn workspace functions-ai add axios

# Run command in all workspaces
yarn workspaces foreach run build
```

---

### Build System

#### Angular Application Builder (esbuild)

**Why Application Builder?**
- ⚡ **10x faster** than Webpack
- 📦 **Smaller bundles** - Better tree-shaking
- 🔄 **HMR** - Hot module replacement
- 🎯 **Optimized** - ESM output

**Configuration:**
```json
// angular.json
{
  "architect": {
    "build": {
      "builder": "@angular/build:application",
      "options": {
        "browser": "src/main.ts",
        "outputPath": "dist",
        "optimization": true,
        "sourceMap": false
      }
    }
  }
}
```

**Build Performance:**
- Development build: ~5 seconds
- Production build: ~30 seconds
- Incremental rebuild: ~1 second

---

### Code Quality

#### ESLint 9.35.0

**Configuration:**
```javascript
// eslint.config.mjs
export default [
  {
    files: ['**/*.ts'],
    extends: [
      'eslint:recommended',
      '@typescript-eslint/recommended',
      'prettier'
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }]
    }
  }
];
```

#### Prettier 3.6.2

**Configuration:**
```json
// .prettierrc.js
module.exports = {
  printWidth: 100,
  tabWidth: 2,
  singleQuote: true,
  trailingComma: 'es5',
  semi: true,
  bracketSpacing: true
};
```

#### Stylelint 16.24.0

**For LESS stylesheets:**
```json
// stylelint.config.mjs
export default {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-clean-order'
  ],
  rules: {
    'selector-class-pattern': '^[a-z][a-zA-Z0-9]*$'
  }
};
```

---

### Testing

#### Karma + Jasmine

**Unit Testing:**
```typescript
describe('TaskService', () => {
  let service: TaskService;
  let repository: jasmine.SpyObj<TaskRepository>;
  
  beforeEach(() => {
    const spy = jasmine.createSpyObj('TaskRepository', ['getTasks']);
    
    TestBed.configureTestingModule({
      providers: [
        TaskService,
        { provide: TaskRepository, useValue: spy }
      ]
    });
    
    service = TestBed.inject(TaskService);
    repository = TestBed.inject(TaskRepository) as jasmine.SpyObj<TaskRepository>;
  });
  
  it('should fetch tasks', async () => {
    const mockTasks = [{ id: '1', title: 'Test' }];
    repository.getTasks.and.returnValue(Promise.resolve(mockTasks));
    
    const result = await service.getTasks('bp-1');
    expect(result).toEqual(mockTasks);
  });
});
```

#### Firebase Emulator

**Integration Testing:**
```typescript
describe('TaskRepository Integration', () => {
  beforeEach(async () => {
    // Connect to emulator
    connectFirestoreEmulator(firestore, 'localhost', 8080);
  });
  
  it('should create and retrieve task', async () => {
    const repo = new TaskRepository();
    const task = await repo.createTask('bp-1', {
      title: 'Test Task',
      status: 'pending'
    });
    
    const retrieved = await repo.getTask('bp-1', task.id);
    expect(retrieved.title).toBe('Test Task');
  });
});
```

---

## AI & Machine Learning

### Google Gemini AI

**Model:** gemini-1.5-pro

**Use Cases:**
- 📸 Image analysis (construction progress)
- 📄 Document extraction (contracts, invoices)
- 🔍 Quality inspection (defect detection)
- 💬 Natural language queries

**Integration:**
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeImage(imageUrl: string) {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-pro' 
  });
  
  const prompt = `
    Analyze this construction site photo.
    Identify: safety issues, completed tasks, quality concerns.
    Return JSON format.
  `;
  
  const result = await model.generateContent([
    prompt,
    { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } }
  ]);
  
  return JSON.parse(result.response.text());
}
```

---

## Development Workflow

### Git Workflow

**Branching Strategy:**
```
main (production)
  └── develop (staging)
        ├── feature/task-management
        ├── feature/quality-module
        └── bugfix/login-issue
```

**Commit Conventions:**
```
feat: Add task filtering by status
fix: Resolve blueprint member loading issue
docs: Update API documentation
style: Format code with Prettier
refactor: Simplify task repository
test: Add unit tests for TaskService
chore: Update dependencies
```

### CI/CD

**GitHub Actions (or similar):**
```yaml
name: CI/CD
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      - run: yarn install
      - run: yarn lint
      - run: yarn test --watch=false
      - run: yarn build
  
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: firebase deploy
```

---

## Performance Optimization

### Techniques Used

1. **OnPush Change Detection**
2. **trackBy Functions**
3. **Virtual Scrolling** (CDK)
4. **Lazy Loading** (Route-based)
5. **Image Optimization** (WebP, compression)
6. **Code Splitting** (Dynamic imports)
7. **Service Workers** (PWA - future)
8. **Firestore Indexes** (Query optimization)

### Performance Metrics

**Target Metrics:**
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Total Blocking Time (TBT): < 300ms
- Cumulative Layout Shift (CLS): < 0.1

---

## Security Stack

### Security Layers

1. **Firebase Authentication** - Identity verification
2. **Angular Guards** - Route protection
3. **Firestore Security Rules** - Data access control
4. **Storage Security Rules** - File access control
5. **Cloud Functions Auth** - API authorization
6. **HTTPS** - Transport encryption
7. **CSP Headers** - XSS prevention

### Security Best Practices

- ✅ Never trust client-side checks
- ✅ Always validate on server (security rules)
- ✅ Use parameterized queries (prevent injection)
- ✅ Sanitize user input
- ✅ Implement rate limiting
- ✅ Regular security audits
- ✅ Keep dependencies updated

---

**Document Version**: 1.0
**Last Updated**: December 24, 2025
**Maintainer**: Technical Team
