# GigHub Repository – AGENTS

## 🎯 IMPORTANT: How to Use AGENTS.md Files

**Before making ANY changes, follow this process:**

### Step 1: Identify Your Working File
Look at the file path you're modifying:
```
Example: src/app/features/blueprint/components/list.component.ts
                    ↓         ↓          ↓
                 Layer    Module    Sub-folder
```

### Step 2: Read AGENTS.md Files (Specific → General)

**Match your file path to the correct AGENTS.md:**

| Your File Path Pattern | Read These AGENTS.md (in order) |
|------------------------|----------------------------------|
| `src/app/core/**` | 1. `core/AGENTS.md`<br>2. `app/AGENTS.md`<br>3. `src/AGENTS.md` |
| `src/app/core/services/**` | 1. `core/services/AGENTS.md`<br>2. `core/AGENTS.md`<br>3. `app/AGENTS.md` |
| `src/app/core/data-access/**` | 1. `core/data-access/AGENTS.md`<br>2. `core/AGENTS.md`<br>3. `app/AGENTS.md` |
| `src/app/core/guards/**` | 1. `core/guards/AGENTS.md`<br>2. `core/AGENTS.md`<br>3. `app/AGENTS.md` |
| `src/app/core/blueprint/**` | 1. `core/blueprint/AGENTS.md`<br>2. `core/AGENTS.md`<br>3. `app/AGENTS.md` |
| `src/app/core/net/**` | 1. `core/net/AGENTS.md`<br>2. `core/AGENTS.md`<br>3. `app/AGENTS.md` |
| `src/app/features/**` | 1. `features/AGENTS.md`<br>2. `app/AGENTS.md` |
| `src/app/features/auth/**` | 1. `features/auth/AGENTS.md`<br>2. `features/AGENTS.md`<br>3. `app/AGENTS.md` |
| `src/app/features/explore/**` | 1. `features/explore/AGENTS.md`<br>2. `features/AGENTS.md`<br>3. `app/AGENTS.md` |
| `src/app/features/ai-assistant/**` | 1. `features/ai-assistant/AGENTS.md`<br>2. `features/AGENTS.md`<br>3. `app/AGENTS.md` |
| `src/app/features/account/**` | 1. `features/account/AGENTS.md`<br>2. `features/AGENTS.md`<br>3. `app/AGENTS.md` |
| `src/app/features/account/routes/user/**` | 1. `features/account/routes/user/AGENTS.md`<br>2. `features/account/routes/AGENTS.md`<br>3. `features/account/AGENTS.md`<br>4. `features/AGENTS.md` |
| `src/app/features/blueprint/**` | 1. `features/blueprint/AGENTS.md`<br>2. `features/AGENTS.md`<br>3. `app/AGENTS.md` |
| `src/app/shared/**` | 1. `shared/AGENTS.md`<br>2. `app/AGENTS.md` |
| `src/app/shared/components/**` | 1. `shared/components/AGENTS.md`<br>2. `shared/AGENTS.md`<br>3. `app/AGENTS.md` |
| `src/app/shared/services/**` | 1. `shared/services/AGENTS.md`<br>2. `shared/AGENTS.md`<br>3. `app/AGENTS.md` |
| `src/app/layout/**` | 1. `layout/AGENTS.md`<br>2. `app/AGENTS.md` |
| `src/app/routes/**` | 1. `routes/AGENTS.md`<br>2. `app/AGENTS.md` |
| `src/app/firebase/**` | 1. `firebase/AGENTS.md`<br>2. `app/AGENTS.md` |
| `src/styles/**` | 1. `styles/AGENTS.md`<br>2. `src/AGENTS.md` |
| `src/environments/**` | 1. `environments/AGENTS.md`<br>2. `src/AGENTS.md` |

### Step 3: Apply Rules Cumulatively
- **Most specific rules take precedence**
- **All parent rules still apply**
- **When in doubt, follow the most specific AGENTS.md**

### Step 4: Understand Agent Chain (Optional)
**For complex changes, consult `AGENTS-CHAIN.md` to understand**:
- Which agents are involved (Architecture, Feature, Test, Review, etc.)
- Priority levels (P0-P3) and execution order
- Dependencies and triggering conditions
- Parallel vs sequential execution

**Quick Reference**:
- 🏗️ Architecture/Config changes → P0 (Foundation)
- 💻 Feature/Refactor work → P1 (Core development)
- 🔍 Code review, Security, Performance → P1-P2 (Quality)
- 📚 Documentation, CI/CD → P2-P3 (Deployment)

---

## Scope
Repository-level guidance for AI coding agents working in the GigHub frontend (Angular 20 + Firebase). Defines what agents may change, operational boundaries, and architectural constraints.

## Purpose
Ensure all agent-driven changes follow project architecture, security rules, and maintainability standards. Implement minimal, Firestore-first solutions without introducing unauthorized infrastructure.

## Constraints (Must NOT)
- ❌ Create/modify UI components unless explicitly requested in feature tickets
- ❌ Add feature logic outside designated domain services or feature modules  
- ❌ Access Firebase/Firestore directly outside approved repositories
- ❌ Use constructor injection (use `inject()` instead)
- ❌ Introduce REST APIs, servers, or external backends
- ❌ Add NgModules, `any` types, or state libraries (NgRx, etc.)
- ❌ Call Vertex AI or cloud AI APIs from frontend (use functions-ai only)
- ❌ Add new libraries without human approval

## Allowed Content
- ✅ Singleton services (`providedIn: 'root'` + `inject()`)
- ✅ Global interceptors and cross-cutting concerns (logging, error handling)
- ✅ Repository/adapter files for cross-collection logic
- ✅ Firestore queries via @angular/fire inside repositories
- ✅ Tests and documentation updates

## Structure
```
/
├── src/                      # Source code (see src/AGENTS.md)
│   ├── app/                  # Angular app (see app/AGENTS.md)
│   │   ├── core/             # Infrastructure (auth, repos, guards)
│   │   ├── features/         # Business features + UI
│   │   ├── firebase/         # @angular/fire config
│   │   ├── layout/           # App chrome/layout
│   │   ├── routes/           # Page routes
│   │   └── shared/           # Reusable UI pieces
│   ├── environments/         # Config files
│   ├── styles/               # Global styles
│   └── assets/               # Static assets
├── functions/                # Firebase Cloud Functions
└── docs/                     # Documentation
```

## Dependencies
**Depends on**: Firebase platform, Angular framework  
**Used by**: All sub-modules under `src/`

## Key Rules
1. **Three-layer architecture**: UI → Service → Repository (Firestore only in repositories)
2. **Signals + Standalone**: Use Angular Signals for state, standalone components only
3. **Dependency injection**: Use `inject()`, not constructor injection
4. **Async patterns**: Result pattern for error handling, `takeUntilDestroyed()` for subscriptions
5. **Security**: Validate all inputs, follow Firestore Security Rules
6. **Performance**: Batch writes, OnPush detection, cost-aware Firestore queries
7. **Testing**: Update tests with code changes
8. **AI integration**: Backend only (functions-ai, functions-ai-document)

## **Firebase Files Location**
- **Paths**: src/firebase/firebase.json, src/firebase/firestore.indexes.json, src/firebase/firestore.rules, src/firebase/storage.rules
- **Note**: These Firebase configuration files live under `src/firebase`. Do NOT recreate, move, or duplicate them at the repository root — agents and scripts should reference `src/firebase` when reading or updating Firebase configuration.

## Related
- `src/AGENTS.md` - Source directory rules
- `src/app/AGENTS.md` - Application structure
- `AGENTS-CHAIN.md` - Agent chain reaction strategy (priorities, dependencies, workflows)
- `AGENTS-INDEX.md` - Complete file index (for human reference)
- `docs/architecture/` - Architecture documentation

---
Version: 1.2.0 | Updated: 2025-12-25 | Status: Active
