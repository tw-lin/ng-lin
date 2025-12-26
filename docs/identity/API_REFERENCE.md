# Identity & Auth System API Reference

Complete API documentation for the GigHub Identity & Authentication System.

## Table of Contents

1. [Core Services](#core-services)
2. [Guards](#guards)
3. [Interceptors](#interceptors)
4. [Models & Interfaces](#models--interfaces)
5. [Validators](#validators)
6. [Directives & Pipes](#directives--pipes)
7. [Security Rules](#security-rules)

---

## Core Services

### AuthService

Central authentication service integrating Firebase Auth with DELON token management.

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  // Authentication State
  currentUser$: Observable<AuthUser | null>;
  isAuthenticated$: Observable<boolean>;
  isEmailVerified$: Observable<boolean>;
  
  // Login Methods
  loginWithEmail(email: string, password: string): Promise<AuthUser>;
  loginWithGoogle(): Promise<AuthUser>;
  loginWithGitHub(): Promise<AuthUser>;
  loginAnonymously(): Promise<AuthUser>;
  
  // Registration
  register(credentials: RegisterCredentials): Promise<AuthUser>;
  
  // Session Management
  logout(): Promise<void>;
  refreshToken(): Promise<string>;
  validateSession(): Promise<boolean>;
  
  // Email Verification
  sendVerificationEmail(): Promise<void>;
  verifyEmail(code: string): Promise<void>;
  
  // Password Management
  sendPasswordReset(email: string): Promise<void>;
  confirmPasswordReset(code: string, newPassword: string): Promise<void>;
  changePassword(oldPassword: string, newPassword: string): Promise<void>;
  
  // Multi-Factor Authentication (MFA)
  enableMFA(): Promise<MFASetupData>;
  verifyMFACode(code: string): Promise<void>;
  disableMFA(password: string): Promise<void>;
  
  // Account Management
  deleteAccount(password: string): Promise<void>;
  linkAccount(provider: OAuthProvider): Promise<void>;
  unlinkAccount(provider: OAuthProvider): Promise<void>;
}
```

**Authentication Flow**:
1. User provides credentials → `loginWithEmail()`
2. Firebase Auth validates → Returns Firebase User
3. Convert to `AuthUser` → Extract claims and roles
4. Store in DELON token service → Session management
5. Emit authentication state → `currentUser$` observers notified
6. Auto-refresh token every 55 minutes

**Error Handling**:
```typescript
try {
  await authService.loginWithEmail(email, password);
} catch (error) {
  if (error.code === 'auth/user-not-found') {
    // Handle user not found
  } else if (error.code === 'auth/wrong-password') {
    // Handle wrong password
  } else if (error.code === 'auth/too-many-requests') {
    // Handle rate limiting
  }
}
```

---

### UserContextService

Manages current authenticated user context and profile information.

```typescript
@Injectable({ providedIn: 'root' })
export class UserContextService {
  // Current User Signals
  currentUser = signal<AuthUser | null>(null);
  isAuthenticated = computed(() => this.currentUser() !== null);
  userId = computed(() => this.currentUser()?.uid);
  userEmail = computed(() => this.currentUser()?.email);
  userDisplayName = computed(() => this.currentUser()?.displayName);
  
  // Profile Information
  userProfile = signal<UserProfile | null>(null);
  photoURL = computed(() => this.userProfile()?.photoURL);
  preferences = computed(() => this.userProfile()?.preferences);
  
  // Tenant Context (Multi-Tenancy)
  currentTenantId = signal<string | null>(null);
  tenantMemberships = signal<TenantMembership[]>([]);
  activeMembership = computed(() => 
    this.tenantMemberships().find(m => m.tenantId === this.currentTenantId())
  );
  
  // Role & Permissions (Computed from membership)
  userRole = computed(() => this.activeMembership()?.role);
  userPermissions = computed(() => this.activeMembership()?.permissions || []);
  
  // Methods
  switchTenant(tenantId: string): Promise<void>;
  updateProfile(data: Partial<UserProfile>): Promise<void>;
  refreshProfile(): Promise<UserProfile>;
  canPerform(permission: string): boolean;
  hasRole(role: string): boolean;
}
```

**Usage Example**:
```typescript
@Component({...})
export class DashboardComponent {
  private userContext = inject(UserContextService);
  
  // Reactive user data
  userName = this.userContext.userDisplayName;
  userRole = this.userContext.userRole;
  canEdit = computed(() => this.userContext.canPerform('blueprint:edit'));
  
  ngOnInit() {
    // Switch to organization context
    this.userContext.switchTenant('org-123');
  }
}
```

---

### TokenService

Manages authentication tokens (Firebase ID Token + DELON Token Service integration).

```typescript
@Injectable({ providedIn: 'root' })
export class TokenService implements ITokenService {
  // Token Management
  getToken(): string | null;
  setToken(token: string): void;
  clearToken(): void;
  
  // Firebase ID Token
  getFirebaseToken(): Promise<string | null>;
  refreshFirebaseToken(): Promise<string>;
  decodeToken(token: string): DecodedToken;
  
  // Token Validation
  isTokenExpired(token?: string): boolean;
  isTokenValid(token?: string): boolean;
  getTokenExpiration(token?: string): Date | null;
  
  // Custom Claims
  getClaims(): TokenClaims | null;
  hasRole(role: string): boolean;
  hasPermission(permission: string): boolean;
  getTenantId(): string | null;
}
```

**Token Structure** (Firebase ID Token):
```typescript
interface DecodedToken {
  // Standard JWT Claims
  sub: string;          // User ID (uid)
  email: string;
  email_verified: boolean;
  iat: number;          // Issued at (timestamp)
  exp: number;          // Expiration (timestamp)
  
  // Custom Claims
  role?: string;        // User role in current tenant
  permissions?: string[]; // User permissions
  tenant_id?: string;   // Current tenant context
  org_id?: string;      // Organization ID (if applicable)
  is_admin?: boolean;   // Global admin flag
}
```

**Auto-Refresh Strategy**:
- Token lifetime: 60 minutes (Firebase default)
- Refresh trigger: 55 minutes after issue
- Interceptor auto-injects refreshed token
- Retry on 401 with refreshed token

---

### SessionService

Manages authentication session lifecycle and persistence.

```typescript
@Injectable({ providedIn: 'root' })
export class SessionService {
  // Session State
  sessionId = signal<string | null>(null);
  sessionStart = signal<Date | null>(null);
  sessionActive = signal(false);
  lastActivity = signal<Date | null>(null);
  
  // Session Methods
  createSession(user: AuthUser): Promise<string>;
  validateSession(): Promise<boolean>;
  refreshSession(): Promise<void>;
  endSession(): Promise<void>;
  
  // Activity Tracking
  recordActivity(): void;
  getInactivityDuration(): number;
  isSessionExpired(): boolean;
  
  // Session Configuration
  setSessionTimeout(minutes: number): void;
  enableSessionPersistence(enabled: boolean): void;
  getSessionInfo(): SessionInfo;
}
```

**Session Lifecycle**:
1. **Create**: User logs in → `createSession()` → Generate session ID → Store in Firebase Auth persistence
2. **Validate**: On route change → `validateSession()` → Check token + activity → Refresh if needed
3. **Activity**: User interaction → `recordActivity()` → Update last activity timestamp
4. **Expire**: Inactivity > 30min → `isSessionExpired()` returns true → Auto-logout
5. **End**: User logs out → `endSession()` → Clear tokens + session data

---

## Guards

### AuthGuard

Basic authentication guard - ensures user is logged in.

```typescript
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanActivateChild {
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree;
  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree;
}
```

**Usage**:
```typescript
const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard]  // Requires authentication
  },
  {
    path: 'admin',
    canActivateChild: [AuthGuard],  // Protect all child routes
    children: [...]
  }
];
```

**Behavior**:
- If authenticated → Allow access
- If not authenticated → Redirect to `/login` with `returnUrl` query param
- Preserves original URL for post-login redirect

---

### RoleGuard

Role-based access control guard.

```typescript
@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree;
}
```

**Usage**:
```typescript
const routes: Routes = [
  {
    path: 'admin',
    component: AdminPanelComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin', 'owner'] }  // Required roles
  }
];
```

**Behavior**:
- Check user role from token claims
- If user has ANY of the required roles → Allow access
- If user lacks role → Redirect to `/forbidden`

---

### PermissionGuard

Fine-grained permission guard.

```typescript
@Injectable({ providedIn: 'root' })
export class PermissionGuard implements CanActivate {
  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree;
}
```

**Usage**:
```typescript
const routes: Routes = [
  {
    path: 'blueprints/:id/edit',
    component: BlueprintEditComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: { permissions: ['blueprint:edit'] }  // Required permissions
  }
];
```

**Permission Format**: `resource:action`
- `blueprint:read`, `blueprint:create`, `blueprint:edit`, `blueprint:delete`
- `task:read`, `task:create`, `task:update`, `task:delete`
- `user:invite`, `user:remove`, `org:admin`

---

### EmailVerifiedGuard

Ensures user has verified email address.

```typescript
@Injectable({ providedIn: 'root' })
export class EmailVerifiedGuard implements CanActivate {
  canActivate(): boolean | UrlTree;
}
```

**Usage**:
```typescript
const routes: Routes = [
  {
    path: 'blueprints/create',
    component: CreateBlueprintComponent,
    canActivate: [AuthGuard, EmailVerifiedGuard]
  }
];
```

**Behavior**:
- If email verified → Allow access
- If not verified → Redirect to `/verify-email` with resend option

---

### MFAGuard

Multi-Factor Authentication verification guard.

```typescript
@Injectable({ providedIn: 'root' })
export class MFAGuard implements CanActivate {
  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree;
}
```

**Usage**:
```typescript
const routes: Routes = [
  {
    path: 'settings/security',
    component: SecuritySettingsComponent,
    canActivate: [AuthGuard, MFAGuard],
    data: { requireMFA: true }
  }
];
```

---

## Interceptors

### AuthTokenInterceptor

Automatically injects Firebase ID Token into HTTP requests.

```typescript
@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>;
}
```

**Behavior**:
1. Intercept outgoing HTTP request
2. Get Firebase ID Token from `TokenService`
3. Clone request and add `Authorization: Bearer {token}` header
4. Forward modified request

**Configuration**:
```typescript
// Automatic injection via @angular/fire
provideHttpClient(
  withInterceptors([authTokenInterceptor])
)
```

---

### AuthErrorInterceptor

Handles authentication errors (401/403) globally.

```typescript
@Injectable()
export class AuthErrorInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>;
}
```

**Error Handling**:
- **401 Unauthorized**: Token expired → Attempt refresh → Retry request
- **403 Forbidden**: Insufficient permissions → Redirect to `/forbidden`
- **Network Error**: Offline → Show offline banner

---

### TokenRefreshInterceptor

Auto-refreshes token on expiration.

```typescript
@Injectable()
export class TokenRefreshInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>;
}
```

**Refresh Strategy**:
1. Before request → Check token expiration
2. If expires in < 5 minutes → Refresh token
3. Queue subsequent requests during refresh
4. Replay queued requests with new token

---

## Models & Interfaces

### AuthUser

Complete authenticated user model.

```typescript
interface AuthUser {
  // Core Identity
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  
  // Authentication Metadata
  providerId: string;           // 'password' | 'google.com' | 'github.com'
  isAnonymous: boolean;
  createdAt: Date;
  lastLoginAt: Date;
  
  // Custom Claims (from token)
  role?: string;
  permissions?: string[];
  tenantId?: string;
  organizationId?: string;
  isAdmin?: boolean;
  
  // MFA Status
  mfaEnabled: boolean;
  mfaVerified: boolean;
  
  // Provider Data (linked accounts)
  providerData: AuthProviderData[];
}
```

---

### UserProfile

Extended user profile stored in Firestore.

```typescript
interface UserProfile {
  // Identity
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  
  // Profile Information
  firstName?: string;
  lastName?: string;
  bio?: string;
  location?: string;
  company?: string;
  website?: string;
  
  // Preferences
  preferences: {
    language: string;
    timezone: string;
    theme: 'light' | 'dark' | 'auto';
    notifications: NotificationPreferences;
    accessibility: AccessibilityPreferences;
  };
  
  // Account Status
  status: 'active' | 'suspended' | 'deleted';
  emailVerified: boolean;
  phoneVerified: boolean;
  mfaEnabled: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
  loginCount: number;
  
  // Multi-Tenancy
  defaultTenantId?: string;
  tenantMemberships: string[];  // Array of tenant IDs
}
```

---

### TenantMembership

User membership in a tenant/organization.

```typescript
interface TenantMembership {
  // Identity
  membershipId: string;
  userId: string;
  tenantId: string;
  tenantType: 'personal' | 'organization';
  
  // Role & Permissions
  role: 'owner' | 'admin' | 'member' | 'guest';
  permissions: string[];
  customPermissions?: Record<string, boolean>;
  
  // Status
  status: 'active' | 'invited' | 'suspended' | 'revoked';
  invitedBy?: string;
  invitedAt?: Date;
  joinedAt?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastAccessAt?: Date;
}
```

---

### LoginCredentials

Login request payload.

```typescript
interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  mfaCode?: string;  // If MFA enabled
}

interface RegisterCredentials extends LoginCredentials {
  displayName: string;
  acceptTerms: boolean;
  marketingConsent?: boolean;
}
```

---

## Validators

### PasswordStrengthValidator

Custom validator for password strength requirements.

```typescript
export function passwordStrengthValidator(
  minLength = 8,
  requireNumbers = true,
  requireSpecialChars = true,
  requireUppercase = true
): ValidatorFn;
```

**Validation Rules**:
- Minimum length: 8 characters (configurable)
- At least one number
- At least one special character (!@#$%^&*)
- At least one uppercase letter
- At least one lowercase letter

**Usage**:
```typescript
passwordControl = new FormControl('', [
  Validators.required,
  passwordStrengthValidator()
]);
```

---

### EmailDomainValidator

Validates email against allowed/blocked domains.

```typescript
export function emailDomainValidator(
  allowedDomains?: string[],
  blockedDomains?: string[]
): ValidatorFn;
```

**Usage**:
```typescript
emailControl = new FormControl('', [
  Validators.required,
  Validators.email,
  emailDomainValidator(
    ['company.com', 'partner.com'],  // Allow only these domains
    ['tempmail.com', 'throwaway.com']  // Block these domains
  )
]);
```

---

## Directives & Pipes

### HasPermissionDirective

Structural directive to conditionally display content based on permissions.

```typescript
@Directive({ selector: '[appHasPermission]' })
export class HasPermissionDirective implements OnInit, OnDestroy {
  @Input() appHasPermission!: string | string[];
  @Input() appHasPermissionOperator: 'AND' | 'OR' = 'AND';
}
```

**Usage**:
```html
<!-- Show if user has permission -->
<button *appHasPermission="'blueprint:edit'">Edit Blueprint</button>

<!-- Show if user has ANY of the permissions -->
<div *appHasPermission="['task:edit', 'task:delete']; operator: 'OR'">
  Task Actions
</div>

<!-- Show if user has ALL permissions -->
<div *appHasPermission="['org:admin', 'user:invite']; operator: 'AND'">
  Invite Users
</div>
```

---

### HasRoleDirective

Structural directive for role-based display control.

```typescript
@Directive({ selector: '[appHasRole]' })
export class HasRoleDirective implements OnInit, OnDestroy {
  @Input() appHasRole!: string | string[];
}
```

**Usage**:
```html
<!-- Show if user has admin role -->
<div *appHasRole="'admin'">Admin Panel</div>

<!-- Show if user has any of the roles -->
<div *appHasRole="['admin', 'owner']">Management Tools</div>
```

---

### CanPipe

Permission check pipe for inline display logic.

```typescript
@Pipe({ name: 'can' })
export class CanPipe implements PipeTransform {
  transform(permission: string | string[], operator: 'AND' | 'OR' = 'AND'): boolean;
}
```

**Usage**:
```html
<button [disabled]="!('blueprint:edit' | can)">Edit</button>

@if ('task:delete' | can) {
  <button (click)="deleteTask()">Delete</button>
}
```

---

## Security Rules

### Firestore Security Rules (Authentication)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper Functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getCurrentUserId() {
      return request.auth.uid;
    }
    
    function isEmailVerified() {
      return request.auth.token.email_verified == true;
    }
    
    function hasCustomClaim(claim) {
      return claim in request.auth.token;
    }
    
    // Users Collection
    match /users/{userId} {
      // Users can read their own profile
      allow read: if isAuthenticated() && getCurrentUserId() == userId;
      
      // Users can update their own profile (excluding sensitive fields)
      allow update: if isAuthenticated() && 
                       getCurrentUserId() == userId &&
                       !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'permissions', 'isAdmin']);
      
      // Only system can create users (via Cloud Functions)
      allow create: if false;
      allow delete: if false;
    }
    
    // Tenant Memberships Collection
    match /tenantMemberships/{membershipId} {
      // Users can read their own memberships
      allow read: if isAuthenticated() && 
                     resource.data.userId == getCurrentUserId();
      
      // Tenant admins can manage memberships
      allow write: if isAuthenticated() && 
                      isEmailVerified() &&
                      hasRole(resource.data.tenantId, ['owner', 'admin']);
    }
    
    // Helper: Check user role in tenant
    function hasRole(tenantId, roles) {
      let membership = get(/databases/$(database)/documents/tenantMemberships/$(getCurrentUserId() + '_' + tenantId));
      return membership.data.status == 'active' && 
             membership.data.role in roles;
    }
  }
}
```

---

## Authentication Events

All authentication events are automatically audited via `AuditCollectorEnhancedService`.

**Event Types**:
- `auth.login` - User login (email, Google, GitHub, anonymous)
- `auth.logout` - User logout
- `auth.register` - New user registration
- `auth.email_verified` - Email verification completed
- `auth.password_reset` - Password reset initiated
- `auth.password_changed` - Password changed
- `auth.mfa_enabled` - MFA enabled
- `auth.mfa_disabled` - MFA disabled
- `auth.account_deleted` - Account deletion
- `auth.session_expired` - Session timeout
- `auth.failed_login` - Failed login attempt

**Event Structure**:
```typescript
{
  eventType: 'auth.login',
  actorType: 'user',
  actorId: 'user-123',
  timestamp: new Date(),
  tenantId: 'org-456',
  metadata: {
    provider: 'google.com',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0...',
    mfaVerified: true
  }
}
```

---

## Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `auth/invalid-email` | Email format invalid | Validate email format |
| `auth/user-not-found` | User doesn't exist | Show "user not found" |
| `auth/wrong-password` | Incorrect password | Show "incorrect password" |
| `auth/email-already-in-use` | Email already registered | Show "email taken" |
| `auth/weak-password` | Password too weak | Show password requirements |
| `auth/too-many-requests` | Rate limit exceeded | Show "try again later" |
| `auth/network-request-failed` | Network error | Show offline message |
| `auth/requires-recent-login` | Sensitive operation | Re-authenticate user |
| `auth/user-token-expired` | Token expired | Auto-refresh token |

---

## Best Practices

1. **Always use AuthGuard** for protected routes
2. **Validate email before critical actions** with EmailVerifiedGuard
3. **Use role/permission guards** for authorization
4. **Handle 401/403 globally** with interceptors
5. **Audit sensitive operations** (login, logout, password change)
6. **Implement rate limiting** on login/registration
7. **Use MFA for admin accounts**
8. **Never store passwords** in Firestore - only Firebase Auth
9. **Refresh tokens proactively** (55-minute interval)
10. **Log failed authentication attempts** for security monitoring

---

**Version**: 1.0  
**Last Updated**: December 26, 2025  
**Compatibility**: Angular 20.x, Firebase 20.x, @angular/fire 20.x
