# Identity & Authentication System Deployment Guide

Complete deployment guide for the GigHub Identity & Authentication System.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Firebase Authentication Setup](#firebase-authentication-setup)
3. [Application Configuration](#application-configuration)
4. [Security Rules Deployment](#security-rules-deployment)
5. [Verification & Testing](#verification--testing)
6. [Post-Deployment](#post-deployment)
7. [Rollback Procedures](#rollback-procedures)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

```bash
# Node.js & npm
node --version  # v20+ required
npm --version   # v10+ required

# Angular CLI
npm install -g @angular/cli@20
ng version

# Firebase CLI
npm install -g firebase-tools
firebase --version  # v13+ required

# Login to Firebase
firebase login
```

### Required Accounts & Permissions

- **Firebase Project Access**: Owner or Editor role
- **Google Cloud Console**: Viewer access (for monitoring)
- **reCAPTCHA Enterprise**: Admin access (for App Check configuration)

### Environment Variables

Create `.env` file at project root:

```bash
# Firebase Configuration
FIREBASE_API_KEY="your-api-key"
FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
FIREBASE_MESSAGING_SENDER_ID="123456789"
FIREBASE_APP_ID="1:123456789:web:abc123"
FIREBASE_MEASUREMENT_ID="G-ABC123XYZ"

# reCAPTCHA Enterprise (App Check)
RECAPTCHA_SITE_KEY="your-recaptcha-site-key"

# Authentication Settings
AUTH_SESSION_TIMEOUT_MS=3600000  # 1 hour
AUTH_TOKEN_REFRESH_THRESHOLD_MS=300000  # 5 minutes before expiry
```

**Security Note**: Never commit `.env` to version control. Add to `.gitignore`.

---

## Firebase Authentication Setup

### Step 1: Enable Authentication Providers

```bash
# Navigate to Firebase Console
open https://console.firebase.google.com/project/[PROJECT_ID]/authentication/providers

# Enable the following providers:
```

#### 1.1 Email/Password Provider

Firebase Console → Authentication → Sign-in method → Email/Password

```yaml
Provider: Email/Password
Status: Enabled
Email enumeration protection: Enabled (recommended)
Email link (passwordless sign-in): Disabled (for now)
```

**Configuration**:
- Enable "Require email verification" for new accounts
- Set password policy: Minimum 8 characters, mix of letters/numbers/symbols

#### 1.2 Google Provider

Firebase Console → Authentication → Sign-in method → Google

```yaml
Provider: Google
Status: Enabled
Project support email: your-email@domain.com
Project public-facing name: GigHub Construction Management
```

**OAuth Configuration**:
```bash
# Add authorized domains
firebase auth:domain add yourdomain.com
firebase auth:domain add app.yourdomain.com
```

#### 1.3 GitHub Provider (Optional)

Firebase Console → Authentication → Sign-in method → GitHub

```yaml
Provider: GitHub
Status: Enabled
Client ID: [from GitHub OAuth App]
Client Secret: [from GitHub OAuth App]
```

**GitHub OAuth App Setup**:
1. Navigate to https://github.com/settings/developers
2. Create new OAuth App
3. Set Authorization callback URL: `https://[PROJECT_ID].firebaseapp.com/__/auth/handler`
4. Copy Client ID and Client Secret to Firebase Console

#### 1.4 Anonymous Provider

Firebase Console → Authentication → Sign-in method → Anonymous

```yaml
Provider: Anonymous
Status: Enabled
```

**Use Cases**: Guest access, trial periods, pre-registration exploration

### Step 2: Configure App Check (reCAPTCHA Enterprise)

```bash
# Enable App Check in Firebase Console
open https://console.firebase.google.com/project/[PROJECT_ID]/appcheck

# Register your app
# Select "reCAPTCHA Enterprise" as provider
# Add your domain
```

**reCAPTCHA Enterprise Setup**:

1. **Enable API** in Google Cloud Console:
```bash
gcloud services enable recaptchaenterprise.googleapis.com --project=[PROJECT_ID]
```

2. **Create reCAPTCHA Key**:
```bash
# Navigate to Google Cloud Console → Security → reCAPTCHA Enterprise
# Create key with:
# - Type: Website
# - Domain: yourdomain.com
# - Copy Site Key to firebase.config.ts
```

3. **Update Firebase Configuration**:
```typescript
// src/app/firebase/config/firebase.config.ts
export const firebaseRecaptchaSiteKey = 'your-recaptcha-site-key';
```

### Step 3: Configure Authentication Settings

```bash
# Set auth domain
firebase auth:domain add auth.yourdomain.com

# Configure session duration (Firebase Console)
# Authentication → Settings → User session timeout: 1 hour
```

**Authorized Domains**:
```
- localhost (for development)
- yourdomain.com (production)
- app.yourdomain.com (production SPA)
- staging.yourdomain.com (staging)
```

---

## Application Configuration

### Step 1: Update Firebase Configuration

**File**: `src/app/firebase/config/firebase.config.ts`

```typescript
import { FirebaseOptions } from '@angular/fire/app';

/**
 * Firebase App Configuration
 * 
 * Source: Firebase Console → Project Settings → General → Your apps → Web app
 */
export const firebaseAppOptions: FirebaseOptions = {
  apiKey: process.env['FIREBASE_API_KEY']!,
  authDomain: process.env['FIREBASE_AUTH_DOMAIN']!,
  projectId: process.env['FIREBASE_PROJECT_ID']!,
  storageBucket: process.env['FIREBASE_STORAGE_BUCKET']!,
  messagingSenderId: process.env['FIREBASE_MESSAGING_SENDER_ID']!,
  appId: process.env['FIREBASE_APP_ID']!,
  measurementId: process.env['FIREBASE_MEASUREMENT_ID']
};

/**
 * reCAPTCHA Enterprise Site Key (for App Check)
 * 
 * Source: Google Cloud Console → Security → reCAPTCHA Enterprise → Keys
 */
export const firebaseRecaptchaSiteKey = process.env['RECAPTCHA_SITE_KEY']!;
```

### Step 2: Verify Firebase Providers

**File**: `src/app/firebase/config/firebase.providers.ts`

Ensure the following providers are configured:

```typescript
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideAppCheck, initializeAppCheck, ReCaptchaEnterpriseProvider } from '@angular/fire/app-check';

export const firebaseProviders: Array<Provider | EnvironmentProviders> = [
  // Initialize Firebase App
  provideFirebaseApp(() => initializeApp(firebaseAppOptions)),
  
  // App Check (reCAPTCHA Enterprise)
  provideAppCheck(() =>
    initializeAppCheck(getApp(), {
      provider: new ReCaptchaEnterpriseProvider(firebaseRecaptchaSiteKey),
      isTokenAutoRefreshEnabled: true
    })
  ),
  
  // Firebase Authentication
  provideAuth(() => getAuth()),
  
  // ... other Firebase services
];
```

### Step 3: Configure @delon/auth Integration

**File**: `src/app/app.config.ts`

```typescript
import { provideAuth, authSimpleInterceptor } from '@delon/auth';

const alainConfig: AlainConfig = {
  auth: {
    login_url: '/passport/login',  // Login route
    token_send_key: 'Authorization',  // Header name for token
    token_send_template: 'Bearer ${token}',  // Token format
    token_send_place: 'header',  // Send token in header
    token_invalid_redirect: true,  // Redirect on invalid token
    token_re_send: true,  // Refresh token automatically
    refreshTime: 300000,  // Refresh 5 minutes before expiry
    refreshOffset: 6000  // Offset for token refresh
  }
};

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    provideAuth(),  // @delon/auth provider
    provideHttpClient(
      withInterceptors([
        authSimpleInterceptor,  // @delon/auth interceptor
        defaultInterceptor  // Custom interceptor
      ])
    )
  ]
};
```

### Step 4: Initialize AuthFacade

**File**: `src/app/core/data-access/auth/auth.facade.ts` (already implemented)

The AuthFacade provides application-layer authentication API:

```typescript
@Injectable({ providedIn: 'root' })
export class AuthFacade implements AuthPort {
  private readonly impl = inject(FirebaseAuthService);

  readonly user$ = this.impl.user$;
  readonly loading = this.impl.loading;
  readonly isAuthenticated = this.impl.isAuthenticated;

  signIn(email: string, password: string) { ... }
  signUp(email: string, password: string) { ... }
  signOut() { ... }
  sendPasswordReset(email: string) { ... }
  refreshUser() { ... }
}
```

**Verification**:
```typescript
// In any component
import { inject } from '@angular/core';
import { AuthFacade } from '@core/data-access/auth/auth.facade';

export class MyComponent {
  private authFacade = inject(AuthFacade);
  
  ngOnInit() {
    this.authFacade.user$.subscribe(user => {
      console.log('Current user:', user);
    });
  }
}
```

---

## Security Rules Deployment

### Step 1: Review Security Rules

**File**: `src/firebase/firestore.rules`

The Security Rules implement:
- Multi-tenant isolation (Blueprint-based)
- Role-based access control (viewer, contributor, maintainer)
- Blueprint ownership validation (User/Organization)
- Member type validation (user, team, partner)

**Key Functions**:
```javascript
// Authentication check
function isAuthenticated() {
  return request.auth != null;
}

// Get current user ID
function getCurrentAccountId() {
  return request.auth != null ? request.auth.uid : null;
}

// Blueprint ownership check
function isBlueprintOwner(blueprintId) {
  let blueprint = get(/databases/$(database)/documents/blueprints/$(blueprintId));
  let accountId = getCurrentAccountId();
  return blueprint.data.ownerType == 'user' && blueprint.data.ownerId == accountId;
}

// Organization admin check
function isOrganizationAdmin(organizationId) {
  let accountId = getCurrentAccountId();
  let orgDoc = get(/databases/$(database)/documents/organizations/$(organizationId));
  return orgDoc != null && accountId in orgDoc.data.adminIds;
}

// Blueprint member role check
function hasMemberRole(blueprintId, allowedRoles) {
  let accountId = getCurrentAccountId();
  let memberPath = /databases/$(database)/documents/blueprints/$(blueprintId)/members/$(accountId);
  let member = exists(memberPath) ? get(memberPath) : null;
  return member != null && member.data.role in allowedRoles;
}
```

**Collection Rules** (Users Example):
```javascript
match /users/{userId} {
  // Read: Only authenticated users can read their own profile
  allow read: if isAuthenticated() && getCurrentAccountId() == userId;
  
  // Create: Only during sign-up (Firebase Auth handles this)
  allow create: if isAuthenticated() && getCurrentAccountId() == userId;
  
  // Update: Users can update their own profile (except sensitive fields)
  allow update: if isAuthenticated() 
                && getCurrentAccountId() == userId
                && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['uid', 'email', 'role']);
  
  // Delete: No direct delete (use soft delete)
  allow delete: if false;
}
```

### Step 2: Test Security Rules Locally

```bash
# Start Firebase Emulators
firebase emulators:start --only firestore,auth

# Run Security Rules tests
npm run test:rules

# Expected output:
# ✓ User can read their own profile
# ✓ User cannot read other users' profiles
# ✓ Authenticated user can create blueprint
# ✓ Blueprint member can read blueprint
# ✓ Non-member cannot read blueprint
# ✓ Blueprint owner can delete blueprint
# ✓ Non-owner cannot delete blueprint
```

**Security Rules Test File**: `src/firebase/firestore.rules.spec.ts`

Example test:
```typescript
describe('Authentication Rules', () => {
  it('should allow authenticated user to read own profile', async () => {
    const user = testEnv.authenticatedContext('user1');
    await assertSucceeds(user.firestore().doc('users/user1').get());
  });
  
  it('should deny unauthenticated user to read any profile', async () => {
    const unauth = testEnv.unauthenticatedContext();
    await assertFails(unauth.firestore().doc('users/user1').get());
  });
  
  it('should deny user to read another user's profile', async () => {
    const user = testEnv.authenticatedContext('user1');
    await assertFails(user.firestore().doc('users/user2').get());
  });
});
```

### Step 3: Deploy Security Rules

```bash
# Deploy to production
firebase deploy --only firestore:rules

# Expected output:
# === Deploying to 'your-project-id'...
# i  firestore: reading firestore indexes from src/firebase/firestore.indexes.json...
# ✔  firestore: released rules firestore.rules to cloud.firestore

# Verify deployment
firebase firestore:rules get

# Test rules in Firebase Console
open https://console.firebase.google.com/project/[PROJECT_ID]/firestore/rules
```

---

## Verification & Testing

### Step 1: Local Development Testing

```bash
# Start Angular dev server
npm run start

# Start Firebase Emulators
npm run emulators

# Open browser
open http://localhost:4200
```

**Test Scenarios**:

#### 1.1 Email/Password Authentication
```
1. Navigate to /passport/login
2. Click "Sign Up"
3. Enter email: test@example.com
4. Enter password: Test123!@#
5. Submit form
6. Verify email verification sent
7. Check user created in Firebase Auth Console
```

#### 1.2 Google Authentication
```
1. Navigate to /passport/login
2. Click "Sign in with Google"
3. Select Google account
4. Verify redirect to /dashboard
5. Check user created with Google provider
```

#### 1.3 Session Management
```
1. Sign in with email/password
2. Verify token stored in localStorage (@delon/auth)
3. Refresh page → User remains signed in
4. Wait for token expiry (or manually expire)
5. Verify automatic token refresh
6. Sign out → Verify token cleared
```

#### 1.4 Permission Validation
```
1. Sign in as user1
2. Create blueprint owned by user1
3. Sign out, sign in as user2
4. Attempt to access user1's blueprint → Should fail
5. Have user1 add user2 as "viewer"
6. user2 refresh → Should now see blueprint (read-only)
```

### Step 2: Production Smoke Tests

```bash
# Deploy to production
npm run build:prod
firebase deploy --only hosting

# Open production URL
open https://your-project-id.web.app
```

**Production Test Checklist**:

- [ ] Email/Password sign-up works
- [ ] Email verification email received
- [ ] Google sign-in works
- [ ] Session persists across page reloads
- [ ] Token auto-refresh works (check Network tab)
- [ ] Sign-out clears session
- [ ] Unauthorized access redirects to login
- [ ] App Check token generated (check Network tab)
- [ ] Security Rules enforce permissions
- [ ] User profile loads correctly

### Step 3: Security Validation

```bash
# Test unauthenticated access
curl -X GET https://your-project-id.web.app/api/users/me
# Expected: 401 Unauthorized

# Test authenticated access (with valid token)
curl -X GET https://your-project-id.web.app/api/users/me \
  -H "Authorization: Bearer [VALID_TOKEN]"
# Expected: 200 OK with user data

# Test cross-user access (user1 tries to read user2 profile)
# Expected: 403 Forbidden (enforced by Security Rules)
```

---

## Post-Deployment

### Step 1: Configure Monitoring

**Cloud Logging Queries**:

```sql
-- Authentication Success Events
resource.type="cloud_function"
resource.labels.function_name="firebase-auth"
jsonPayload.event="user.sign_in"
jsonPayload.status="success"

-- Authentication Failure Events
resource.type="cloud_function"
resource.labels.function_name="firebase-auth"
jsonPayload.event="user.sign_in"
jsonPayload.status="failure"

-- Token Refresh Events
resource.type="cloud_function"
resource.labels.function_name="auth-token-refresh"
jsonPayload.event="token.refresh"
```

**Create Alerts**:

```bash
# High authentication failure rate
gcloud alpha monitoring policies create \
  --notification-channels=[CHANNEL_ID] \
  --display-name="High Auth Failure Rate" \
  --condition-display-name="Auth failures > 10 per minute" \
  --condition-threshold-value=10 \
  --condition-threshold-duration=60s \
  --condition-filter='resource.type="cloud_function" AND jsonPayload.event="user.sign_in" AND jsonPayload.status="failure"'
```

### Step 2: User Acceptance Testing (UAT)

**UAT Checklist** (share with QA team):

- [ ] All authentication providers work
- [ ] Email verification flow completes
- [ ] Password reset flow completes
- [ ] Session timeout works as expected
- [ ] Token refresh is transparent to users
- [ ] Multi-tab sync works (same user, multiple tabs)
- [ ] Sign-out from one tab signs out all tabs
- [ ] Blueprint permissions enforced correctly
- [ ] Organization admin privileges work
- [ ] Team/Partner member access works

### Step 3: Performance Baseline

**Measure Key Metrics** (first 24 hours):

```bash
# Authentication Success Rate
# Target: > 99.5%
gcloud logging read "jsonPayload.event='user.sign_in'" --limit=1000 --format=json \
  | jq '[.[] | .jsonPayload.status] | group_by(.) | map({status: .[0], count: length})'

# Average Authentication Latency
# Target: < 500ms (p50), < 1000ms (p95)
gcloud logging read "jsonPayload.event='user.sign_in'" --limit=1000 --format=json \
  | jq '[.[] | .jsonPayload.duration_ms] | add / length'

# Token Refresh Success Rate
# Target: > 99.9%
gcloud logging read "jsonPayload.event='token.refresh'" --limit=1000 --format=json \
  | jq '[.[] | .jsonPayload.status] | group_by(.) | map({status: .[0], count: length})'
```

---

## Rollback Procedures

### Scenario 1: Security Rules Deployment Failure

```bash
# Revert to previous rules version
firebase firestore:rules rollback

# Or deploy backup rules
firebase deploy --only firestore:rules --config firebase.backup.json
```

### Scenario 2: Authentication Provider Misconfiguration

```bash
# Firebase Console → Authentication → Sign-in method
# Disable problematic provider immediately
# Users can still authenticate with other enabled providers
```

**Emergency Rollback**:
1. Disable provider in Firebase Console
2. Notify users via in-app banner
3. Fix configuration
4. Re-enable provider
5. Verify with test accounts

### Scenario 3: App Check Blocking Legitimate Users

```bash
# Temporarily disable App Check enforcement
# Firebase Console → App Check → Settings
# Change enforcement to "Monitoring mode"

# Fix reCAPTCHA configuration
# Re-enable enforcement after verification
```

### Scenario 4: Complete Application Rollback

```bash
# Rollback hosting to previous deployment
firebase hosting:rollback

# Rollback Security Rules
firebase firestore:rules rollback

# Verify previous version is live
open https://your-project-id.web.app
```

---

## Troubleshooting

### Issue 1: "auth/configuration-not-found"

**Symptom**: Firebase Auth throws configuration error

**Causes**:
- Firebase configuration not loaded
- Environment variables missing
- Provider not enabled in Firebase Console

**Resolution**:
```bash
# 1. Verify firebase.config.ts
cat src/app/firebase/config/firebase.config.ts

# 2. Check environment variables
cat .env

# 3. Verify provider enabled
open https://console.firebase.google.com/project/[PROJECT_ID]/authentication/providers

# 4. Restart dev server
npm run start
```

### Issue 2: "auth/network-request-failed"

**Symptom**: Authentication requests fail with network error

**Causes**:
- App Check blocking requests
- reCAPTCHA validation failed
- Firewall blocking Firebase domains

**Resolution**:
```bash
# 1. Check App Check status
# Firebase Console → App Check → Apps

# 2. Verify reCAPTCHA site key
grep RECAPTCHA_SITE_KEY .env

# 3. Test without App Check (development only)
# Comment out provideAppCheck in firebase.providers.ts

# 4. Check browser console for App Check errors
# Look for "App Check token fetch failed"
```

### Issue 3: Token Refresh Loop

**Symptom**: Application continuously refreshes auth token

**Causes**:
- Token expiry misconfigured
- Server time mismatch
- Race condition in token refresh logic

**Resolution**:
```typescript
// 1. Verify token refresh configuration
// src/app/app.config.ts
const alainConfig: AlainConfig = {
  auth: {
    refreshTime: 300000,  // 5 minutes before expiry
    refreshOffset: 6000,  // 6 second offset
    token_re_send: true
  }
};

// 2. Check token expiry
// Browser DevTools → Application → Local Storage → token
const token = JSON.parse(localStorage.getItem('_token'));
console.log('Token expires:', new Date(token.exp * 1000));

// 3. Adjust refresh timing if needed
// Increase refreshTime if token refresh happens too frequently
```

### Issue 4: Security Rules Denying Valid Requests

**Symptom**: Authenticated user cannot access their own data

**Causes**:
- Token not being sent with requests
- User ID mismatch in Security Rules
- Collection path incorrect

**Resolution**:
```bash
# 1. Verify token sent in requests
# Browser DevTools → Network → [Request] → Headers
# Look for: Authorization: Bearer [token]

# 2. Decode token to verify user ID
# Use https://jwt.io to decode token
# Check: sub field matches user document ID

# 3. Test rules in Firebase Console
# Firestore → Rules → Rules Playground
# Set auth: { uid: 'test-user-id' }
# Test: get /users/test-user-id
```

### Issue 5: Anonymous Auth Creating Duplicate Accounts

**Symptom**: Multiple anonymous accounts created for same user

**Causes**:
- localStorage cleared between sessions
- Anonymous user not being linked to permanent account

**Resolution**:
```typescript
// Implement anonymous-to-permanent account linking
import { linkWithCredential, EmailAuthProvider } from '@angular/fire/auth';

async linkAnonymousAccount(email: string, password: string) {
  const credential = EmailAuthProvider.credential(email, password);
  const user = await linkWithCredential(this.auth.currentUser, credential);
  console.log('Anonymous account linked:', user);
}
```

### Issue 6: Google Sign-In Popup Blocked

**Symptom**: Google sign-in popup blocked by browser

**Causes**:
- Browser popup blocker
- User interaction not detected
- Redirect URL not whitelisted

**Resolution**:
```typescript
// Use redirect instead of popup (more reliable)
import { signInWithRedirect, GoogleAuthProvider } from '@angular/fire/auth';

async signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  await signInWithRedirect(this.auth, provider);
  // Handle redirect result in auth state observer
}
```

---

## Additional Resources

### Firebase Documentation
- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [App Check Documentation](https://firebase.google.com/docs/app-check)

### Angular/Fire Documentation
- [@angular/fire GitHub](https://github.com/angular/angularfire)
- [@angular/fire Documentation](https://github.com/angular/angularfire/tree/master/docs)

### Internal Documentation
- [Identity & Auth API Reference](./API_REFERENCE.md)
- [Production Runbook](./PRODUCTION_RUNBOOK.md)
- [Monitoring & Cost Optimization](./MONITORING_COST_OPTIMIZATION.md)

---

**Version**: 1.0  
**Last Updated**: 2025-12-26  
**Maintained By**: GigHub Development Team  
**Next Review**: 2026-03-26
