# Multi-Tenancy System - API Reference

**Version**: 1.0  
**Last Updated**: 2025-12-26  
**Status**: Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Core Models](#core-models)
3. [Repositories](#repositories)
4. [Services](#services)
5. [Guards & Interceptors](#guards--interceptors)
6. [Context Management](#context-management)
7. [Security Rules](#security-rules)
8. [Advanced Patterns](#advanced-patterns)
9. [Testing Utilities](#testing-utilities)

---

## 1. Overview

The Multi-Tenancy System provides Blueprint-based isolation for all resources in the ng-lin platform. It ensures data isolation, permission management, and access control across different tenants (users, organizations, teams, partners).

### Key Concepts

**Blueprint**: The primary multi-tenancy boundary
- Defines who can access what resources
- Owner can be User or Organization
- Resources belong to Blueprints
- Members have roles and permissions

**Multi-Tenant Isolation**: 
- All Firestore queries filtered by `blueprintId`
- Security Rules enforce Blueprint membership
- Cross-Blueprint access explicitly authorized
- Tenant context automatically injected

**Hierarchy**:
```
User / Organization
    ↓
  Blueprint
    ↓
  Resources (Tasks, Documents, etc.)
```

---

## 2. Core Models

### 2.1 Blueprint

Primary multi-tenancy entity.

```typescript
interface Blueprint {
  id: string;
  name: string;
  description?: string;
  
  // Ownership
  ownerType: 'user' | 'organization';
  ownerId: string; // User ID or Organization ID
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  
  // Settings
  settings: BlueprintSettings;
  
  // Status
  status: 'active' | 'suspended' | 'archived';
}

interface BlueprintSettings {
  visibility: 'private' | 'internal' | 'public';
  allowGuestAccess: boolean;
  defaultMemberRole: string;
  features: string[];
}
```

**Firestore Path**: `/blueprints/{blueprintId}`

**Example**:
```typescript
const blueprint: Blueprint = {
  id: 'blueprint-123',
  name: 'Construction Project Alpha',
  description: 'Main construction site management',
  ownerType: 'organization',
  ownerId: 'org-456',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-12-26'),
  deletedAt: null,
  settings: {
    visibility: 'private',
    allowGuestAccess: false,
    defaultMemberRole: 'viewer',
    features: ['tasks', 'documents', 'audit']
  },
  status: 'active'
};
```

---

### 2.2 BlueprintMember

Represents membership and access control.

```typescript
interface BlueprintMember {
  id: string; // Composite: {userId}_{blueprintId}
  blueprintId: string;
  
  // Member Identity
  memberType: 'user' | 'team' | 'partner';
  memberId: string;
  
  // Access Control
  role: string; // 'owner', 'admin', 'member', 'viewer'
  permissions: string[]; // Specific permissions
  
  // Status
  status: 'active' | 'suspended' | 'revoked';
  
  // Metadata
  joinedAt: Date;
  invitedBy?: string;
  lastAccessAt: Date;
  
  // Constraints
  expiresAt?: Date;
  resourceLimits?: ResourceLimits;
}

interface ResourceLimits {
  maxTasks?: number;
  maxStorage?: number; // bytes
  maxMembers?: number;
}
```

**Firestore Path**: `/blueprintMembers/{memberId}`

**ID Format**: `{userId}_{blueprintId}` or `{teamId}_{blueprintId}` or `{partnerId}_{blueprintId}`

**Example**:
```typescript
const member: BlueprintMember = {
  id: 'user-789_blueprint-123',
  blueprintId: 'blueprint-123',
  memberType: 'user',
  memberId: 'user-789',
  role: 'admin',
  permissions: [
    'task:create', 'task:update', 'task:delete',
    'document:create', 'document:update',
    'member:invite', 'member:view'
  ],
  status: 'active',
  joinedAt: new Date('2025-01-15'),
  invitedBy: 'user-456',
  lastAccessAt: new Date('2025-12-26'),
  resourceLimits: {
    maxTasks: 1000,
    maxStorage: 10737418240 // 10GB
  }
};
```

---

### 2.3 Organization

Multi-user tenant entity.

```typescript
interface Organization {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  
  // Ownership
  ownerId: string; // User ID
  
  // Settings
  settings: OrganizationSettings;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  
  // Status
  status: 'active' | 'suspended' | 'archived';
  
  // Billing (optional)
  billingPlan?: string;
  billingEmail?: string;
}

interface OrganizationSettings {
  allowPublicBlueprints: boolean;
  requireMFA: boolean;
  allowedDomains?: string[];
  ssoEnabled: boolean;
}
```

**Firestore Path**: `/organizations/{organizationId}`

**Example**:
```typescript
const organization: Organization = {
  id: 'org-456',
  name: 'Acme Construction',
  displayName: 'Acme Construction Co.',
  description: 'Leading construction company',
  ownerId: 'user-123',
  settings: {
    allowPublicBlueprints: false,
    requireMFA: true,
    allowedDomains: ['acme.com', 'acme-construction.com'],
    ssoEnabled: true
  },
  createdAt: new Date('2024-06-01'),
  updatedAt: new Date('2025-12-26'),
  deletedAt: null,
  status: 'active',
  billingPlan: 'enterprise',
  billingEmail: 'billing@acme.com'
};
```

---

### 2.4 Team

Sub-organization grouping.

```typescript
interface Team {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  
  // Leadership
  leaderId: string; // User ID
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  
  // Status
  status: 'active' | 'inactive';
}
```

**Firestore Path**: `/teams/{teamId}`

**Constraint**: Teams can only exist within Organizations.

**Example**:
```typescript
const team: Team = {
  id: 'team-789',
  organizationId: 'org-456',
  name: 'Site Alpha Team',
  description: 'On-site construction team for Project Alpha',
  leaderId: 'user-789',
  createdAt: new Date('2025-01-10'),
  updatedAt: new Date('2025-12-26'),
  deletedAt: null,
  status: 'active'
};
```

---

### 2.5 Partner

External organization relationship.

```typescript
interface Partner {
  id: string;
  organizationId: string;
  name: string;
  companyName: string;
  description?: string;
  
  // Contact
  contactEmail: string;
  contactPhone?: string;
  
  // Relationship
  partnerType: 'contractor' | 'supplier' | 'consultant' | 'other';
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  
  // Status
  status: 'active' | 'suspended' | 'terminated';
}
```

**Firestore Path**: `/partners/{partnerId}`

**Constraint**: Partners can only exist within Organizations.

**Example**:
```typescript
const partner: Partner = {
  id: 'partner-101',
  organizationId: 'org-456',
  name: 'John Smith',
  companyName: 'Smith Electrical Services',
  description: 'Electrical contractor',
  contactEmail: 'john@smith-electrical.com',
  contactPhone: '+1-555-0123',
  partnerType: 'contractor',
  createdAt: new Date('2025-02-01'),
  updatedAt: new Date('2025-12-26'),
  deletedAt: null,
  status: 'active'
};
```

---

## 3. Repositories

All repositories extend `FirestoreBaseRepository<T>` with multi-tenant query filtering.

### 3.1 BlueprintRepository

Manages Blueprint CRUD operations.

```typescript
@Injectable({ providedIn: 'root' })
export class BlueprintRepository extends FirestoreBaseRepository<Blueprint> {
  protected collectionName = 'blueprints';
  
  /**
   * Find all Blueprints for a User
   */
  async findByOwner(
    ownerType: 'user' | 'organization',
    ownerId: string
  ): Promise<Blueprint[]> {
    return this.executeWithRetry(async () => {
      const q = query(
        this.collectionRef,
        where('ownerType', '==', ownerType),
        where('ownerId', '==', ownerId),
        where('deletedAt', '==', null),
        orderBy('createdAt', 'desc')
      );
      return this.queryDocuments(q);
    });
  }
  
  /**
   * Find Blueprints where User is a member
   */
  async findByMember(userId: string): Promise<Blueprint[]> {
    return this.executeWithRetry(async () => {
      // Query BlueprintMember collection first
      const memberQuery = query(
        collection(this.firestore, 'blueprintMembers'),
        where('memberId', '==', userId),
        where('status', '==', 'active')
      );
      
      const memberSnapshot = await getDocs(memberQuery);
      const blueprintIds = memberSnapshot.docs.map(
        doc => doc.data()['blueprintId'] as string
      );
      
      if (blueprintIds.length === 0) return [];
      
      // Query Blueprints
      const blueprintsQuery = query(
        this.collectionRef,
        where(documentId(), 'in', blueprintIds),
        where('deletedAt', '==', null)
      );
      
      return this.queryDocuments(blueprintsQuery);
    });
  }
  
  /**
   * Archive Blueprint (soft delete)
   */
  async archive(id: string): Promise<void> {
    return this.executeWithRetry(async () => {
      await this.updateDocument(id, {
        status: 'archived',
        deletedAt: new Date()
      } as Partial<Blueprint>);
    });
  }
}
```

---

### 3.2 BlueprintMemberRepository

Manages Blueprint membership.

```typescript
@Injectable({ providedIn: 'root' })
export class BlueprintMemberRepository extends FirestoreBaseRepository<BlueprintMember> {
  protected collectionName = 'blueprintMembers';
  
  /**
   * Find all members of a Blueprint
   */
  async findByBlueprint(blueprintId: string): Promise<BlueprintMember[]> {
    return this.executeWithRetry(async () => {
      const q = query(
        this.collectionRef,
        where('blueprintId', '==', blueprintId),
        where('status', 'in', ['active', 'suspended']),
        orderBy('joinedAt', 'asc')
      );
      return this.queryDocuments(q);
    });
  }
  
  /**
   * Check if user is a member of Blueprint
   */
  async isMember(
    userId: string,
    blueprintId: string
  ): Promise<boolean> {
    return this.executeWithRetry(async () => {
      const memberId = `${userId}_${blueprintId}`;
      const member = await this.getDocument(memberId);
      return member !== null && member.status === 'active';
    });
  }
  
  /**
   * Get user's role in Blueprint
   */
  async getMemberRole(
    userId: string,
    blueprintId: string
  ): Promise<string | null> {
    return this.executeWithRetry(async () => {
      const memberId = `${userId}_${blueprintId}`;
      const member = await this.getDocument(memberId);
      return member?.status === 'active' ? member.role : null;
    });
  }
  
  /**
   * Check if user has specific permission
   */
  async hasPermission(
    userId: string,
    blueprintId: string,
    permission: string
  ): Promise<boolean> {
    return this.executeWithRetry(async () => {
      const memberId = `${userId}_${blueprintId}`;
      const member = await this.getDocument(memberId);
      
      if (!member || member.status !== 'active') return false;
      
      return member.permissions.includes(permission);
    });
  }
  
  /**
   * Revoke membership
   */
  async revokeMembership(
    userId: string,
    blueprintId: string
  ): Promise<void> {
    return this.executeWithRetry(async () => {
      const memberId = `${userId}_${blueprintId}`;
      await this.updateDocument(memberId, {
        status: 'revoked'
      } as Partial<BlueprintMember>);
    });
  }
}
```

---

### 3.3 OrganizationRepository

Manages Organization CRUD operations.

```typescript
@Injectable({ providedIn: 'root' })
export class OrganizationRepository extends FirestoreBaseRepository<Organization> {
  protected collectionName = 'organizations';
  
  /**
   * Find Organizations owned by User
   */
  async findByOwner(ownerId: string): Promise<Organization[]> {
    return this.executeWithRetry(async () => {
      const q = query(
        this.collectionRef,
        where('ownerId', '==', ownerId),
        where('deletedAt', '==', null),
        orderBy('createdAt', 'desc')
      );
      return this.queryDocuments(q);
    });
  }
  
  /**
   * Find Organizations where User is a member
   */
  async findByMember(userId: string): Promise<Organization[]> {
    return this.executeWithRetry(async () => {
      // Query OrganizationMember collection
      const memberQuery = query(
        collection(this.firestore, 'organizationMembers'),
        where('userId', '==', userId),
        where('status', '==', 'active')
      );
      
      const memberSnapshot = await getDocs(memberQuery);
      const orgIds = memberSnapshot.docs.map(
        doc => doc.data()['organizationId'] as string
      );
      
      if (orgIds.length === 0) return [];
      
      const orgsQuery = query(
        this.collectionRef,
        where(documentId(), 'in', orgIds),
        where('deletedAt', '==', null)
      );
      
      return this.queryDocuments(orgsQuery);
    });
  }
}
```

---

## 4. Services

### 4.1 TenantContextService

Manages current tenant context.

```typescript
@Injectable({ providedIn: 'root' })
export class TenantContextService {
  private currentBlueprintId = signal<string | null>(null);
  private currentUserId = signal<string | null>(null);
  
  // Public readonly signals
  blueprintId = this.currentBlueprintId.asReadonly();
  userId = this.currentUserId.asReadonly();
  
  /**
   * Set current Blueprint context
   */
  setBlueprint(blueprintId: string): void {
    this.currentBlueprintId.set(blueprintId);
  }
  
  /**
   * Set current User context
   */
  setUser(userId: string): void {
    this.currentUserId.set(userId);
  }
  
  /**
   * Clear tenant context
   */
  clear(): void {
    this.currentBlueprintId.set(null);
    this.currentUserId.set(null);
  }
  
  /**
   * Get current Blueprint ID (throws if not set)
   */
  requireBlueprintId(): string {
    const id = this.currentBlueprintId();
    if (!id) {
      throw new Error('Blueprint context not set');
    }
    return id;
  }
  
  /**
   * Get current User ID (throws if not set)
   */
  requireUserId(): string {
    const id = this.currentUserId();
    if (!id) {
      throw new Error('User context not set');
    }
    return id;
  }
}
```

**Usage**:
```typescript
@Component({...})
export class TaskListComponent {
  private tenantContext = inject(TenantContextService);
  
  ngOnInit(): void {
    const blueprintId = this.tenantContext.requireBlueprintId();
    this.loadTasks(blueprintId);
  }
}
```

---

### 4.2 BlueprintService

Business logic for Blueprint management.

```typescript
@Injectable({ providedIn: 'root' })
export class BlueprintService {
  private blueprintRepo = inject(BlueprintRepository);
  private memberRepo = inject(BlueprintMemberRepository);
  private eventBus = inject(BlueprintEventBus);
  
  /**
   * Create new Blueprint
   */
  async createBlueprint(
    data: Omit<Blueprint, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
  ): Promise<Blueprint> {
    // Validate
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Blueprint name is required');
    }
    
    // Create Blueprint
    const blueprint = await this.blueprintRepo.create({
      ...data,
      status: 'active'
    });
    
    // Add owner as admin member
    const ownerId = data.ownerType === 'user' 
      ? data.ownerId 
      : await this.getOrganizationOwner(data.ownerId);
    
    await this.memberRepo.create({
      id: `${ownerId}_${blueprint.id}`,
      blueprintId: blueprint.id,
      memberType: 'user',
      memberId: ownerId,
      role: 'owner',
      permissions: ['*'], // All permissions
      status: 'active',
      joinedAt: new Date(),
      lastAccessAt: new Date()
    });
    
    // Publish event
    this.eventBus.publish({
      type: 'blueprint.created',
      blueprintId: blueprint.id,
      timestamp: new Date(),
      actor: ownerId,
      data: blueprint
    });
    
    return blueprint;
  }
  
  /**
   * Invite member to Blueprint
   */
  async inviteMember(
    blueprintId: string,
    memberId: string,
    memberType: 'user' | 'team' | 'partner',
    role: string,
    permissions: string[],
    invitedBy: string
  ): Promise<BlueprintMember> {
    // Validate inviter has permission
    const canInvite = await this.memberRepo.hasPermission(
      invitedBy,
      blueprintId,
      'member:invite'
    );
    
    if (!canInvite) {
      throw new Error('You do not have permission to invite members');
    }
    
    // Create member
    const member = await this.memberRepo.create({
      id: `${memberId}_${blueprintId}`,
      blueprintId,
      memberType,
      memberId,
      role,
      permissions,
      status: 'active',
      joinedAt: new Date(),
      invitedBy,
      lastAccessAt: new Date()
    });
    
    // Publish event
    this.eventBus.publish({
      type: 'blueprint.member.invited',
      blueprintId,
      timestamp: new Date(),
      actor: invitedBy,
      data: member
    });
    
    return member;
  }
  
  /**
   * Remove member from Blueprint
   */
  async removeMember(
    blueprintId: string,
    memberId: string,
    removedBy: string
  ): Promise<void> {
    // Validate remover has permission
    const canRemove = await this.memberRepo.hasPermission(
      removedBy,
      blueprintId,
      'member:remove'
    );
    
    if (!canRemove) {
      throw new Error('You do not have permission to remove members');
    }
    
    // Cannot remove owner
    const member = await this.memberRepo.getDocument(
      `${memberId}_${blueprintId}`
    );
    
    if (member?.role === 'owner') {
      throw new Error('Cannot remove Blueprint owner');
    }
    
    // Revoke membership
    await this.memberRepo.revokeMembership(memberId, blueprintId);
    
    // Publish event
    this.eventBus.publish({
      type: 'blueprint.member.removed',
      blueprintId,
      timestamp: new Date(),
      actor: removedBy,
      data: { memberId }
    });
  }
  
  private async getOrganizationOwner(orgId: string): Promise<string> {
    const orgRepo = inject(OrganizationRepository);
    const org = await orgRepo.findById(orgId);
    if (!org) throw new Error('Organization not found');
    return org.ownerId;
  }
}
```

---

## 5. Guards & Interceptors

### 5.1 BlueprintGuard

Route guard to ensure user has access to Blueprint.

```typescript
@Injectable({ providedIn: 'root' })
export class BlueprintGuard implements CanActivate {
  private memberRepo = inject(BlueprintMemberRepository);
  private router = inject(Router);
  private auth = inject(AuthService);
  
  async canActivate(
    route: ActivatedRouteSnapshot
  ): Promise<boolean> {
    const blueprintId = route.params['blueprintId'];
    const user = await this.auth.getCurrentUser();
    
    if (!user) {
      this.router.navigate(['/login']);
      return false;
    }
    
    const isMember = await this.memberRepo.isMember(
      user.uid,
      blueprintId
    );
    
    if (!isMember) {
      this.router.navigate(['/forbidden']);
      return false;
    }
    
    return true;
  }
}
```

**Usage**:
```typescript
export const routes: Routes = [
  {
    path: 'blueprint/:blueprintId',
    canActivate: [BlueprintGuard],
    component: BlueprintDetailComponent
  }
];
```

---

### 5.2 TenantContextInterceptor

HTTP interceptor to inject Blueprint context.

```typescript
@Injectable()
export class TenantContextInterceptor implements HttpInterceptor {
  private tenantContext = inject(TenantContextService);
  
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const blueprintId = this.tenantContext.blueprintId();
    
    if (blueprintId) {
      const cloned = req.clone({
        setHeaders: {
          'X-Blueprint-Id': blueprintId
        }
      });
      return next.handle(cloned);
    }
    
    return next.handle(req);
  }
}
```

**Registration**:
```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([TenantContextInterceptor])
    )
  ]
};
```

---

## 6. Context Management

### 6.1 Automatic Context Injection

Use route resolvers to inject tenant context.

```typescript
@Injectable({ providedIn: 'root' })
export class BlueprintContextResolver implements Resolve<void> {
  private tenantContext = inject(TenantContextService);
  
  async resolve(route: ActivatedRouteSnapshot): Promise<void> {
    const blueprintId = route.params['blueprintId'];
    if (blueprintId) {
      this.tenantContext.setBlueprint(blueprintId);
    }
  }
}
```

**Usage**:
```typescript
export const routes: Routes = [
  {
    path: 'blueprint/:blueprintId',
    resolve: { context: BlueprintContextResolver },
    children: [
      { path: 'tasks', component: TaskListComponent },
      { path: 'documents', component: DocumentListComponent }
    ]
  }
];
```

---

## 7. Security Rules

### 7.1 Blueprint Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper: Check if user is Blueprint member
    function isBlueprintMember(blueprintId) {
      let memberId = request.auth.uid + '_' + blueprintId;
      let member = get(/databases/$(database)/documents/blueprintMembers/$(memberId));
      return member.data.status == 'active';
    }
    
    // Helper: Check if user has permission
    function hasPermission(blueprintId, permission) {
      let memberId = request.auth.uid + '_' + blueprintId;
      let member = get(/databases/$(database)/documents/blueprintMembers/$(memberId));
      return member.data.status == 'active' && 
             (permission in member.data.permissions || '*' in member.data.permissions);
    }
    
    // Blueprints Collection
    match /blueprints/{blueprintId} {
      // Read: Members only
      allow read: if request.auth != null && isBlueprintMember(blueprintId);
      
      // Create: Any authenticated user
      allow create: if request.auth != null;
      
      // Update: Owners/Admins only
      allow update: if request.auth != null && 
                       hasPermission(blueprintId, 'blueprint:update');
      
      // Delete: Owners only (soft delete)
      allow delete: if request.auth != null && 
                       hasPermission(blueprintId, 'blueprint:delete');
    }
    
    // Blueprint Members Collection
    match /blueprintMembers/{memberId} {
      // Read: Blueprint members can view member list
      allow read: if request.auth != null && 
                     isBlueprintMember(resource.data.blueprintId);
      
      // Create/Update: Require member:invite permission
      allow create, update: if request.auth != null && 
                               hasPermission(resource.data.blueprintId, 'member:invite');
      
      // Delete: Require member:remove permission
      allow delete: if request.auth != null && 
                       hasPermission(resource.data.blueprintId, 'member:remove');
    }
    
    // Organizations Collection
    match /organizations/{orgId} {
      // Read: Organization members
      allow read: if request.auth != null && 
                     exists(/databases/$(database)/documents/organizationMembers/$(request.auth.uid + '_' + orgId));
      
      // Create: Any authenticated user
      allow create: if request.auth != null;
      
      // Update/Delete: Owner only
      allow update, delete: if request.auth != null && 
                               resource.data.ownerId == request.auth.uid;
    }
    
    // Teams Collection
    match /teams/{teamId} {
      // Read: Organization members
      allow read: if request.auth != null && 
                     exists(/databases/$(database)/documents/organizationMembers/$(request.auth.uid + '_' + resource.data.organizationId));
      
      // Create/Update/Delete: Organization admins
      allow create, update, delete: if request.auth != null; // Add org admin check
    }
    
    // Partners Collection
    match /partners/{partnerId} {
      // Read: Organization members
      allow read: if request.auth != null && 
                     exists(/databases/$(database)/documents/organizationMembers/$(request.auth.uid + '_' + resource.data.organizationId));
      
      // Create/Update/Delete: Organization admins
      allow create, update, delete: if request.auth != null; // Add org admin check
    }
  }
}
```

---

## 8. Advanced Patterns

### 8.1 Cross-Blueprint Access

When resources need to be shared across Blueprints.

```typescript
interface SharedResource {
  id: string;
  blueprintId: string; // Primary owner
  sharedWith: string[]; // Additional Blueprint IDs
  sharePermissions: Record<string, string[]>; // blueprintId -> permissions
}
```

**Security Rule**:
```javascript
match /sharedResources/{resourceId} {
  allow read: if request.auth != null && (
    isBlueprintMember(resource.data.blueprintId) ||
    resource.data.blueprintId in resource.data.sharedWith
  );
}
```

---

### 8.2 Hierarchical Permissions

Organizations can define permission templates.

```typescript
interface PermissionTemplate {
  id: string;
  organizationId: string;
  name: string; // 'admin', 'member', 'viewer'
  permissions: string[];
}

// Apply template to member
async applyPermissionTemplate(
  memberId: string,
  templateId: string
): Promise<void> {
  const template = await this.getTemplate(templateId);
  await this.memberRepo.update(memberId, {
    permissions: template.permissions
  });
}
```

---

### 8.3 Resource Quotas

Enforce Blueprint-level resource limits.

```typescript
interface ResourceQuota {
  blueprintId: string;
  maxTasks: number;
  maxStorage: number; // bytes
  maxMembers: number;
  
  // Current usage
  currentTasks: number;
  currentStorage: number;
  currentMembers: number;
}

async checkQuota(
  blueprintId: string,
  resourceType: 'tasks' | 'storage' | 'members'
): Promise<boolean> {
  const quota = await this.getQuota(blueprintId);
  
  switch (resourceType) {
    case 'tasks':
      return quota.currentTasks < quota.maxTasks;
    case 'storage':
      return quota.currentStorage < quota.maxStorage;
    case 'members':
      return quota.currentMembers < quota.maxMembers;
  }
}
```

---

## 9. Testing Utilities

### 9.1 Mock TenantContextService

```typescript
export class MockTenantContextService {
  private _blueprintId = signal<string | null>('test-blueprint-123');
  private _userId = signal<string | null>('test-user-456');
  
  blueprintId = this._blueprintId.asReadonly();
  userId = this._userId.asReadonly();
  
  setBlueprint(id: string): void {
    this._blueprintId.set(id);
  }
  
  setUser(id: string): void {
    this._userId.set(id);
  }
  
  clear(): void {
    this._blueprintId.set(null);
    this._userId.set(null);
  }
  
  requireBlueprintId(): string {
    return this._blueprintId() || 'test-blueprint-123';
  }
  
  requireUserId(): string {
    return this._userId() || 'test-user-456';
  }
}
```

**Usage**:
```typescript
TestBed.configureTestingModule({
  providers: [
    { provide: TenantContextService, useClass: MockTenantContextService }
  ]
});
```

---

### 9.2 Test Blueprint Factory

```typescript
export class BlueprintTestFactory {
  static createBlueprint(
    overrides?: Partial<Blueprint>
  ): Blueprint {
    return {
      id: 'test-blueprint-' + Date.now(),
      name: 'Test Blueprint',
      ownerType: 'user',
      ownerId: 'test-user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      settings: {
        visibility: 'private',
        allowGuestAccess: false,
        defaultMemberRole: 'viewer',
        features: ['tasks']
      },
      status: 'active',
      ...overrides
    };
  }
  
  static createMember(
    overrides?: Partial<BlueprintMember>
  ): BlueprintMember {
    const userId = overrides?.memberId || 'test-user-123';
    const blueprintId = overrides?.blueprintId || 'test-blueprint-456';
    
    return {
      id: `${userId}_${blueprintId}`,
      blueprintId,
      memberType: 'user',
      memberId: userId,
      role: 'member',
      permissions: ['task:read', 'task:create'],
      status: 'active',
      joinedAt: new Date(),
      lastAccessAt: new Date(),
      ...overrides
    };
  }
}
```

---

## Summary

The Multi-Tenancy System provides comprehensive Blueprint-based isolation with:

- **4 Core Models**: Blueprint, BlueprintMember, Organization, Team, Partner
- **3 Repositories**: BlueprintRepository, BlueprintMemberRepository, OrganizationRepository
- **2 Services**: TenantContextService, BlueprintService
- **2 Guards/Interceptors**: BlueprintGuard, TenantContextInterceptor
- **Complete Security Rules**: Multi-tenant isolation, permission-based access
- **Advanced Patterns**: Cross-Blueprint sharing, hierarchical permissions, resource quotas
- **Testing Utilities**: Mock services and test factories

All components follow Angular 20 best practices with Signals, standalone components, and direct Firebase injection.

---

**Next Steps**:
1. Review DEPLOYMENT_GUIDE.md for setup instructions
2. Check PRODUCTION_RUNBOOK.md for operational procedures
3. Validate with PRODUCTION_READINESS_CHECKLIST.md before deployment
