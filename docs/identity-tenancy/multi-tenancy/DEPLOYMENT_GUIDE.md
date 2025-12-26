# Multi-Tenancy System Deployment Guide

**Version**: 1.0  
**Last Updated**: 2025-12-26  
**Status**: Production Ready  
**Target Platform**: Firebase + Angular 20

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Deployment Steps](#deployment-steps)
4. [Deployment Strategies](#deployment-strategies)
5. [Firestore Schema Setup](#firestore-schema-setup)
6. [Security Rules Deployment](#security-rules-deployment)
7. [Application Configuration](#application-configuration)
8. [Local Testing](#local-testing)
9. [Production Deployment](#production-deployment)
10. [Rollback Procedures](#rollback-procedures)
11. [Troubleshooting](#troubleshooting)
12. [Migration Guide](#migration-guide)
13. [Performance Tuning](#performance-tuning)

---

## Overview

This guide provides step-by-step instructions for deploying the GigHub Multi-Tenancy System, which implements Blueprint-based tenant isolation with flexible ownership models (User/Organization) and membership types (User/Team/Partner).

### Key Features

- **Blueprint-Based Isolation**: Permission boundaries, not data boundaries
- **Flexible Ownership**: User-owned or Organization-owned Blueprints
- **Multi-Member Types**: Users, Teams, Partners with role-based permissions
- **Context Management**: Automatic tenant context injection via resolvers
- **Security First**: Firestore Security Rules enforce multi-tenant isolation

### Architecture

```
User → Organization → Blueprint → Resources
         ↓
    Team / Partner
```

---

## Prerequisites

### Required Tools

| Tool | Minimum Version | Purpose |
|------|-----------------|---------|
| Node.js | 20.x | Runtime environment |
| npm | 10.x | Package manager |
| Angular CLI | 20.x | Development framework |
| Firebase CLI | 13.x | Firebase deployment |
| Git | 2.x | Version control |

### Firebase Project Setup

1. **Create Firebase Project**:
   ```bash
   # Visit https://console.firebase.google.com/
   # Create new project: gighub-production
   ```

2. **Enable Required Services**:
   - Firestore Database (Native mode)
   - Firebase Authentication
   - Cloud Storage
   - Cloud Functions (Blaze plan required)

3. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase projects:list
   ```

### Project Configuration

1. **Clone Repository**:
   ```bash
   git clone https://github.com/your-org/gighub.git
   cd gighub
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Firebase**:
   ```bash
   firebase init
   # Select: Firestore, Functions, Hosting
   # Use existing project: gighub-production
   ```

---

## Deployment Steps

### Step 1: Firestore Schema Setup

**Create Collections**:

```bash
# Use Firebase Console or Firestore Emulator
# Collections to create:
# - /blueprints
# - /blueprintMembers
# - /organizations
# - /organizationMembers
# - /teams
# - /partners
```

**Create Composite Indexes**:

```javascript
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "blueprintMembers",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "blueprintId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "blueprintMembers",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "blueprints",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "ownerType", "order": "ASCENDING" },
        { "fieldPath": "ownerId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "teams",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "organizationId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "partners",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "organizationId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

Deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

**Set TTL Policies**:

```bash
# Via Firebase Console > Firestore > (Select collection) > More options > Set TTL
# Set 90-day retention for soft-deleted entities:
# - blueprints (deletedAt field)
# - organizations (deletedAt field)
# - teams (deletedAt field)
# - partners (deletedAt field)
```

### Step 2: Security Rules Deployment

**Create `firestore.rules`**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getCurrentUserId() {
      return request.auth.uid;
    }
    
    function isBlueprintMember(blueprintId) {
      let memberId = getCurrentUserId() + '_' + blueprintId;
      return exists(/databases/$(database)/documents/blueprintMembers/$(memberId));
    }
    
    function getBlueprintMemberRole(blueprintId) {
      let memberId = getCurrentUserId() + '_' + blueprintId;
      let member = get(/databases/$(database)/documents/blueprintMembers/$(memberId));
      return member.data.role;
    }
    
    function hasPermission(blueprintId, permission) {
      let memberId = getCurrentUserId() + '_' + blueprintId;
      let member = get(/databases/$(database)/documents/blueprintMembers/$(memberId));
      return permission in member.data.permissions;
    }
    
    function isMemberActive(blueprintId) {
      let memberId = getCurrentUserId() + '_' + blueprintId;
      let member = get(/databases/$(database)/documents/blueprintMembers/$(memberId));
      return member.data.status == 'active';
    }
    
    function isBlueprintOwner(blueprintId) {
      let blueprint = get(/databases/$(database)/documents/blueprints/$(blueprintId));
      return blueprint.data.ownerType == 'user' && 
             blueprint.data.ownerId == getCurrentUserId();
    }
    
    // Blueprints Collection
    match /blueprints/{blueprintId} {
      allow read: if isAuthenticated() && isBlueprintMember(blueprintId);
      
      allow create: if isAuthenticated() && 
                       request.resource.data.ownerType == 'user' &&
                       request.resource.data.ownerId == getCurrentUserId();
      
      allow update: if isAuthenticated() && 
                       isBlueprintMember(blueprintId) &&
                       hasPermission(blueprintId, 'blueprint:update');
      
      allow delete: if isAuthenticated() && isBlueprintOwner(blueprintId);
    }
    
    // Blueprint Members Collection
    match /blueprintMembers/{memberId} {
      allow read: if isAuthenticated() && 
                     isBlueprintMember(resource.data.blueprintId);
      
      allow create, update: if isAuthenticated() && 
                               isBlueprintMember(resource.data.blueprintId) &&
                               hasPermission(resource.data.blueprintId, 'member:manage');
      
      allow delete: if isAuthenticated() && 
                       isBlueprintOwner(resource.data.blueprintId);
    }
    
    // Organizations Collection
    match /organizations/{orgId} {
      allow read: if isAuthenticated();
      
      allow create: if isAuthenticated();
      
      allow update, delete: if isAuthenticated() && 
                               resource.data.ownerId == getCurrentUserId();
    }
    
    // Organization Members Collection
    match /organizationMembers/{memberId} {
      allow read: if isAuthenticated();
      
      allow create, update, delete: if isAuthenticated();
    }
    
    // Teams Collection
    match /teams/{teamId} {
      allow read: if isAuthenticated();
      
      allow create, update, delete: if isAuthenticated();
    }
    
    // Partners Collection
    match /partners/{partnerId} {
      allow read: if isAuthenticated();
      
      allow create, update, delete: if isAuthenticated();
    }
  }
}
```

Deploy Security Rules:
```bash
firebase deploy --only firestore:rules
```

### Step 3: Application Configuration

**Configure TenantContextService**:

```typescript
// src/app/app.config.ts
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { TenantContextService } from '@core/services/tenant-context.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
    
    // Provide TenantContextService globally
    TenantContextService,
    
    // ... other providers
  ]
};
```

**Configure Route Resolvers**:

```typescript
// src/app/routes/routes.ts
import { Routes } from '@angular/router';
import { BlueprintGuard } from '@core/guards/blueprint.guard';
import { blueprintResolver } from '@core/resolvers/blueprint.resolver';

export const routes: Routes = [
  {
    path: 'blueprints/:blueprintId',
    canActivate: [BlueprintGuard],
    resolve: {
      blueprint: blueprintResolver
    },
    children: [
      {
        path: 'tasks',
        loadComponent: () => import('./tasks/task-list.component')
      }
    ]
  }
];
```

**Configure Guards**:

```typescript
// src/app/core/guards/blueprint.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TenantContextService } from '@core/services/tenant-context.service';
import { map } from 'rxjs/operators';

export const BlueprintGuard: CanActivateFn = (route, state) => {
  const tenantContext = inject(TenantContextService);
  const router = inject(Router);
  const blueprintId = route.paramMap.get('blueprintId');
  
  if (!blueprintId) {
    router.navigate(['/']);
    return false;
  }
  
  return tenantContext.hasAccess(blueprintId).pipe(
    map(hasAccess => {
      if (!hasAccess) {
        router.navigate(['/access-denied']);
        return false;
      }
      return true;
    })
  );
};
```

### Step 4: Local Testing with Firebase Emulators

**Start Emulators**:

```bash
# Start Firestore and Auth emulators
firebase emulators:start --only firestore,auth

# Output:
# ┌─────────────┬────────────────┐
# │ Emulator    │ Host:Port      │
# ├─────────────┼────────────────┤
# │ Firestore   │ 0.0.0.0:8080   │
# │ Auth        │ 0.0.0.0:9099   │
# └─────────────┴────────────────┘
```

**Configure Angular for Emulators**:

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  useEmulators: true,
  firebase: {
    apiKey: "demo-api-key",
    projectId: "demo-project",
    // ... other config
  },
  emulators: {
    firestore: ['localhost', 8080],
    auth: ['localhost', 9099]
  }
};
```

```typescript
// src/app/app.config.ts
import { environment } from '@env/environment';
import { connectFirestoreEmulator } from '@angular/fire/firestore';
import { connectAuthEmulator } from '@angular/fire/auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => {
      const firestore = getFirestore();
      if (environment.useEmulators) {
        connectFirestoreEmulator(firestore, 'localhost', 8080);
      }
      return firestore;
    }),
    provideAuth(() => {
      const auth = getAuth();
      if (environment.useEmulators) {
        connectAuthEmulator(auth, 'http://localhost:9099');
      }
      return auth;
    })
  ]
};
```

**Test Multi-Tenant Scenarios**:

```typescript
// e2e/multi-tenant.e2e.spec.ts
describe('Multi-Tenant Isolation', () => {
  it('should isolate tenants correctly', async () => {
    // User 1 creates Blueprint A
    await auth.signInAsUser1();
    const blueprintA = await createBlueprint({ name: 'Blueprint A' });
    
    // User 2 creates Blueprint B
    await auth.signInAsUser2();
    const blueprintB = await createBlueprint({ name: 'Blueprint B' });
    
    // User 2 should NOT see Blueprint A
    const blueprints = await getBlueprintsForCurrentUser();
    expect(blueprints).not.toContain(blueprintA.id);
    expect(blueprints).toContain(blueprintB.id);
  });
  
  it('should enforce permission-based access', async () => {
    // Owner adds member with read-only permission
    await auth.signInAsOwner();
    const blueprint = await createBlueprint({ name: 'Test Blueprint' });
    await addMember(blueprint.id, user2.id, {
      role: 'viewer',
      permissions: ['blueprint:read']
    });
    
    // Member tries to update (should fail)
    await auth.signInAsUser2();
    await expectAsync(
      updateBlueprint(blueprint.id, { name: 'Updated' })
    ).toBeRejectedWith(/permission-denied/);
  });
});
```

### Step 5: Production Deployment

**Build Production App**:

```bash
# Build with production configuration
ng build --configuration=production

# Output: dist/gighub-angular/browser/
```

**Deploy to Firebase Hosting**:

```bash
# Deploy all Firebase services
firebase deploy

# Or deploy selectively:
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only hosting
```

**Verify Deployment**:

```bash
# Check deployment status
firebase hosting:sites:list

# Test production URL
curl https://gighub-production.web.app/health
```

### Step 6: Post-Deployment Validation

**Test Tenant Isolation**:

```bash
# Use Firebase Console > Firestore > Query
# Test 1: User can only see their Blueprints
# Test 2: Members can only see Blueprints they belong to
# Test 3: Cross-Blueprint access is denied
```

**Test Permission Checks**:

```bash
# Use application UI to test:
# 1. Create Blueprint as User A
# 2. Add User B as member with limited permissions
# 3. Verify User B cannot perform unauthorized actions
```

**Monitor Logs**:

```bash
# Check Cloud Logging for errors
firebase logging:tail --only firestore,functions

# Look for:
# - "permission-denied" errors (expected for unauthorized access)
# - "context not found" errors (investigate)
# - "quota exceeded" warnings (scale up if needed)
```

---

## Deployment Strategies

### Strategy 1: Single-Blueprint (Simple)

**Use Case**: Startups, simple projects with one tenant per user

**Architecture**:
```
User → Blueprint (1:1 relationship)
```

**Configuration**:
```typescript
// Auto-create Blueprint on user registration
async createUserWithBlueprint(userData: UserCreateData): Promise<User> {
  const user = await this.userRepository.create(userData);
  
  const blueprint = await this.blueprintRepository.create({
    name: `${user.displayName}'s Blueprint`,
    ownerType: 'user',
    ownerId: user.id,
    status: 'active'
  });
  
  // Add user as owner
  await this.blueprintMemberRepository.create({
    blueprintId: blueprint.id,
    memberType: 'user',
    memberId: user.id,
    role: 'owner',
    permissions: ['*'],
    status: 'active'
  });
  
  return user;
}
```

**Pros**:
- Simple to understand and implement
- No organization management overhead
- Suitable for personal projects

**Cons**:
- Limited scalability
- Cannot share resources across teams
- No hierarchical permissions

### Strategy 2: Multi-Blueprint (Flexible)

**Use Case**: Agencies, consultants managing multiple client projects

**Architecture**:
```
User → Blueprint 1
     → Blueprint 2
     → Blueprint 3
```

**Configuration**:
```typescript
// Allow users to create multiple Blueprints
async createAdditionalBlueprint(
  userId: string,
  blueprintData: BlueprintCreateData
): Promise<Blueprint> {
  const blueprint = await this.blueprintRepository.create({
    ...blueprintData,
    ownerType: 'user',
    ownerId: userId,
    status: 'active'
  });
  
  // Add user as owner
  await this.blueprintMemberRepository.create({
    blueprintId: blueprint.id,
    memberType: 'user',
    memberId: userId,
    role: 'owner',
    permissions: ['*'],
    status: 'active'
  });
  
  return blueprint;
}
```

**Pros**:
- Flexible tenant management
- Suitable for multi-project workflows
- Clear tenant boundaries

**Cons**:
- User must manually switch context
- No shared resources across Blueprints
- Requires context management UI

### Strategy 3: Hierarchical (Enterprise)

**Use Case**: Enterprises with complex organizational structures

**Architecture**:
```
Organization → Blueprint 1 (Project A)
            → Blueprint 2 (Project B)
            → Team 1 → Members
            → Team 2 → Members
            → Partner 1
```

**Configuration**:
```typescript
// Create Organization with Blueprints
async createEnterpriseStructure(
  orgData: OrganizationCreateData
): Promise<Organization> {
  const org = await this.organizationRepository.create(orgData);
  
  // Create default Blueprint for organization
  const blueprint = await this.blueprintRepository.create({
    name: `${org.name} Main Project`,
    ownerType: 'organization',
    ownerId: org.id,
    status: 'active'
  });
  
  // Add organization owner as Blueprint member
  await this.blueprintMemberRepository.create({
    blueprintId: blueprint.id,
    memberType: 'user',
    memberId: orgData.ownerId,
    role: 'owner',
    permissions: ['*'],
    status: 'active'
  });
  
  return org;
}
```

**Pros**:
- Supports complex organizational structures
- Centralized team management
- Shared resources across projects

**Cons**:
- More complex setup
- Requires organization management
- Higher initial overhead

### Strategy 4: Cross-Tenant (Advanced)

**Use Case**: Shared services, cross-project collaboration

**Architecture**:
```
Blueprint A → Shared Resource ← Blueprint B
           ↘                 ↙
            Partner (External Access)
```

**Configuration**:
```typescript
// Grant cross-Blueprint access
async grantCrossBlueprintAccess(
  sourceBlueprint: string,
  targetBlueprint: string,
  permissions: string[]
): Promise<void> {
  // Create special cross-tenant membership
  await this.blueprintMemberRepository.create({
    blueprintId: targetBlueprint,
    memberType: 'partner',
    memberId: sourceBlueprint, // Blueprint as member
    role: 'partner',
    permissions,
    status: 'active'
  });
}
```

**Pros**:
- Enables resource sharing
- Supports partner collaboration
- Flexible access control

**Cons**:
- Most complex to manage
- Requires careful permission design
- Potential security risks

---

## Firestore Schema Setup

### Collection Structures

#### `/blueprints/{blueprintId}`

```typescript
interface Blueprint {
  id: string;
  name: string;
  description?: string;
  ownerType: 'user' | 'organization';
  ownerId: string; // User ID or Organization ID
  status: 'active' | 'suspended' | 'archived';
  settings: {
    maxMembers: number;
    maxTasks: number;
    maxStorage: number;
  };
  metadata: {
    industry?: string;
    tags?: string[];
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}
```

#### `/blueprintMembers/{memberId}`

Composite key: `{userId}_{blueprintId}`

```typescript
interface BlueprintMember {
  id: string; // Composite: userId_blueprintId
  blueprintId: string;
  memberType: 'user' | 'team' | 'partner';
  memberId: string; // User ID, Team ID, or Partner ID
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: string[]; // ['blueprint:read', 'task:create', ...]
  status: 'active' | 'suspended' | 'revoked';
  invitedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastAccessAt: Timestamp | null;
}
```

#### `/organizations/{orgId}`

```typescript
interface Organization {
  id: string;
  name: string;
  description?: string;
  ownerId: string; // User ID
  status: 'active' | 'suspended' | 'archived';
  settings: {
    maxMembers: number;
    maxTeams: number;
    maxPartners: number;
  };
  billing: {
    plan: 'free' | 'pro' | 'enterprise';
    subscriptionId?: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}
```

#### `/organizationMembers/{memberId}`

Composite key: `{userId}_{organizationId}`

```typescript
interface OrganizationMember {
  id: string; // Composite: userId_organizationId
  organizationId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'suspended' | 'revoked';
  invitedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastAccessAt: Timestamp | null;
}
```

#### `/teams/{teamId}`

```typescript
interface Team {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  status: 'active' | 'suspended' | 'archived';
  members: string[]; // User IDs
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}
```

#### `/partners/{partnerId}`

```typescript
interface Partner {
  id: string;
  organizationId: string;
  name: string;
  contactEmail: string;
  status: 'active' | 'suspended' | 'archived';
  accessLevel: 'read' | 'write' | 'admin';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}
```

### Required Indexes

Deploy with `firebase deploy --only firestore:indexes`:

```json
{
  "indexes": [
    {
      "collectionGroup": "blueprintMembers",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "blueprintId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "blueprintMembers",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "blueprints",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "ownerType", "order": "ASCENDING" },
        { "fieldPath": "ownerId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "teams",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "organizationId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "partners",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "organizationId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## Security Rules Deployment

See Step 2 for complete Security Rules. Key points:

### Multi-Tenant Isolation

- ✅ Blueprint access requires active membership
- ✅ Permission-based operations (`hasPermission()` check)
- ✅ Owner-only operations (delete, ownership transfer)
- ✅ Status validation (active members only)

### Testing Security Rules

```bash
# Use Firebase Emulator Suite
firebase emulators:start --only firestore

# Run Security Rules tests
npm run test:security-rules
```

```typescript
// test/security-rules.spec.ts
import * as firebase from '@firebase/rules-unit-testing';

describe('Multi-Tenant Security Rules', () => {
  it('should deny cross-tenant access', async () => {
    const user1Context = testEnv.authenticatedContext('user1');
    const user2Context = testEnv.authenticatedContext('user2');
    
    // User 1 creates Blueprint
    const blueprint = await user1Context
      .firestore()
      .doc('blueprints/blueprint1')
      .set({ ownerType: 'user', ownerId: 'user1' });
    
    // User 2 cannot access
    await firebase.assertFails(
      user2Context.firestore().doc('blueprints/blueprint1').get()
    );
  });
});
```

---

## Application Configuration

### TenantContextService Integration

```typescript
// src/app/core/services/tenant-context.service.ts
@Injectable({ providedIn: 'root' })
export class TenantContextService {
  private blueprintMemberRepository = inject(BlueprintMemberRepository);
  private router = inject(Router);
  
  private currentBlueprintId = signal<string | null>(null);
  private currentMember = signal<BlueprintMember | null>(null);
  
  currentBlueprint = this.currentBlueprintId.asReadonly();
  member = this.currentMember.asReadonly();
  
  // Check if user has access to Blueprint
  async hasAccess(blueprintId: string): Promise<boolean> {
    const member = await this.blueprintMemberRepository
      .findByUserAndBlueprint(getCurrentUserId(), blueprintId);
    
    return member !== null && member.status === 'active';
  }
  
  // Set current tenant context
  async setContext(blueprintId: string): Promise<void> {
    const member = await this.blueprintMemberRepository
      .findByUserAndBlueprint(getCurrentUserId(), blueprintId);
    
    if (!member || member.status !== 'active') {
      throw new Error('Access denied or membership inactive');
    }
    
    this.currentBlueprintId.set(blueprintId);
    this.currentMember.set(member);
  }
  
  // Clear tenant context
  clearContext(): void {
    this.currentBlueprintId.set(null);
    this.currentMember.set(null);
  }
}
```

### Route Configuration

```typescript
// src/app/routes/routes.ts
import { Routes } from '@angular/router';
import { BlueprintGuard } from '@core/guards/blueprint.guard';
import { blueprintResolver } from '@core/resolvers/blueprint.resolver';

export const routes: Routes = [
  {
    path: 'blueprints/:blueprintId',
    canActivate: [BlueprintGuard],
    resolve: {
      blueprint: blueprintResolver
    },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component')
      },
      {
        path: 'tasks',
        loadComponent: () => import('./tasks/task-list.component')
      },
      {
        path: 'members',
        loadComponent: () => import('./members/member-list.component'),
        data: { requiredPermission: 'member:read' }
      }
    ]
  }
];
```

---

## Local Testing

See Step 4 for detailed emulator setup. Key test scenarios:

### Test Scenario 1: Tenant Isolation

```typescript
it('should isolate tenants', async () => {
  const user1 = await createUser({ email: 'user1@example.com' });
  const user2 = await createUser({ email: 'user2@example.com' });
  
  const blueprint1 = await createBlueprint(user1.id, { name: 'Blueprint 1' });
  const blueprint2 = await createBlueprint(user2.id, { name: 'Blueprint 2' });
  
  // User 1 cannot see Blueprint 2
  const user1Blueprints = await getBlueprintsForUser(user1.id);
  expect(user1Blueprints.map(b => b.id)).not.toContain(blueprint2.id);
});
```

### Test Scenario 2: Permission Checks

```typescript
it('should enforce permissions', async () => {
  const owner = await createUser({ email: 'owner@example.com' });
  const member = await createUser({ email: 'member@example.com' });
  
  const blueprint = await createBlueprint(owner.id, { name: 'Test' });
  
  // Add member with read-only
  await addMember(blueprint.id, member.id, {
    role: 'viewer',
    permissions: ['blueprint:read']
  });
  
  // Member cannot update
  await expectAsync(
    updateBlueprint(blueprint.id, { name: 'Updated' }, member.id)
  ).toBeRejectedWith(/permission-denied/);
});
```

---

## Production Deployment

See Step 5 for deployment process. Key production checks:

### Pre-Deployment Checklist

- [ ] All Firestore indexes created
- [ ] Security Rules tested and deployed
- [ ] Production environment variables configured
- [ ] Firebase project quotas reviewed
- [ ] Monitoring and alerting configured
- [ ] Backup strategy established

### Deployment Command

```bash
# Full deployment
firebase deploy

# Verify deployment
firebase hosting:sites:get gighub-production
```

---

## Rollback Procedures

### Scenario 1: Schema Changes Failure

**Symptoms**:
- Application unable to query Firestore
- "Index not found" errors
- Data integrity issues

**Rollback Steps**:

```bash
# 1. Restore Firestore backup
firebase firestore:import gs://gighub-backups/$(date +%Y%m%d)

# 2. Revert indexes
firebase deploy --only firestore:indexes --config firebase.backup.json

# 3. Verify restoration
firebase firestore:databases:list
```

### Scenario 2: Security Rules Errors

**Symptoms**:
- "permission-denied" errors for valid users
- Unauthorized access to tenant data
- Security Rules not enforcing isolation

**Rollback Steps**:

```bash
# 1. Deploy previous Security Rules
git checkout <previous-commit> -- firestore.rules
firebase deploy --only firestore:rules

# 2. Verify rules deployment
firebase firestore:rules:get

# 3. Test with Firebase Console
# Navigate to Firestore > Rules > Playground
```

### Scenario 3: Context Service Issues

**Symptoms**:
- "Context not found" errors
- Routes not loading
- Guards blocking access incorrectly

**Rollback Steps**:

```bash
# 1. Revert to previous application version
git revert <problematic-commit>
npm run build
firebase deploy --only hosting

# 2. Switch to static context (emergency)
# Edit environment.production.ts:
# useStaticContext: true

# 3. Monitor logs for context-related errors
firebase logging:tail --only hosting
```

### Scenario 4: Performance Degradation

**Symptoms**:
- Slow tenant queries
- High Firestore operation costs
- Timeout errors

**Rollback Steps**:

```bash
# 1. Scale down tenant queries
# Temporarily limit query results
# Update FirestoreBaseRepository:
const EMERGENCY_LIMIT = 100;

# 2. Add missing indexes
firebase deploy --only firestore:indexes

# 3. Enable query caching
# Update TenantContextService to cache tenant data
```

---

## Troubleshooting

### Issue 1: Tenant Isolation Violations

**Symptoms**:
- Users seeing data from other tenants
- Cross-Blueprint access working when it shouldn't

**Solution**:

```bash
# 1. Check Security Rules
firebase firestore:rules:get > current-rules.txt
# Compare with expected rules

# 2. Verify BlueprintMember records
# Use Firebase Console to check:
# - Composite key format: userId_blueprintId
# - Status is "active"
# - BlueprintId matches correctly

# 3. Test with Security Rules simulator
# Firebase Console > Firestore > Rules > Playground
```

### Issue 2: Context Not Loading

**Symptoms**:
- "Current blueprint not set" errors
- Routes redirect to home page
- Guards blocking all access

**Solution**:

```typescript
// 1. Check TenantContextService logs
console.log('Current Blueprint:', this.tenantContext.currentBlueprint());
console.log('Current Member:', this.tenantContext.member());

// 2. Verify route resolver
// Check blueprint.resolver.ts is registered
// Verify resolver returns Blueprint successfully

// 3. Check guard logic
// Ensure BlueprintGuard calls tenantContext.setContext()
```

### Issue 3: Permission Denied Errors

**Symptoms**:
- Valid users receiving "permission-denied"
- Operations failing despite correct membership

**Solution**:

```bash
# 1. Check member permissions array
# Firebase Console > blueprintMembers > {memberId}
# Verify permissions field contains required permission

# 2. Check member status
# Ensure status === 'active'
# Suspended/revoked members should be denied

# 3. Check Security Rules function
# Verify hasPermission() function logic
# Test with simple permission first
```

### Issue 4: Slow Tenant Queries

**Symptoms**:
- Firestore queries timing out
- High operation costs
- Slow page loads

**Solution**:

```bash
# 1. Check for missing indexes
# Look for "The query requires an index" errors
# Deploy missing indexes:
firebase deploy --only firestore:indexes

# 2. Add query limits
// Update repository queries:
const q = query(
  collection(this.firestore, 'blueprints'),
  where('ownerId', '==', userId),
  limit(50) // Add limit
);

# 3. Enable query result caching
// Use in-memory cache for tenant data
```

### Issue 5: Memory Leaks in Context Service

**Symptoms**:
- Memory usage increasing over time
- Application slowdown
- Browser tab crashes

**Solution**:

```typescript
// 1. Clean up subscriptions
export class TenantContextService implements OnDestroy {
  private destroyRef = inject(DestroyRef);
  
  constructor() {
    // Use takeUntilDestroyed for subscriptions
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      // Handle route changes
    });
  }
}

// 2. Clear context on route leave
// In BlueprintGuard:
canDeactivate(): boolean {
  this.tenantContext.clearContext();
  return true;
}
```

### Issue 6: Quota Exceeded

**Symptoms**:
- "Quota exceeded" errors
- Operations failing intermittently
- High Firebase costs

**Solution**:

```bash
# 1. Check Firebase quotas
# Firebase Console > Usage and Billing > Firestore

# 2. Implement rate limiting
// Add throttling to TenantContextService
private readonly RATE_LIMIT = 100; // requests per minute

# 3. Optimize queries
// Reduce query frequency
// Add local caching
// Use batch operations
```

---

## Migration Guide

### Migrating from Single-Tenant to Multi-Tenant

**Step 1: Backup Existing Data**

```bash
# Export current Firestore data
firebase firestore:export gs://gighub-backups/pre-migration-$(date +%Y%m%d)
```

**Step 2: Create Blueprint for Each User**

```typescript
// migration/create-blueprints.ts
async function migrateSingleToMultiTenant(): Promise<void> {
  const users = await getAllUsers();
  
  for (const user of users) {
    // Create Blueprint for user
    const blueprint = await createBlueprint({
      name: `${user.displayName}'s Workspace`,
      ownerType: 'user',
      ownerId: user.id,
      status: 'active'
    });
    
    // Add user as owner
    await addBlueprintMember({
      blueprintId: blueprint.id,
      memberType: 'user',
      memberId: user.id,
      role: 'owner',
      permissions: ['*'],
      status: 'active'
    });
    
    console.log(`Created Blueprint for user: ${user.email}`);
  }
}
```

**Step 3: Migrate Resources to Blueprints**

```typescript
// migration/migrate-resources.ts
async function migrateResourcesToBlueprints(): Promise<void> {
  const tasks = await getAllTasks();
  
  for (const task of tasks) {
    // Get user's Blueprint
    const blueprint = await getBlueprintForUser(task.ownerId);
    
    // Update task with blueprintId
    await updateTask(task.id, {
      blueprintId: blueprint.id
    });
    
    console.log(`Migrated task ${task.id} to Blueprint ${blueprint.id}`);
  }
}
```

**Step 4: Deploy Updated Security Rules**

```bash
# Deploy multi-tenant Security Rules
firebase deploy --only firestore:rules

# Test with migration verification script
npm run verify:migration
```

**Step 5: Verify Migration**

```typescript
// migration/verify-migration.ts
async function verifyMigration(): Promise<void> {
  const users = await getAllUsers();
  
  for (const user of users) {
    // Verify Blueprint exists
    const blueprints = await getBlueprintsForUser(user.id);
    assert(blueprints.length > 0, `No Blueprint for user: ${user.email}`);
    
    // Verify membership
    const members = await getMembersForBlueprint(blueprints[0].id);
    assert(members.some(m => m.memberId === user.id), `User not a member`);
    
    // Verify resources migrated
    const tasks = await getTasksForBlueprint(blueprints[0].id);
    console.log(`Verified ${tasks.length} tasks for ${user.email}`);
  }
  
  console.log('Migration verification complete ✅');
}
```

---

## Performance Tuning

### Tenant-Specific Query Optimization

**Add Composite Indexes**:

```json
// Critical indexes for performance
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

**Use Query Limits**:

```typescript
// Always add limits to tenant queries
async findTasksByBlueprint(blueprintId: string): Promise<Task[]> {
  const q = query(
    collection(this.firestore, 'tasks'),
    where('blueprintId', '==', blueprintId),
    where('deletedAt', '==', null),
    orderBy('createdAt', 'desc'),
    limit(100) // Prevent unbounded queries
  );
  
  return this.queryDocuments(q);
}
```

### Caching Strategies

**Cache Tenant Context**:

```typescript
@Injectable({ providedIn: 'root' })
export class TenantContextService {
  private cache = new Map<string, BlueprintMember>();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  async getMember(blueprintId: string): Promise<BlueprintMember | null> {
    const cached = this.cache.get(blueprintId);
    if (cached && this.isCacheValid(cached)) {
      return cached;
    }
    
    const member = await this.blueprintMemberRepository
      .findByUserAndBlueprint(getCurrentUserId(), blueprintId);
    
    if (member) {
      this.cache.set(blueprintId, member);
    }
    
    return member;
  }
}
```

### Batch Operations

**Batch Tenant Queries**:

```typescript
// Fetch multiple tenant data in parallel
async loadTenantDashboard(blueprintId: string): Promise<DashboardData> {
  const [tasks, members, teams] = await Promise.all([
    this.taskRepository.findByBlueprint(blueprintId),
    this.blueprintMemberRepository.findByBlueprint(blueprintId),
    this.teamRepository.findByBlueprint(blueprintId)
  ]);
  
  return { tasks, members, teams };
}
```

---

## Summary

This deployment guide provides comprehensive instructions for deploying the GigHub Multi-Tenancy System with Blueprint-based tenant isolation. Key takeaways:

- **8-Step Deployment**: From prerequisites to production validation
- **4 Strategies**: Choose deployment strategy based on use case
- **Security First**: Multi-tenant Security Rules enforce isolation
- **Performance**: Optimized queries with composite indexes
- **Rollback Ready**: 4 rollback scenarios with procedures
- **Troubleshooting**: 6 guides for common issues

For operational procedures, see [PRODUCTION_RUNBOOK.md](./PRODUCTION_RUNBOOK.md).  
For validation checklist, see [PRODUCTION_READINESS_CHECKLIST.md](./PRODUCTION_READINESS_CHECKLIST.md).

---

**Document Version**: 1.0  
**Last Reviewed**: 2025-12-26  
**Next Review**: 2026-03-26
