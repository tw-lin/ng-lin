# Reliability & Observability Gaps

> **Category**: Reliability, Monitoring, Resilience  
> **Priority Range**: P1-P3  
> **Total Gaps**: 11

---

## GAP-020: Distributed Tracing
**Priority**: P1  
**Effort**: 3 weeks  
**Value**: High  
**Dependencies**: None

### What It Is
Request flow tracking across microservices with latency analysis, bottleneck detection, and trace correlation.

### Why It Matters
- Debug distributed system issues
- Identify performance bottlenecks
- Understand service dependencies
- Measure end-to-end latency

### Current State
❌ **Missing**: No distributed tracing  
- Cannot trace requests across services
- Difficult to debug latency issues
- No visibility into service dependencies
- Manual correlation of logs

### Firebase Implementation Approach
**Solution**: OpenTelemetry + Cloud Trace

```typescript
// OpenTelemetry setup for Cloud Functions
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { TraceExporter } from '@google-cloud/opentelemetry-cloud-trace-exporter';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

// Initialize tracer
const provider = new NodeTracerProvider({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'ng-lin',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0'
  })
});

provider.addSpanProcessor(
  new BatchSpanProcessor(new TraceExporter())
);

provider.register();

// Auto-instrument HTTP, Firestore, etc.
registerInstrumentations({
  instrumentations: [
    getNodeAutoInstrumentations()
  ]
});

// Manual span creation
import { trace } from '@opentelemetry/api';

async function processTask(taskId: string): Promise<void> {
  const tracer = trace.getTracer('task-service');
  const span = tracer.startSpan('processTask', {
    attributes: {
      'task.id': taskId,
      'service.name': 'task-processor'
    }
  });
  
  try {
    // Business logic
    await span.inContext(async () => {
      const task = await fetchTask(taskId); // Auto-traced
      await updateTask(task); // Auto-traced
    });
    
    span.setStatus({ code: SpanStatusCode.OK });
  } catch (error) {
    span.recordException(error);
    span.setStatus({ 
      code: SpanStatusCode.ERROR,
      message: error.message 
    });
    throw error;
  } finally {
    span.end();
  }
}
```

### Dashboard Setup
- Cloud Trace console for trace visualization
- Latency percentiles (p50, p95, p99)
- Service dependency graph
- Error rate by service

### Success Metrics
- 100% of requests traced
- <1% trace sampling overhead
- Trace retention for 7 days
- p99 latency < 2 seconds

---

## GAP-021: Enhanced Circuit Breaker
**Priority**: P1  
**Effort**: 1 week  
**Value**: High  
**Dependencies**: None

### What It Is
Prevent cascading failures with exponential backoff, fallback responses, health monitoring, and auto-recovery.

### Why It Matters
- Prevent cascading failures
- Graceful degradation
- Automatic recovery
- Protect dependent services

### Current State
⚠️ **Partial**: Basic retry logic exists  
- Manual retries in some services
- No exponential backoff
- No circuit breaker state machine
- No fallback strategies

### Firebase Implementation Approach
**Solution**: Polly-style circuit breaker in TypeScript

```typescript
// Circuit breaker implementation
enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private nextAttemptTime = 0;
  
  constructor(
    private config: {
      failureThreshold: number; // Open after N failures
      successThreshold: number; // Close after N successes
      timeout: number; // Stay open for N ms
    }
  ) {}
  
  async execute<T>(
    operation: () => Promise<T>,
    fallback?: () => T
  ): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        // Still in timeout period
        if (fallback) return fallback();
        throw new Error('Circuit breaker is OPEN');
      }
      // Timeout expired, transition to half-open
      this.state = CircuitState.HALF_OPEN;
    }
    
    try {
      const result = await this.executeWithTimeout(operation);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      if (fallback) return fallback();
      throw error;
    }
  }
  
  private async executeWithTimeout<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000)
      )
    ]) as Promise<T>;
  }
  
  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
      }
    }
  }
  
  private onFailure(): void {
    this.failureCount++;
    this.successCount = 0;
    
    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = Date.now() + this.config.timeout;
    }
  }
}

// Usage in webhook delivery
const webhookCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000 // 1 minute
});

async function deliverWebhook(url: string, payload: any): Promise<void> {
  await webhookCircuitBreaker.execute(
    async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    },
    () => {
      // Fallback: Log failure and queue for retry
      console.warn(`Webhook delivery failed (circuit open): ${url}`);
      enqueueForRetry(url, payload);
    }
  );
}
```

### Success Metrics
- Zero cascading failures
- 95% uptime for dependent services
- Circuit breaker triggers logged
- Automatic recovery in <60s

---

## GAP-022: Observability Dashboard
**Priority**: P1  
**Effort**: 2 weeks  
**Value**: High  
**Dependencies**: GAP-020 (Distributed Tracing)

### What It Is
Centralized metrics, logs, and traces with alerting, dashboards, and SLI/SLO tracking.

### Why It Matters
- Single pane of glass for system health
- Proactive issue detection
- Data-driven decisions
- Team collaboration

### Current State
⚠️ **Partial**: Firebase console + Cloud Logging  
- Separate consoles for different services
- No unified dashboard
- Basic metrics only
- No SLO tracking

### Firebase Implementation Approach
**Solution**: Cloud Monitoring + Custom Dashboards

```typescript
// Custom metrics export
import { Monitoring } from '@google-cloud/monitoring';

class MetricsService {
  private monitoring: Monitoring;
  
  async recordCustomMetric(
    metricType: string,
    value: number,
    labels: Record<string, string> = {}
  ): Promise<void> {
    const timeSeries = {
      metric: {
        type: `custom.googleapis.com/${metricType}`,
        labels
      },
      resource: {
        type: 'cloud_function',
        labels: {
          function_name: process.env.FUNCTION_NAME,
          region: process.env.FUNCTION_REGION
        }
      },
      points: [{
        interval: {
          endTime: { seconds: Date.now() / 1000 }
        },
        value: { doubleValue: value }
      }]
    };
    
    await this.monitoring.createTimeSeries({
      name: this.monitoring.projectPath(projectId),
      timeSeries: [timeSeries]
    });
  }
}

// Usage examples
await metrics.recordCustomMetric('task/created', 1, {
  blueprint_id: blueprintId,
  status: 'pending'
});

await metrics.recordCustomMetric('api/latency', latencyMs, {
  endpoint: '/api/tasks',
  method: 'GET'
});
```

### Dashboard Configuration
```json
// Cloud Monitoring dashboard JSON
{
  "displayName": "ng-lin System Overview",
  "dashboardFilters": [],
  "gridLayout": {
    "widgets": [
      {
        "title": "API Requests per Minute",
        "xyChart": {
          "dataSets": [{
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "metric.type=\"cloudfunctions.googleapis.com/function/execution_count\""
              }
            }
          }]
        }
      },
      {
        "title": "Error Rate",
        "scorecard": {
          "timeSeriesQuery": {
            "timeSeriesFilter": {
              "filter": "metric.type=\"logging.googleapis.com/log_entry_count\" severity=\"ERROR\""
            }
          }
        }
      },
      {
        "title": "p99 Latency",
        "xyChart": {
          "dataSets": [{
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "metric.type=\"cloudfunctions.googleapis.com/function/execution_times\"",
                "aggregation": {
                  "alignmentPeriod": "60s",
                  "perSeriesAligner": "ALIGN_DELTA",
                  "crossSeriesReducer": "REDUCE_PERCENTILE_99"
                }
              }
            }
          }]
        }
      }
    ]
  }
}
```

### Alerting Policies
```typescript
// Alert policy configuration
const alertPolicies = [
  {
    displayName: 'High Error Rate',
    conditions: [{
      displayName: 'Error rate > 5%',
      conditionThreshold: {
        filter: 'metric.type="logging.googleapis.com/log_entry_count" severity="ERROR"',
        comparison: 'COMPARISON_GT',
        thresholdValue: 0.05,
        duration: '300s'
      }
    }],
    notificationChannels: [emailChannelId, slackChannelId]
  },
  {
    displayName: 'High Latency',
    conditions: [{
      displayName: 'p99 latency > 2s',
      conditionThreshold: {
        filter: 'metric.type="cloudfunctions.googleapis.com/function/execution_times"',
        comparison: 'COMPARISON_GT',
        thresholdValue: 2000,
        aggregations: [{
          alignmentPeriod: '60s',
          perSeriesAligner: 'ALIGN_DELTA',
          crossSeriesReducer: 'REDUCE_PERCENTILE_99'
        }]
      }
    }]
  }
];
```

### Success Metrics
- Single dashboard for all metrics
- <5 min alert response time
- 100% critical alerts delivered
- Team adoption > 80%

---

## GAP-023: Service Level Objectives (SLOs)
**Priority**: P1  
**Effort**: 1 week  
**Value**: High  
**Dependencies**: GAP-022 (Observability)

### What It Is
SLO definition for availability, latency, and error rate with error budgets and burn rate alerting.

### Why It Matters
- Quantifiable reliability targets
- Risk management via error budgets
- Balance velocity vs reliability
- Stakeholder communication

### Current State
❌ **Missing**: No defined SLOs  
- No reliability targets
- No error budget tracking
- No burn rate alerting
- Reactive incident response

### Firebase Implementation Approach
**Solution**: Cloud Monitoring SLO + Error Budget alerts

```yaml
# SLO definitions
slos:
  - name: api-availability
    description: API requests succeed (non-5xx)
    target: 99.9% # 43 minutes downtime per month
    window: 30d
    
  - name: api-latency
    description: 95% of requests complete in <1s
    target: 95%
    threshold: 1000ms
    window: 30d
    
  - name: error-rate
    description: Error rate below 1%
    target: 99%
    window: 7d
```

```typescript
// SLO tracking service
class SLOTracker {
  async calculateErrorBudget(
    sloName: string,
    target: number,
    windowDays: number
  ): Promise<{
    budgetRemaining: number;
    budgetUsed: number;
    status: 'healthy' | 'warning' | 'critical';
  }> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - windowDays * 24 * 60 * 60 * 1000);
    
    const totalRequests = await this.getMetric('total_requests', startTime, endTime);
    const successRequests = await this.getMetric('success_requests', startTime, endTime);
    
    const actualSLI = successRequests / totalRequests;
    const errorBudget = 1 - target;
    const budgetUsed = (1 - actualSLI) / errorBudget;
    
    return {
      budgetRemaining: Math.max(0, 1 - budgetUsed),
      budgetUsed,
      status: budgetUsed > 0.9 ? 'critical' : 
              budgetUsed > 0.7 ? 'warning' : 'healthy'
    };
  }
  
  async checkBurnRate(sloName: string): Promise<void> {
    // Fast burn: 5% budget in 1 hour (disaster)
    const fastBurn = await this.calculateErrorBudget(sloName, 0.999, 1/24);
    if (fastBurn.budgetUsed > 0.05) {
      await this.alertCritical(`Fast burn detected for ${sloName}`);
    }
    
    // Slow burn: 50% budget in 7 days (concerning)
    const slowBurn = await this.calculateErrorBudget(sloName, 0.999, 7);
    if (slowBurn.budgetUsed > 0.5) {
      await this.alertWarning(`Slow burn detected for ${sloName}`);
    }
  }
}
```

### Dashboard Visualization
- Error budget remaining gauge
- Burn rate chart (1h, 1d, 7d, 30d)
- SLO compliance percentage
- Historical trends

### Success Metrics
- 3 SLOs defined and tracked
- Error budget visible to team
- <10% SLO violations per quarter
- Error budget-driven decisions

---

## GAP-024: Health Check Endpoints
**Priority**: P2  
**Effort**: 3 days  
**Value**: Medium  
**Dependencies**: None

### What It Is
Standardized health check endpoints for uptime monitoring, dependency checks, and readiness probes.

### Why It Matters
- Automated uptime monitoring
- Load balancer integration
- Dependency health visibility
- Incident detection

### Current State
❌ **Missing**: No health endpoints  
- Cannot monitor service health
- No automated uptime checks
- Manual dependency verification
- No readiness signals

### Firebase Implementation Approach
**Solution**: Dedicated health check Cloud Function

```typescript
// Health check endpoint
export const healthCheck = onRequest(async (req, res) => {
  const checks = await Promise.all([
    checkFirestore(),
    checkAuth(),
    checkStorage(),
    checkExternalAPIs()
  ]);
  
  const allHealthy = checks.every(c => c.healthy);
  const statusCode = allHealthy ? 200 : 503;
  
  res.status(statusCode).json({
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks: {
      firestore: checks[0],
      auth: checks[1],
      storage: checks[2],
      external: checks[3]
    }
  });
});

async function checkFirestore(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    await admin.firestore().collection('_health').doc('check').get();
    return {
      name: 'firestore',
      healthy: true,
      latency: Date.now() - start
    };
  } catch (error) {
    return {
      name: 'firestore',
      healthy: false,
      error: error.message
    };
  }
}
```

### External Monitoring Setup
- UptimeRobot or Pingdom for uptime monitoring
- 1-minute check interval
- Multi-region checks
- Slack/PagerDuty integration

### Success Metrics
- 99.9% uptime measured
- <30s incident detection
- <2% false positive rate
- Health dashboards available

---

## GAP-025: Disaster Recovery Plan
**Priority**: P2  
**Effort**: 2 weeks  
**Value**: Medium  
**Dependencies**: None

### What It Is
Multi-region replication, automated backups, point-in-time recovery, RTO/RPO targets, and failover procedures.

### Why It Matters
- Business continuity
- Data loss prevention
- Regulatory compliance
- Customer trust

### Current State
⚠️ **Partial**: Firebase auto-backup  
- Firestore automatic replication
- Daily backups via Firebase
- No documented recovery procedures
- No tested failover

### Enhancement Approach
**Solution**: Formalize DR procedures + testing

```yaml
# Disaster Recovery Targets
Recovery Time Objective (RTO): 4 hours
Recovery Point Objective (RPO): 1 hour

# Backup Strategy
- Firestore: Daily automated backups (30-day retention)
- Cloud Storage: Versioning enabled
- Secrets: Backup to Secrets Manager
- Configuration: Infrastructure as Code (Terraform)

# Multi-Region Setup
Primary: us-central1
Secondary: europe-west1
Failover: Automatic via Firebase
```

```typescript
// Backup verification script
async function verifyBackups(): Promise<void> {
  const backups = await admin.firestore().listBackups();
  
  const recentBackup = backups.find(b => 
    Date.now() - b.createTime.toMillis() < 25 * 60 * 60 * 1000 // 25 hours
  );
  
  if (!recentBackup) {
    await alertCritical('No recent Firestore backup found');
  }
  
  // Test restore to temporary location
  await testRestore(recentBackup);
}

// Failover procedure (documented)
async function failoverProcedure(): Promise<void> {
  // 1. Update DNS to point to secondary region
  await updateDNS('ng-lin.com', secondaryRegionIP);
  
  // 2. Promote read replica to primary (if applicable)
  // Not needed for Firestore (auto-replicates)
  
  // 3. Update application config
  await updateConfig({ primaryRegion: 'europe-west1' });
  
  // 4. Verify services healthy
  await runHealthChecks();
  
  // 5. Notify team
  await notifyTeam('Failover to europe-west1 completed');
}
```

### DR Testing Schedule
- Quarterly DR drill (full failover test)
- Monthly backup restore test
- Annual tabletop exercise

### Success Metrics
- RTO < 4 hours (measured)
- RPO < 1 hour (verified)
- 100% backup success rate
- Quarterly DR drills passed

---

## GAP-026: Chaos Engineering
**Priority**: P3  
**Effort**: 4+ weeks  
**Value**: Low (advanced practice)  
**Dependencies**: GAP-021 (Circuit Breaker), GAP-023 (SLOs)

### What It Is
Intentional failure injection to validate system resilience through game days and incident simulations.

### Why It Matters
- Validate resilience
- Discover weaknesses before production
- Build confidence in recovery
- Improve incident response

### Current State
❌ **Not Implemented**: No chaos testing  
- No failure injection
- No game days
- Untested resilience patterns
- Unknown failure modes

### Future Consideration
**When Needed**:
- After P1 reliability features deployed
- System complexity increases
- Multiple dependent services
- High uptime requirements

**Tools**: Chaos Monkey for Firebase, Gremlin

### Decision
🟢 **Defer**: Implement after basic reliability features (P1) are in place.

---

## GAP-027: Incident Management System
**Priority**: P2  
**Effort**: 2 weeks  
**Value**: Medium  
**Dependencies**: GAP-022 (Observability)

### What It Is
Formal incident response process with on-call rotation, runbooks, postmortems, and blameless culture.

### Why It Matters
- Faster incident resolution
- Knowledge sharing
- Continuous improvement
- Team coordination

### Current State
⚠️ **Informal**: Ad-hoc incident response  
- No on-call rotation
- No runbooks
- No postmortem process
- Reactive approach

### Implementation Approach
**Solution**: PagerDuty + Runbook documentation

```yaml
# Incident Response Runbooks
runbooks:
  - name: High Error Rate
    trigger: Error rate > 5% for 5 minutes
    steps:
      1. Check Cloud Logging for error messages
      2. Identify affected service/function
      3. Review recent deployments
      4. Rollback if deployment-related
      5. Engage on-call engineer if unresolved
      
  - name: Database Connection Failures
    trigger: Firestore connection errors
    steps:
      1. Check Firebase Status dashboard
      2. Verify network connectivity
      3. Check quota limits
      4. Review Security Rules
      5. Contact Firebase support if widespread
```

```typescript
// Incident tracking integration
class IncidentManager {
  async createIncident(
    severity: 'low' | 'medium' | 'high' | 'critical',
    title: string,
    description: string
  ): Promise<string> {
    // Create PagerDuty incident
    const incident = await pagerduty.createIncident({
      type: 'incident',
      title,
      body: { type: 'incident_body', details: description },
      urgency: severity === 'critical' ? 'high' : 'low',
      incident_key: `ng-lin-${Date.now()}`
    });
    
    // Log to Firestore for tracking
    await admin.firestore().collection('incidents').add({
      incidentId: incident.id,
      severity,
      title,
      description,
      status: 'investigating',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return incident.id;
  }
  
  async resolveIncident(
    incidentId: string,
    resolution: string
  ): Promise<void> {
    await pagerduty.resolveIncident(incidentId, resolution);
    
    await admin.firestore()
      .collection('incidents')
      .where('incidentId', '==', incidentId)
      .limit(1)
      .get()
      .then(snapshot => {
        snapshot.docs[0].ref.update({
          status: 'resolved',
          resolution,
          resolvedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
  }
}
```

### Postmortem Template
```markdown
# Incident Postmortem: [Title]

**Date**: YYYY-MM-DD
**Duration**: X hours
**Severity**: Critical/High/Medium/Low
**Impact**: X users affected, Y requests failed

## Timeline
- HH:MM - Initial alert
- HH:MM - Incident confirmed
- HH:MM - Root cause identified
- HH:MM - Fix deployed
- HH:MM - Incident resolved

## Root Cause
[Technical explanation of what caused the incident]

## Impact
- X users could not [action]
- Y requests failed with [error]
- $Z revenue loss (if applicable)

## Resolution
[What was done to resolve the incident]

## Action Items
- [ ] [Preventive action 1] - Owner: @person - Due: YYYY-MM-DD
- [ ] [Preventive action 2] - Owner: @person - Due: YYYY-MM-DD

## Lessons Learned
[What went well, what could be improved]
```

### Success Metrics
- <15 min mean time to detect (MTTD)
- <1 hour mean time to resolve (MTTR)
- 100% incidents have postmortems
- Zero repeat incidents

---

## GAP-028: Load Testing Infrastructure
**Priority**: P2  
**Effort**: 1 week  
**Value**: Medium  
**Dependencies**: None

### What It Is
Automated load testing to validate system capacity, identify bottlenecks, and establish performance baselines.

### Why It Matters
- Validate system capacity
- Identify bottlenecks before production
- Establish performance baselines
- Plan capacity

### Current State
❌ **Missing**: No load testing  
- Unknown system capacity
- No performance baseline
- Cannot validate scalability
- Reactive capacity planning

### Implementation Approach
**Solution**: k6 or Artillery for load testing

```javascript
// k6 load test script
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 200 },  // Ramp up to 200 users
    { duration: '5m', target: 200 },  // Stay at 200 users
    { duration: '2m', target: 0 }     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests under 1s
    http_req_failed: ['rate<0.01']      // <1% errors
  }
};

export default function() {
  // Test API endpoints
  let res = http.get('https://ng-lin.web.app/api/tasks');
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 1s': (r) => r.timings.duration < 1000
  });
  
  sleep(1);
}
```

### CI Integration
```yaml
# GitHub Actions workflow
name: Load Test
on:
  schedule:
    - cron: '0 2 * * 0' # Weekly on Sunday 2am
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run k6 test
        uses: grafana/k6-action@v0.3.0
        with:
          filename: loadtest.js
      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: k6-results
          path: results.json
```

### Success Metrics
- Capacity validated for 1000 concurrent users
- p95 latency < 1s under load
- <1% error rate under load
- Quarterly load tests passed

---

## GAP-029: Application Performance Monitoring (APM)
**Priority**: P2  
**Effort**: 1 week  
**Value**: Medium  
**Dependencies**: GAP-020 (Distributed Tracing)

### What It Is
Code-level performance monitoring with transaction tracing, N+1 query detection, and memory profiling.

### Why It Matters
- Identify code-level bottlenecks
- Detect N+1 query problems
- Memory leak detection
- Performance regression prevention

### Current State
⚠️ **Partial**: Firebase Performance SDK (frontend only)  
- Frontend performance tracked
- No backend APM
- No transaction tracing
- No N+1 detection

### Enhancement Approach
**Solution**: OpenTelemetry + Cloud Profiler

```typescript
// Automatic instrumentation setup
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const sdk = new NodeSDK({
  traceExporter: new TraceExporter(),
  instrumentations: [
    getNodeAutoInstrumentations({
      // Enable automatic instrumentation for:
      '@opentelemetry/instrumentation-http': {
        // HTTP client/server
      },
      '@opentelemetry/instrumentation-express': {
        // Express framework
      },
      '@google-cloud/firestore': {
        // Firestore queries (N+1 detection)
      }
    })
  ]
});

sdk.start();
```

### N+1 Query Detection
```typescript
// Custom Firestore instrumentation
class FirestoreInstrumentation {
  private queryCount = new Map<string, number>();
  
  wrapQuery(originalQuery: any): any {
    const tracer = trace.getTracer('firestore');
    
    return tracer.startActiveSpan('firestore.query', async (span) => {
      const collection = originalQuery.path;
      
      // Track queries per collection
      const count = this.queryCount.get(collection) || 0;
      this.queryCount.set(collection, count + 1);
      
      // Alert if >10 queries to same collection in single request
      if (count > 10) {
        span.setAttribute('n+1.detected', true);
        span.addEvent('Potential N+1 query detected', {
          collection,
          count: count + 1
        });
      }
      
      const result = await originalQuery.get();
      
      span.setAttributes({
        'db.system': 'firestore',
        'db.collection': collection,
        'db.documents.count': result.docs.length
      });
      
      span.end();
      return result;
    });
  }
}
```

### Success Metrics
- 100% of backend functions instrumented
- N+1 queries detected and fixed
- Zero memory leaks
- Performance baseline established

---

## GAP-030: Blue-Green Deployment
**Priority**: P3  
**Effort**: 2 weeks  
**Value**: Low (Firebase handles this)  
**Dependencies**: None

### What It Is
Two identical production environments for instant switch, rollback, and zero-downtime deployments.

### Why It Matters
- Zero-downtime deployments
- Instant rollback capability
- Safe deployment validation
- Reduced deployment risk

### Current State
✅ **Not Needed**: Firebase Hosting handles this  
- Firebase Hosting has built-in canary releases
- Automatic rollback on errors
- Zero-downtime deployments native

### Decision
🟢 **Not Required**: Firebase provides this capability out-of-the-box.

---

## Summary

### Priority Breakdown
- **P1**: 4 gaps (Distributed Tracing, Circuit Breaker, Observability, SLOs) - Implement Q1 2026
- **P2**: 5 gaps (Health Checks, DR, Incident Mgmt, Load Testing, APM) - Plan Q2-Q3 2026
- **P3**: 2 gaps (Chaos Engineering, Blue-Green) - Defer or not needed

### Implementation Timeline
1. **Q1 2026** (10 weeks):
   - Week 1-3: Distributed Tracing
   - Week 4: Circuit Breaker
   - Week 5-6: Observability Dashboard
   - Week 7: SLOs
   - Week 8-10: Health Checks + Testing

2. **Q2 2026** (7 weeks):
   - Week 1-2: Disaster Recovery
   - Week 3-4: Incident Management
   - Week 5: Load Testing
   - Week 6-7: APM

### Estimated Costs (P1+P2)
- **Cloud Monitoring**: Included in Firebase
- **Cloud Trace**: $0.50 per million spans
- **PagerDuty**: $21/user/month
- **Load Testing**: $0 (k6 open source)
- **Total**: ~$50-150/month additional

---

**Status**: ✅ Analysis Complete  
**Next Review**: 2026-03-25
