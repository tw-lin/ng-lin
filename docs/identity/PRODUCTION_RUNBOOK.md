# Identity & Authentication Production Runbook

Operational runbook for troubleshooting and maintaining the GigHub Identity & Authentication system in production.

**Version**: 1.0  
**Last Updated**: December 26, 2025  
**On-Call Team**: Platform Engineering, Security Team

---

## Quick Reference

### Emergency Contacts

| Role | Name | Contact | Backup |
|------|------|---------|--------|
| Primary On-Call | [Name] | [Phone] | [Backup Name] |
| Engineering Lead | [Name] | [Phone] | [Backup Name] |
| Security Lead | [Name] | [Phone] | [Backup Name] |
| Manager | [Name] | [Phone] | - |

### Critical Links

- **Firebase Auth Console**: https://console.firebase.google.com/project/[PROJECT_ID]/authentication
- **Cloud Logging**: https://console.cloud.google.com/logs/query
- **Monitoring Dashboard**: https://console.cloud.google.com/monitoring/dashboards/custom/identity-auth
- **App Check Console**: https://console.firebase.google.com/project/[PROJECT_ID]/appcheck
- **Security Rules Console**: https://console.firebase.google.com/project/[PROJECT_ID]/firestore/rules
- **Incident Management**: [Your incident management system]

### System Health Check

```bash
# Quick health check command
gcloud logging read \
  'resource.type="firebase_auth" AND timestamp>="'"$(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%SZ)"'"' \
  --limit 20 \
  --format json

# Expected output: Mix of SUCCESS and occasional expected failures (e.g., wrong password)
```

---

## Table of Contents

1. [Common Issues & Resolutions](#common-issues--resolutions)
2. [Monitoring & Alerting](#monitoring--alerting)
3. [Troubleshooting Procedures](#troubleshooting-procedures)
4. [Maintenance Procedures](#maintenance-procedures)
5. [Security Incidents](#security-incidents)
6. [Disaster Recovery](#disaster-recovery)

---

## Common Issues & Resolutions

### Issue #1: High Authentication Failure Rate

**Alert**: `Auth Failure Rate > 10%`  
**Severity**: HIGH  
**MTTR**: 10 minutes

#### Symptoms
- Alert notification received
- Users unable to sign in
- Elevated auth failure metrics in dashboard
- Spike in support tickets

#### Investigation Steps

1. **Check Firebase Auth Status**:
```bash
# Check recent auth failures
gcloud logging read \
  'resource.type="firebase_auth" AND jsonPayload.event_type="LOGIN_FAILURE" AND timestamp>="'"$(date -u -d '15 minutes ago' +%Y-%m-%dT%H:%M:%SZ)"'"' \
  --limit 50 \
  --format json
```

2. **Analyze Failure Patterns**:
```bash
# Group failures by error code
gcloud logging read \
  'resource.type="firebase_auth" AND jsonPayload.event_type="LOGIN_FAILURE"' \
  --limit 200 \
  --format json | jq -r '.[] | .jsonPayload.error_code' | sort | uniq -c
```

3. **Check Provider Status**:
   - Verify Email/Password provider enabled
   - Check Google OAuth configuration
   - Verify GitHub OAuth app status
   - Test Anonymous auth in Console

#### Common Causes & Resolutions

**Cause A: App Check Blocking Legitimate Requests**
```
Error: auth/app-check-token-invalid
```

**Resolution**:
1. Check App Check enforcement mode:
   ```bash
   # Switch to monitoring mode temporarily
   gcloud firebase app-check web-apps update [WEB_APP_ID] \
     --token-ttl 3600s \
     --mode monitoring
   ```

2. Review App Check metrics for false positives:
   ```bash
   gcloud logging read \
     'resource.type="firebase_app_check" AND jsonPayload.verdict="INVALID"' \
     --limit 50
   ```

3. If attack detected, keep enforcing mode; if false positives, adjust site key configuration

**Cause B: OAuth Provider Configuration Issue**
```
Error: auth/invalid-oauth-provider
```

**Resolution**:
1. Verify OAuth provider settings in Firebase Console
2. For Google:
   - Check authorized domains include production domain
   - Verify OAuth 2.0 Client ID configuration in Google Cloud Console
   - Ensure authorized redirect URIs match `https://[PROJECT_ID].firebaseapp.com/__/auth/handler`

3. For GitHub:
   - Check OAuth App settings in GitHub
   - Verify callback URL: `https://[PROJECT_ID].firebaseapp.com/__/auth/handler`
   - Ensure Client ID and Secret match Firebase configuration

**Cause C: Token Refresh Loop**
```
Error: Continuous token refresh requests, high API usage
```

**Resolution**:
1. Check AuthFacade token refresh timing configuration:
   ```typescript
   // src/app/core/facades/auth.facade.ts
   // Ensure refreshBeforeExpiry is not too aggressive
   private refreshBeforeExpiry = 5 * 60 * 1000; // 5 minutes before expiry
   ```

2. Verify no duplicate auth state listeners:
   ```bash
   # Search for multiple onAuthStateChanged subscriptions
   grep -r "onAuthStateChanged" src/app/
   ```

3. Check for race conditions in token refresh logic

---

### Issue #2: Security Rules Denying Valid Requests

**Alert**: `Security Rules Denial Spike`  
**Severity**: MEDIUM  
**MTTR**: 15 minutes

#### Symptoms
- Users reporting "Permission Denied" errors
- Elevated Firestore permission-denied errors in logs
- Specific operations failing consistently

#### Investigation Steps

1. **Check Firestore Security Rules Logs**:
```bash
gcloud logging read \
  'resource.type="firestore_database" AND protoPayload.status.code=7' \
  --limit 50 \
  --format json
```

2. **Identify Affected Collections**:
```bash
# Extract collection paths from denials
gcloud logging read \
  'resource.type="firestore_database" AND protoPayload.status.code=7' \
  --limit 100 \
  --format json | jq -r '.[] | .protoPayload.resourceName' | sort | uniq -c
```

3. **Validate User Token**:
```bash
# Test auth token validity (use Firebase Admin SDK)
curl -X POST "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=[API_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"idToken": "[USER_ID_TOKEN]"}'
```

#### Common Causes & Resolutions

**Cause A: Token Expired or Not Refreshed**
```
Error: PERMISSION_DENIED: Missing or insufficient permissions
User token: expired or invalid
```

**Resolution**:
1. Check token expiry in application:
   ```typescript
   // Force token refresh in AuthFacade
   await this.refreshToken();
   ```

2. Verify token refresh interceptor working:
   ```bash
   # Check for 401 responses triggering refresh
   grep -A5 "401" logs/application.log
   ```

3. Test manual token refresh:
   ```typescript
   const user = await this.auth.currentUser;
   const token = await user.getIdToken(true); // Force refresh
   ```

**Cause B: BlueprintMember Not Found**
```
Error: Security Rules check failed
Helper function: isBlueprintMember() returned false
```

**Resolution**:
1. Verify blueprintMembers collection has user entry:
   ```bash
   # Query blueprintMembers collection
   gcloud firestore collections query blueprintMembers \
     --filter "userId==[USER_ID]" \
     --filter "blueprintId==[BLUEPRINT_ID]"
   ```

2. Check user invitation status:
   ```typescript
   // Verify invitation accepted
   const member = await BlueprintMemberRepository.findByUserAndBlueprint(userId, blueprintId);
   console.log('Member status:', member?.status); // Should be 'active'
   ```

3. Re-invite user if member record missing

**Cause C: Role/Permission Mismatch**
```
Error: Security Rules check failed
Helper function: hasPermission() returned false
```

**Resolution**:
1. Check user's role and permissions:
   ```typescript
   const member = await BlueprintMemberRepository.findById(memberId);
   console.log('Role:', member.role);
   console.log('Permissions:', member.permissions);
   ```

2. Verify required permission for operation:
   ```javascript
   // firestore.rules
   // Check which permission is required for the failing operation
   allow update: if hasPermission(blueprintId, 'task:update');
   ```

3. Update user role/permissions if needed:
   ```typescript
   await PermissionService.grantPermission(userId, blueprintId, 'task:update');
   ```

---

### Issue #3: Anonymous Auth Creating Duplicate Accounts

**Alert**: `High Anonymous User Growth`  
**Severity**: LOW  
**MTTR**: 30 minutes

#### Symptoms
- Increasing number of anonymous users
- Users reporting loss of data after sign-out
- Storage costs increasing unexpectedly

#### Investigation Steps

1. **Check Anonymous Auth Rate**:
```bash
gcloud logging read \
  'resource.type="firebase_auth" AND jsonPayload.event_type="CREATE" AND jsonPayload.provider_id="anonymous"' \
  --limit 100 \
  --format json | jq -r '.[] | .timestamp' | wc -l
```

2. **Identify Duplicate Patterns**:
```bash
# Check for same IP creating multiple anonymous accounts
gcloud logging read \
  'resource.type="firebase_auth" AND jsonPayload.provider_id="anonymous"' \
  --format json | jq -r '.[] | .httpRequest.remoteIp' | sort | uniq -c | sort -rn | head -20
```

3. **Review Anonymous Account Lifecycle**:
   - Check if account linking implemented
   - Verify anonymous account cleanup policy

#### Resolution

**Implement Account Linking**:
```typescript
// src/app/core/services/firebase-auth.service.ts
async linkAnonymousAccount(credential: AuthCredential): Promise<void> {
  const currentUser = this.auth.currentUser;
  if (currentUser && currentUser.isAnonymous) {
    await linkWithCredential(currentUser, credential);
    console.log('Anonymous account linked successfully');
  }
}
```

**Enable Anonymous Account Cleanup**:
```typescript
// Cloud Function to delete stale anonymous accounts
export const cleanupAnonymousAccounts = functions
  .pubsub.schedule('every 24 hours')
  .onRun(async (context) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days ago
    
    const users = await admin.auth().listUsers();
    const deletions = users.users
      .filter(u => u.providerData.length === 0) // Anonymous
      .filter(u => new Date(u.metadata.lastSignInTime) < cutoffDate)
      .map(u => admin.auth().deleteUser(u.uid));
    
    await Promise.all(deletions);
    console.log(`Deleted ${deletions.length} stale anonymous accounts`);
  });
```

---

### Issue #4: OAuth Sign-In Popup Blocked

**Alert**: User reports from support tickets  
**Severity**: LOW  
**MTTR**: 5 minutes (user education)

#### Symptoms
- Users clicking "Sign in with Google/GitHub" but nothing happens
- Browser console shows popup blocked warning
- High abandonment rate on sign-in page

#### Investigation Steps

1. **Confirm Popup Blocker**:
   - Check browser console for popup blocked errors
   - Test in incognito mode
   - Test with popup blocker disabled

2. **Review Analytics**:
```bash
# Check sign-in start vs completion rate
gcloud logging read \
  'resource.type="firebase_auth" AND (jsonPayload.event_type="SIGN_IN_START" OR jsonPayload.event_type="LOGIN_SUCCESS")' \
  --format json | jq -r '.[] | .jsonPayload.event_type' | sort | uniq -c
```

#### Resolution

**Option A: Use Redirect Flow (Recommended)**
```typescript
// src/app/core/services/firebase-auth.service.ts
async signInWithGoogleRedirect(): Promise<void> {
  const provider = new GoogleAuthProvider();
  await signInWithRedirect(this.auth, provider);
}

// Handle redirect result on app initialization
async handleRedirectResult(): Promise<void> {
  try {
    const result = await getRedirectResult(this.auth);
    if (result) {
      console.log('Sign-in successful:', result.user);
    }
  } catch (error) {
    console.error('Redirect sign-in error:', error);
  }
}
```

**Option B: User Education**:
- Add instructions to allow popups for your domain
- Display popup blocker detection warning
- Provide alternative redirect-based sign-in option

```typescript
// Detect popup blocker
function detectPopupBlocker(): boolean {
  const popup = window.open('', '', 'width=1,height=1');
  if (!popup || popup.closed || typeof popup.closed === 'undefined') {
    return true; // Popup blocked
  }
  popup.close();
  return false; // Popup allowed
}
```

---

### Issue #5: Token Refresh Interceptor Not Working

**Alert**: `Elevated 401 Errors`  
**Severity**: MEDIUM  
**MTTR**: 20 minutes

#### Symptoms
- Users logged out unexpectedly
- API requests failing with 401 Unauthorized
- Token refresh not triggering automatically

#### Investigation Steps

1. **Check Interceptor Registration**:
```bash
# Verify TokenRefreshInterceptor registered in app.config.ts
grep -A10 "provideHttpClient" src/app/app.config.ts
```

2. **Check Token Expiry Timing**:
```typescript
// Decode JWT token and check expiry
const token = await this.auth.currentUser.getIdToken();
const decoded = JSON.parse(atob(token.split('.')[1]));
console.log('Token expires at:', new Date(decoded.exp * 1000));
console.log('Current time:', new Date());
```

3. **Review Interceptor Logs**:
```bash
grep -A5 "TokenRefreshInterceptor" logs/application.log | tail -50
```

#### Resolution

**Verify Interceptor Configuration**:
```typescript
// src/app/app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([tokenRefreshInterceptor]) // ✅ Ensure registered
    ),
    // ...
  ]
};
```

**Check Interceptor Logic**:
```typescript
// src/app/core/interceptors/token-refresh.interceptor.ts
export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authFacade = inject(AuthFacade);
  
  return from(authFacade.getValidToken()).pipe(
    switchMap(token => {
      const cloned = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
      return next(cloned);
    }),
    catchError(error => {
      if (error.status === 401) {
        // Token refresh failed, redirect to login
        authFacade.signOut();
      }
      return throwError(() => error);
    })
  );
};
```

**Test Token Refresh Manually**:
```typescript
// Test in browser console
const authFacade = inject(AuthFacade);
const token = await authFacade.getValidToken();
console.log('Token refreshed:', token);
```

---

## Monitoring & Alerting

### Key Metrics to Monitor

#### 1. Authentication Success Rate

**Metric**: `firebase_auth/login_success_count / (firebase_auth/login_success_count + firebase_auth/login_failure_count)`  
**Threshold**: < 95%  
**Alert Severity**: HIGH

**Cloud Logging Query**:
```sql
resource.type="firebase_auth"
jsonPayload.event_type=("LOGIN_SUCCESS" OR "LOGIN_FAILURE")
timestamp>="2024-01-01T00:00:00Z"
```

**Monitoring Chart**:
```yaml
displayName: "Auth Success Rate (%)"
chartType: LINE
dataSets:
  - timeSeriesQuery:
      filter: 'resource.type="firebase_auth" jsonPayload.event_type=("LOGIN_SUCCESS" OR "LOGIN_FAILURE")'
      aggregation:
        alignmentPeriod: 300s # 5 minutes
        perSeriesAligner: ALIGN_RATE
```

#### 2. Token Refresh Failures

**Metric**: `firebase_auth/token_refresh_failure_count`  
**Threshold**: > 10/minute  
**Alert Severity**: MEDIUM

**Cloud Logging Query**:
```sql
resource.type="firebase_auth"
jsonPayload.event_type="TOKEN_REFRESH_FAILURE"
timestamp>="2024-01-01T00:00:00Z"
```

#### 3. App Check Violations

**Metric**: `firebase_app_check/verdict_count{verdict="INVALID"}`  
**Threshold**: > 50/minute  
**Alert Severity**: HIGH (possible attack)

**Cloud Logging Query**:
```sql
resource.type="firebase_app_check"
jsonPayload.verdict="INVALID"
timestamp>="2024-01-01T00:00:00Z"
```

#### 4. Security Rules Denials

**Metric**: `firestore_database/permission_denied_count`  
**Threshold**: > 100/hour  
**Alert Severity**: MEDIUM

**Cloud Logging Query**:
```sql
resource.type="firestore_database"
protoPayload.status.code=7
timestamp>="2024-01-01T00:00:00Z"
```

#### 5. OAuth Provider Failures

**Metric**: `firebase_auth/oauth_failure_count`  
**Threshold**: > 5% of total sign-ins  
**Alert Severity**: HIGH

**Cloud Logging Query**:
```sql
resource.type="firebase_auth"
jsonPayload.provider_id=("google.com" OR "github.com")
jsonPayload.event_type="LOGIN_FAILURE"
timestamp>="2024-01-01T00:00:00Z"
```

### Alert Configuration

**High Authentication Failure Rate Alert**:
```yaml
displayName: "Identity - High Auth Failure Rate"
conditions:
  - displayName: "Auth Failure Rate > 10%"
    conditionThreshold:
      filter: 'resource.type="firebase_auth" metric.type="firebase_auth/login_failure_rate"'
      comparison: COMPARISON_GT
      thresholdValue: 0.1 # 10%
      duration: 300s # 5 minutes
      aggregations:
        alignmentPeriod: 60s
        perSeriesAligner: ALIGN_MEAN
notificationChannels:
  - projects/[PROJECT_ID]/notificationChannels/[CHANNEL_ID]
alertStrategy:
  autoClose: 1800s # 30 minutes
```

---

## Troubleshooting Procedures

### Procedure #1: Diagnose Authentication Failure

**When to Use**: User reports unable to sign in

**Steps**:

1. **Gather Information**:
   - User email or UID
   - Authentication provider (Email/Password, Google, GitHub, Anonymous)
   - Error message or code
   - Timestamp of failure
   - Browser/device information

2. **Check Firebase Auth Logs**:
```bash
gcloud logging read \
  'resource.type="firebase_auth" AND jsonPayload.user_id="[USER_UID]" AND timestamp>="[TIMESTAMP]"' \
  --limit 50 \
  --format json
```

3. **Verify User Account Status**:
```bash
# Check if user exists and is enabled
firebase auth:export users.json
grep "[USER_EMAIL]" users.json
```

4. **Test Authentication Flow**:
   - Attempt sign-in with same provider in staging environment
   - Check browser console for client-side errors
   - Verify network requests to Firebase Auth endpoints

5. **Check Provider-Specific Issues**:
   - Email/Password: Verify email verified, password reset if needed
   - Google: Check OAuth configuration, authorized domains
   - GitHub: Verify OAuth App settings, callback URL
   - Anonymous: Check if anonymous auth enabled

6. **Resolution**:
   - Re-enable user account if disabled
   - Reset OAuth configuration if corrupted
   - Clear auth state and retry sign-in
   - Escalate to Firebase Support if issue persists

### Procedure #2: Reset User Authentication State

**When to Use**: User experiencing persistent auth issues, stuck in bad state

**Steps**:

1. **Backup User Data** (if needed):
```typescript
const userData = await UserRepository.findById(userId);
await BackupService.backupUserData(userData);
```

2. **Sign Out User Everywhere**:
```typescript
// Force sign-out across all devices
await admin.auth().revokeRefreshTokens(userId);
console.log('All refresh tokens revoked');
```

3. **Clear Client-Side Auth State**:
```typescript
// In application
await this.authFacade.signOut();
localStorage.clear(); // Clear all local storage
sessionStorage.clear(); // Clear all session storage
```

4. **Reset Password** (if Email/Password provider):
```bash
firebase auth:reset-password [USER_EMAIL]
```

5. **Verify Auth State Reset**:
```bash
gcloud logging read \
  'resource.type="firebase_auth" AND jsonPayload.user_id="[USER_UID]" AND timestamp>="'"$(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%SZ)"'"' \
  --limit 20
```

6. **Have User Re-authenticate**:
   - User receives password reset email (if Email/Password)
   - User signs in with new password or OAuth provider
   - Verify successful sign-in in Firebase Console

### Procedure #3: Investigate Security Rules Denial

**When to Use**: Specific operation failing with permission denied

**Steps**:

1. **Identify Failing Operation**:
```bash
gcloud logging read \
  'resource.type="firestore_database" AND protoPayload.status.code=7 AND protoPayload.resourceName=~"[COLLECTION_PATH]"' \
  --limit 20 \
  --format json
```

2. **Extract Request Details**:
```bash
# Get full request details
gcloud logging read \
  'resource.type="firestore_database" AND protoPayload.status.code=7' \
  --limit 1 \
  --format json | jq '.[] | {path: .protoPayload.resourceName, method: .protoPayload.methodName, user: .protoPayload.authenticationInfo.principalEmail}'
```

3. **Test Security Rules Locally**:
```bash
# Start emulators
firebase emulators:start --only firestore

# Run security rules tests
npm run test:security-rules
```

4. **Manually Test Rule Logic**:
```javascript
// test/security-rules.test.js
describe('Security Rules', () => {
  it('should allow BlueprintMember to read tasks', async () => {
    const db = testEnv.authenticatedContext('user-1').firestore();
    const taskRef = db.collection('tasks').doc('task-1');
    await firebase.assertSucceeds(taskRef.get());
  });
});
```

5. **Check Helper Function Logic**:
```javascript
// firestore.rules
function isBlueprintMember(blueprintId) {
  let memberId = request.auth.uid + '_' + blueprintId;
  return exists(/databases/$(database)/documents/blueprintMembers/$(memberId));
}
```

6. **Verify User BlueprintMember Record**:
```bash
gcloud firestore collections query blueprintMembers \
  --filter "userId==[USER_ID]" \
  --filter "blueprintId==[BLUEPRINT_ID]" \
  --format json
```

7. **Fix Issues**:
   - Add missing BlueprintMember record
   - Update Security Rules if logic incorrect
   - Grant required permissions to user role
   - Redeploy Security Rules: `firebase deploy --only firestore:rules`

---

## Maintenance Procedures

### Weekly Maintenance

**Task**: Review Authentication Metrics & Logs

**Steps**:
1. Review authentication success/failure rates
2. Check for unusual patterns or spikes
3. Verify no OAuth provider degradations
4. Review App Check metrics for potential attacks
5. Check token refresh performance

**Dashboard**: Identity & Auth Weekly Review Dashboard

**Expected Duration**: 30 minutes

### Monthly Maintenance

**Task**: Security Audit & User Cleanup

**Steps**:
1. Review Security Rules deployment history
2. Audit user account statuses (disabled, unverified emails)
3. Clean up stale anonymous accounts (>30 days inactive)
4. Review OAuth provider configurations
5. Update App Check configuration if needed
6. Review and rotate API keys/secrets

**Expected Duration**: 2 hours

**Cleanup Script**:
```bash
# Run anonymous account cleanup
gcloud functions call cleanupAnonymousAccounts
```

### Quarterly Maintenance

**Task**: Comprehensive Identity & Auth Review

**Steps**:
1. Review all authentication providers and usage
2. Audit Security Rules coverage and effectiveness
3. Review token refresh strategy and performance
4. Update documentation for any configuration changes
5. Plan OAuth provider additions/removals
6. Review compliance with authentication policies
7. Conduct security penetration testing

**Expected Duration**: 4 hours

---

## Security Incidents

### Suspected Account Takeover

**Severity**: CRITICAL  
**Response Time**: Immediate

**Indicators**:
- Unusual sign-in locations/devices for user
- Rapid password changes
- Suspicious activity patterns
- User reports unauthorized access

**Response Steps**:

1. **Immediately Revoke Tokens**:
```typescript
await admin.auth().revokeRefreshTokens(userId);
```

2. **Disable Account**:
```typescript
await admin.auth().updateUser(userId, { disabled: true });
```

3. **Notify User**:
   - Send email notification about account security
   - Provide instructions for password reset
   - Advise to review recent account activity

4. **Investigate**:
```bash
# Review all auth events for user
gcloud logging read \
  'resource.type="firebase_auth" AND jsonPayload.user_id="[USER_UID]"' \
  --limit 200 \
  --format json > user_auth_audit.json
```

5. **Analyze Compromise Vector**:
   - Check for credential stuffing patterns
   - Review OAuth token usage
   - Check for suspicious IP addresses
   - Verify no Security Rules bypassed

6. **Remediation**:
   - Force password reset
   - Enable 2FA (when implemented)
   - Re-enable account after user verification
   - Monitor for 48 hours post-incident

### Brute Force Attack Detected

**Severity**: HIGH  
**Response Time**: 15 minutes

**Indicators**:
- High volume of failed auth attempts
- Multiple attempts from same IP
- Rapid sequential password attempts
- Pattern of common password attempts

**Response Steps**:

1. **Identify Attack Source**:
```bash
gcloud logging read \
  'resource.type="firebase_auth" AND jsonPayload.event_type="LOGIN_FAILURE"' \
  --limit 1000 \
  --format json | jq -r '.[] | .httpRequest.remoteIp' | sort | uniq -c | sort -rn
```

2. **Enable Rate Limiting** (if not already enabled):
```typescript
// Cloud Function to block IPs
export const blockSuspiciousIP = functions.https.onRequest(async (req, res) => {
  const suspiciousIPs = await detectBruteForce();
  for (const ip of suspiciousIPs) {
    await admin.securityRules().createRule({
      block: true,
      ip: ip,
      duration: 3600 // 1 hour
    });
  }
});
```

3. **Enable App Check Enforcement** (if in monitoring mode):
```bash
gcloud firebase app-check web-apps update [WEB_APP_ID] --mode enforcing
```

4. **Monitor Attack Progress**:
```bash
# Real-time monitoring
gcloud logging tail 'resource.type="firebase_auth" jsonPayload.event_type="LOGIN_FAILURE"'
```

5. **Notify Security Team**:
   - Send incident notification
   - Provide attack metrics (volume, IPs, targeted accounts)
   - Coordinate with Firebase Support if needed

6. **Post-Incident**:
   - Review attack patterns
   - Update rate limiting rules
   - Document lessons learned
   - Enhance monitoring/alerting

---

## Disaster Recovery

### Scenario #1: Firebase Auth Service Outage

**RTO**: 4 hours  
**RPO**: 0 (no data loss)

**Detection**:
- Firebase Status Dashboard shows Auth service degradation
- High volume of auth timeouts
- Unable to authenticate users

**Response**:

1. **Verify Outage** (5 minutes):
   - Check Firebase Status Dashboard: https://status.firebase.google.com/
   - Verify with `curl` to Auth API
   - Check Cloud Logging for Firebase-side errors

2. **Communication** (10 minutes):
   - Post status update to users
   - Notify stakeholders
   - Create incident in incident management system

3. **Implement Temporary Measures** (30 minutes):
   - Enable maintenance mode message
   - Display user-friendly error with status link
   - Disable auto-retry loops to reduce load

4. **Monitor Firebase Status** (ongoing):
   - Watch for service restoration
   - Test authentication once restored
   - Gradually re-enable features

5. **Recovery Validation** (30 minutes):
   - Verify all auth providers working
   - Test token refresh
   - Check Security Rules functioning
   - Validate App Check working

6. **Post-Incident** (1 hour):
   - Remove maintenance mode
   - Notify users of restoration
   - Document outage details
   - Review incident response effectiveness

### Scenario #2: Corrupted Security Rules

**RTO**: 30 minutes  
**RPO**: 0 (rules versioned)

**Detection**:
- Spike in Security Rules denials
- Valid operations failing
- Unable to deploy new rules

**Response**:

1. **Identify Issue** (5 minutes):
```bash
# Check current rules
firebase firestore:rules:get
```

2. **Rollback to Previous Version** (5 minutes):
```bash
# List rule versions
firebase firestore:rules:list

# Rollback to previous version
firebase firestore:rules:rollback --version [PREVIOUS_VERSION_ID]
```

3. **Verify Rollback** (10 minutes):
```bash
# Test rules in emulator
firebase emulators:start --only firestore
npm run test:security-rules
```

4. **Fix Rules** (varies):
```bash
# Fix rules in firestore.rules
# Test locally
firebase emulators:exec --only firestore "npm run test:security-rules"

# Deploy fixed rules
firebase deploy --only firestore:rules
```

5. **Validate Fix** (10 minutes):
   - Test all major operations
   - Check Security Rules denial rate
   - Monitor for 30 minutes

6. **Post-Incident**:
   - Document what caused corruption
   - Update rules testing procedures
   - Add validation to CI/CD

### Scenario #3: OAuth Provider Outage

**RTO**: Depends on provider  
**RPO**: 0 (no data loss)

**Detection**:
- High OAuth failure rate
- Users unable to sign in with specific provider
- Provider status page shows issues

**Response**:

1. **Identify Affected Provider** (2 minutes):
```bash
gcloud logging read \
  'resource.type="firebase_auth" jsonPayload.event_type="LOGIN_FAILURE" jsonPayload.provider_id=("google.com" OR "github.com")' \
  --limit 50
```

2. **Communication** (5 minutes):
   - Display banner: "Sign-in with [Provider] temporarily unavailable. Please use alternative sign-in method."
   - Update status page
   - Notify support team

3. **Provide Alternative** (10 minutes):
   - Highlight Email/Password sign-in option
   - Enable temporary Anonymous auth for guest access
   - Provide instructions for alternative providers

4. **Monitor Provider Status** (ongoing):
   - Watch provider status pages (Google, GitHub)
   - Test periodically for restoration
   - Track user impact metrics

5. **Recovery** (varies):
   - Test OAuth flow once provider restored
   - Remove service disruption banner
   - Notify users via email

6. **Post-Incident**:
   - Document provider reliability
   - Consider additional backup providers
   - Review OAuth fallback strategy

---

## Appendices

### A. Common Log Messages

| Log Message | Severity | Meaning | Action |
|-------------|----------|---------|--------|
| `LOGIN_SUCCESS` | INFO | User authenticated successfully | None (normal operation) |
| `LOGIN_FAILURE: auth/wrong-password` | WARNING | User entered wrong password | Monitor for brute force |
| `LOGIN_FAILURE: auth/user-not-found` | WARNING | Sign-in with non-existent email | Monitor for reconnaissance |
| `auth/app-check-token-invalid` | WARNING | App Check validation failed | Check App Check config |
| `auth/invalid-oauth-provider` | ERROR | OAuth provider misconfigured | Check OAuth settings |
| `auth/token-expired` | INFO | Token expired (normal) | Trigger refresh |
| `auth/too-many-requests` | WARNING | Rate limit hit | Possible attack |
| `PERMISSION_DENIED` | ERROR | Security Rules denied access | Check rules and user permissions |

### B. Error Codes

| Code | Name | Description | Resolution |
|------|------|-------------|------------|
| auth/invalid-email | Invalid Email | Email address malformed | Validate email format client-side |
| auth/user-disabled | User Disabled | Account disabled by admin | Re-enable in Firebase Console |
| auth/user-not-found | User Not Found | No user with that email | Check typos or create account |
| auth/wrong-password | Wrong Password | Incorrect password | Retry or reset password |
| auth/email-already-in-use | Email In Use | Email already registered | Use existing account or different email |
| auth/operation-not-allowed | Not Allowed | Provider not enabled | Enable provider in Console |
| auth/weak-password | Weak Password | Password too simple | Require 8+ chars, complexity |
| auth/network-request-failed | Network Error | Connection issue | Check App Check, network |
| auth/too-many-requests | Rate Limited | Too many attempts | Wait and retry, check for attack |
| auth/popup-blocked | Popup Blocked | Browser blocked popup | Use redirect flow or allow popups |
| auth/popup-closed-by-user | Popup Closed | User closed popup | Inform user to complete flow |

### C. Performance Baselines

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Auth Success Rate | > 99.5% | < 99% | < 95% |
| Auth Latency (p50) | < 200ms | > 500ms | > 1000ms |
| Auth Latency (p95) | < 500ms | > 1000ms | > 2000ms |
| Token Refresh Success | > 99.9% | < 99.5% | < 99% |
| Token Refresh Latency | < 100ms | > 300ms | > 500ms |
| Security Rules Denial Rate | < 1% | > 5% | > 10% |
| App Check Pass Rate | > 98% | < 95% | < 90% |
| OAuth Sign-In Success | > 95% | < 90% | < 80% |

---

**Document Version**: 1.0  
**Last Reviewed**: December 26, 2025  
**Next Review**: January 26, 2026  
**Owner**: Platform Engineering Team
