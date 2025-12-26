# Feature & Product Gaps

> **Category**: Product Features, User Engagement, Business Value  
> **Priority Range**: P1-P3  
> **Total Gaps**: 12

---

## GAP-031: Notification System
**Priority**: P1  
**Effort**: 3 weeks  
**Value**: High  
**Dependencies**: GAP-014 (Async Jobs), GAP-018 (Message Queue)

### What It Is
Multi-channel notification delivery (web, email, mobile push) with subscription preferences, thread-based grouping, and delivery tracking.

### Why It Matters
- Keep users engaged
- Real-time collaboration
- Reduce email overload
- Improve user experience

### Current State
❌ **Missing**: No notification system  
- No in-app notifications
- No email notifications
- No push notifications
- Users must manually check updates

### Firebase Implementation Approach
**Solution**: Firebase Cloud Messaging (FCM) + SendGrid + Firestore

```typescript
// Notification service
interface Notification {
  id: string;
  userId: string;
  type: 'task_assigned' | 'comment_added' | 'status_changed' | 'mention';
  title: string;
  body: string;
  actionUrl: string;
  read: boolean;
  createdAt: Timestamp;
  channels: ('web' | 'email' | 'push')[];
}

interface NotificationPreferences {
  userId: string;
  email: {
    taskAssigned: boolean;
    comments: boolean;
    mentions: boolean;
    dailyDigest: boolean;
  };
  push: {
    taskAssigned: boolean;
    comments: boolean;
    mentions: boolean;
  };
  web: {
    all: boolean;
  };
}

// Notification delivery service
class NotificationService {
  async notify(event: {
    userId: string;
    type: string;
    title: string;
    body: string;
    actionUrl: string;
    metadata: any;
  }): Promise<void> {
    // 1. Get user preferences
    const prefs = await this.getPreferences(event.userId);
    const channels = this.determineChannels(event.type, prefs);
    
    // 2. Create notification record
    const notification = await admin.firestore()
      .collection('notifications')
      .add({
        userId: event.userId,
        type: event.type,
        title: event.title,
        body: event.body,
        actionUrl: event.actionUrl,
        metadata: event.metadata,
        read: false,
        channels,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    
    // 3. Deliver via selected channels
    const deliveries = channels.map(channel => {
      switch (channel) {
        case 'web':
          return this.deliverWeb(event.userId, notification.id);
        case 'email':
          return this.deliverEmail(event);
        case 'push':
          return this.deliverPush(event);
      }
    });
    
    await Promise.allSettled(deliveries);
  }
  
  private async deliverWeb(
    userId: string,
    notificationId: string
  ): Promise<void> {
    // Firestore real-time update (automatic)
    // Client subscribes to: /notifications where userId == current user
  }
  
  private async deliverEmail(event: any): Promise<void> {
    const user = await admin.auth().getUser(event.userId);
    
    await sendgrid.send({
      to: user.email,
      from: 'notifications@ng-lin.com',
      subject: event.title,
      html: this.renderEmailTemplate(event)
    });
  }
  
  private async deliverPush(event: any): Promise<void> {
    // Get FCM tokens for user
    const tokens = await this.getUserFCMTokens(event.userId);
    
    if (tokens.length === 0) return;
    
    await admin.messaging().sendMulticast({
      tokens,
      notification: {
        title: event.title,
        body: event.body
      },
      data: {
        actionUrl: event.actionUrl,
        type: event.type
      },
      webpush: {
        fcmOptions: {
          link: event.actionUrl
        }
      }
    });
  }
}

// Event bus integration
eventBus.subscribe('task.assigned', async (event) => {
  await notificationService.notify({
    userId: event.data.assignedTo,
    type: 'task_assigned',
    title: 'New Task Assigned',
    body: `You've been assigned: ${event.data.title}`,
    actionUrl: `/tasks/${event.data.id}`,
    metadata: { taskId: event.data.id }
  });
});
```

### Frontend Integration
```typescript
// Angular component for notifications
@Component({
  selector: 'app-notification-center',
  standalone: true,
  template: `
    <nz-badge [nzCount]="unreadCount()">
      <button nz-button (click)="togglePanel()">
        <i nz-icon nzType="bell"></i>
      </button>
    </nz-badge>
    
    <nz-drawer
      [nzVisible]="panelOpen()"
      nzTitle="Notifications"
      (nzOnClose)="togglePanel()">
      @for (notification of notifications(); track notification.id) {
        <div class="notification-item" 
             [class.unread]="!notification.read"
             (click)="handleNotificationClick(notification)">
          <h4>{{ notification.title }}</h4>
          <p>{{ notification.body }}</p>
          <span>{{ notification.createdAt | date:'short' }}</span>
        </div>
      }
    </nz-drawer>
  `
})
export class NotificationCenterComponent {
  private notificationService = inject(NotificationService);
  
  notifications = signal<Notification[]>([]);
  panelOpen = signal(false);
  
  unreadCount = computed(() => 
    this.notifications().filter(n => !n.read).length
  );
  
  ngOnInit() {
    // Subscribe to real-time notifications
    this.notificationService.subscribeToNotifications()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(notifications => {
        this.notifications.set(notifications);
      });
  }
  
  async handleNotificationClick(notification: Notification) {
    await this.notificationService.markAsRead(notification.id);
    this.router.navigate([notification.actionUrl]);
  }
}
```

### Email Template
```html
<!-- Email notification template -->
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { background: #1890ff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>{{ title }}</h2>
    <p>{{ body }}</p>
    <a href="{{ actionUrl }}" class="button">View Details</a>
    <hr>
    <p><small>You can manage notification preferences in your settings.</small></p>
  </div>
</body>
</html>
```

### Success Metrics
- 95% notification delivery rate
- <30s delivery latency
- 70% user opt-in rate
- 40% notification click-through rate

---

## GAP-032: Search Engine Integration
**Priority**: P1  
**Effort**: 3 weeks  
**Value**: High  
**Dependencies**: None

### What It Is
Full-text search using Algolia or Typesense for tasks, users, blueprints with fuzzy matching, typo tolerance, and faceted search.

### Why It Matters
- Fast content discovery
- Better user experience
- Reduce support burden
- Enable advanced filtering

### Current State
❌ **Missing**: No search capability  
- Users must manually browse
- No filtering beyond basic queries
- Cannot search across entities
- Poor discoverability

### Firebase Implementation Approach
**Solution**: Algolia for managed search or Typesense self-hosted

```typescript
// Algolia integration
import algoliasearch from 'algoliasearch';

const algolia = algoliasearch(
  process.env.ALGOLIA_APP_ID,
  process.env.ALGOLIA_ADMIN_KEY
);

// Index management
const tasksIndex = algolia.initIndex('tasks');
const usersIndex = algolia.initIndex('users');
const blueprintsIndex = algolia.initIndex('blueprints');

// Indexing service
class SearchIndexer {
  async indexTask(task: Task): Promise<void> {
    await tasksIndex.saveObject({
      objectID: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      blueprintId: task.blueprintId,
      blueprintName: task.blueprintName,
      assigneeName: task.assigneeName,
      tags: task.tags || [],
      priority: task.priority,
      createdAt: task.createdAt.toMillis(),
      updatedAt: task.updatedAt.toMillis()
    });
  }
  
  async deleteTask(taskId: string): Promise<void> {
    await tasksIndex.deleteObject(taskId);
  }
  
  async reindexAll(): Promise<void> {
    // Bulk reindex from Firestore
    const tasks = await admin.firestore()
      .collection('tasks')
      .get();
    
    const objects = tasks.docs.map(doc => ({
      objectID: doc.id,
      ...doc.data()
    }));
    
    await tasksIndex.saveObjects(objects);
  }
}

// Event bus integration for real-time indexing
eventBus.subscribe('task.created', async (event) => {
  await searchIndexer.indexTask(event.data);
});

eventBus.subscribe('task.updated', async (event) => {
  await searchIndexer.indexTask(event.data);
});

eventBus.subscribe('task.deleted', async (event) => {
  await searchIndexer.deleteTask(event.data.id);
});
```

### Frontend Search Component
```typescript
// Angular search component
import { InstantSearch } from 'angular-instantsearch';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [InstantSearch],
  template: `
    <ais-instantsearch [config]="searchConfig">
      <ais-search-box placeholder="Search tasks, users, blueprints..."></ais-search-box>
      
      <ais-refinement-list attribute="status"></ais-refinement-list>
      <ais-refinement-list attribute="priority"></ais-refinement-list>
      <ais-refinement-list attribute="tags"></ais-refinement-list>
      
      <ais-hits>
        <ng-template let-hits="hits">
          @for (hit of hits; track hit.objectID) {
            <div class="search-result" (click)="navigateToTask(hit)">
              <h3>
                <ais-highlight attribute="title" [hit]="hit"></ais-highlight>
              </h3>
              <p>
                <ais-snippet attribute="description" [hit]="hit"></ais-snippet>
              </p>
              <div class="meta">
                <span class="status">{{ hit.status }}</span>
                <span class="blueprint">{{ hit.blueprintName }}</span>
              </div>
            </div>
          }
        </ng-template>
      </ais-hits>
      
      <ais-pagination></ais-pagination>
    </ais-instantsearch>
  `
})
export class SearchComponent {
  searchConfig = {
    indexName: 'tasks',
    searchClient: algoliasearch(
      environment.algolia.appId,
      environment.algolia.searchKey // Public search-only key
    )
  };
}
```

### Search Configuration
```typescript
// Configure search index
tasksIndex.setSettings({
  searchableAttributes: [
    'title',
    'description',
    'blueprintName',
    'assigneeName',
    'tags'
  ],
  attributesForFaceting: [
    'status',
    'priority',
    'blueprintId',
    'tags'
  ],
  customRanking: [
    'desc(updatedAt)',
    'desc(priority)'
  ],
  typoTolerance: true,
  minWordSizefor1Typo: 4,
  minWordSizefor2Typos: 8
});
```

### Success Metrics
- <50ms search latency (p95)
- 90% search query satisfaction
- 70% search usage rate
- 10x faster than manual browsing

### Cost Estimate
- **Algolia**: $0 (free tier: 10K records, 10K searches/month)
- **Typesense Cloud**: $35/month (self-hosted: $10-20/month Cloud Run)

---

## GAP-033: Activity Feed System
**Priority**: P2  
**Effort**: 2 weeks  
**Value**: Medium  
**Dependencies**: GAP-001 (Event Bus - already implemented)

### What It Is
Personalized activity timeline showing blueprint and task activities with real-time updates and event filtering.

### Why It Matters
- Increase user engagement
- Visibility into team activity
- Collaboration awareness
- Social features

### Current State
❌ **Missing**: No activity feed  
- Users don't see recent activities
- No collaboration visibility
- Must manually check for updates
- Reduced engagement

### Firebase Implementation Approach
**Solution**: Event Bus + Firestore + Real-time listeners

```typescript
// Activity feed data model
interface Activity {
  id: string;
  blueprintId: string;
  actorId: string;
  actorName: string;
  actorAvatar: string;
  type: 'task_created' | 'task_completed' | 'comment_added' | 'file_uploaded';
  entityType: 'task' | 'comment' | 'file';
  entityId: string;
  title: string;
  description: string;
  actionUrl: string;
  createdAt: Timestamp;
  visibility: 'public' | 'blueprint_members';
}

// Activity feed service
class ActivityFeedService {
  async createActivity(event: {
    blueprintId: string;
    actor: { id: string; name: string; avatar: string };
    type: string;
    entity: { type: string; id: string };
    title: string;
    description: string;
    actionUrl: string;
    visibility: 'public' | 'blueprint_members';
  }): Promise<void> {
    await admin.firestore().collection('activities').add({
      blueprintId: event.blueprintId,
      actorId: event.actor.id,
      actorName: event.actor.name,
      actorAvatar: event.actor.avatar,
      type: event.type,
      entityType: event.entity.type,
      entityId: event.entity.id,
      title: event.title,
      description: event.description,
      actionUrl: event.actionUrl,
      visibility: event.visibility,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  
  async getUserFeed(
    userId: string,
    limit: number = 20
  ): Promise<Activity[]> {
    // Get blueprints user is member of
    const blueprintIds = await this.getUserBlueprints(userId);
    
    const snapshot = await admin.firestore()
      .collection('activities')
      .where('blueprintId', 'in', blueprintIds.slice(0, 10)) // Firestore 'in' limit
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Activity));
  }
}

// Event bus integration
eventBus.subscribe('task.created', async (event) => {
  await activityFeedService.createActivity({
    blueprintId: event.blueprintId,
    actor: event.actor,
    type: 'task_created',
    entity: { type: 'task', id: event.data.id },
    title: `${event.actor.name} created a task`,
    description: event.data.title,
    actionUrl: `/tasks/${event.data.id}`,
    visibility: 'blueprint_members'
  });
});

eventBus.subscribe('task.completed', async (event) => {
  await activityFeedService.createActivity({
    blueprintId: event.blueprintId,
    actor: event.actor,
    type: 'task_completed',
    entity: { type: 'task', id: event.data.id },
    title: `${event.actor.name} completed a task`,
    description: event.data.title,
    actionUrl: `/tasks/${event.data.id}`,
    visibility: 'blueprint_members'
  });
});
```

### Frontend Activity Feed Component
```typescript
@Component({
  selector: 'app-activity-feed',
  standalone: true,
  template: `
    <div class="activity-feed">
      <h2>Recent Activity</h2>
      
      @if (loading()) {
        <nz-spin />
      } @else {
        @for (activity of activities(); track activity.id) {
          <div class="activity-item">
            <nz-avatar [nzSrc]="activity.actorAvatar"></nz-avatar>
            <div class="activity-content">
              <h4>{{ activity.title }}</h4>
              <p>{{ activity.description }}</p>
              <span class="timestamp">
                {{ activity.createdAt | timeAgo }}
              </span>
            </div>
            <a [routerLink]="activity.actionUrl" class="view-link">
              View <i nz-icon nzType="arrow-right"></i>
            </a>
          </div>
        }
      }
      
      @if (hasMore()) {
        <button nz-button (click)="loadMore()">Load More</button>
      }
    </div>
  `
})
export class ActivityFeedComponent {
  private feedService = inject(ActivityFeedService);
  
  activities = signal<Activity[]>([]);
  loading = signal(true);
  hasMore = signal(true);
  
  async ngOnInit() {
    await this.loadActivities();
    
    // Real-time updates
    this.feedService.subscribeToFeed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(newActivity => {
        this.activities.update(list => [newActivity, ...list]);
      });
  }
  
  async loadActivities() {
    this.loading.set(true);
    const feed = await this.feedService.getUserFeed(20);
    this.activities.set(feed);
    this.hasMore.set(feed.length === 20);
    this.loading.set(false);
  }
  
  async loadMore() {
    const lastActivity = this.activities()[this.activities().length - 1];
    const moreFeed = await this.feedService.getUserFeed(20, lastActivity.createdAt);
    this.activities.update(list => [...list, ...moreFeed]);
    this.hasMore.set(moreFeed.length === 20);
  }
}
```

### Success Metrics
- 60% daily active users view feed
- 30% average click-through rate
- Real-time updates <2s latency
- 80% user satisfaction

---

## GAP-034: Webhook Delivery Enhancement
**Priority**: P2  
**Effort**: 2 weeks  
**Value**: Medium  
**Dependencies**: GAP-021 (Circuit Breaker)

### What It Is
Reliable webhook delivery with retry logic, exponential backoff, signature verification, delivery logs, and replay capability.

### Why It Matters
- Partner integrations
- Real-time data sync
- Automation workflows
- Third-party notifications

### Current State
⚠️ **Partial**: Basic webhook implementation  
- No retry logic
- No delivery tracking
- No signature verification
- Manual troubleshooting

### Enhancement Approach
**Solution**: Enhance existing webhook system

```typescript
// Enhanced webhook delivery service
interface WebhookEndpoint {
  id: string;
  blueprintId: string;
  url: string;
  secret: string;
  events: string[];
  enabled: boolean;
  metadata: any;
}

interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: any;
  url: string;
  attempt: number;
  status: 'pending' | 'success' | 'failed';
  statusCode?: number;
  response?: string;
  error?: string;
  createdAt: Timestamp;
  deliveredAt?: Timestamp;
}

class WebhookDeliveryService {
  async deliverWebhook(
    webhook: WebhookEndpoint,
    event: any
  ): Promise<void> {
    const delivery = await this.createDelivery(webhook, event);
    
    try {
      await this.attemptDelivery(webhook, event, delivery.id, 1);
    } catch (error) {
      // Schedule retry
      await this.scheduleRetry(delivery.id, 1);
    }
  }
  
  private async attemptDelivery(
    webhook: WebhookEndpoint,
    event: any,
    deliveryId: string,
    attempt: number
  ): Promise<void> {
    const signature = this.generateSignature(webhook.secret, event);
    
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Delivery-ID': deliveryId,
        'X-Webhook-Event': event.type
      },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(30000) // 30s timeout
    });
    
    await this.recordDelivery(deliveryId, {
      attempt,
      status: response.ok ? 'success' : 'failed',
      statusCode: response.status,
      response: await response.text(),
      deliveredAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  }
  
  private generateSignature(secret: string, payload: any): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return `sha256=${hmac.digest('hex')}`;
  }
  
  private async scheduleRetry(
    deliveryId: string,
    attempt: number
  ): Promise<void> {
    if (attempt >= 5) {
      // Max retries reached, send to DLQ
      await this.sendToDeadLetterQueue(deliveryId);
      return;
    }
    
    // Exponential backoff: 1min, 5min, 25min, 2h, 10h
    const delays = [60, 300, 1500, 7200, 36000];
    const delaySeconds = delays[attempt - 1];
    
    await cloudTasks.createTask({
      scheduleTime: new Date(Date.now() + delaySeconds * 1000),
      httpRequest: {
        url: `${functionsUrl}/retryWebhook`,
        body: Buffer.from(JSON.stringify({
          deliveryId,
          attempt: attempt + 1
        })).toString('base64')
      }
    });
  }
}

// Event bus integration
eventBus.subscribe('*', async (event) => {
  const webhooks = await getWebhooksForEvent(event.type, event.blueprintId);
  
  await Promise.all(
    webhooks.map(webhook => 
      webhookDeliveryService.deliverWebhook(webhook, event)
    )
  );
});
```

### Webhook Management UI
```typescript
@Component({
  selector: 'app-webhook-config',
  template: `
    <nz-card nzTitle="Webhook Endpoints">
      <button nz-button nzType="primary" (click)="addWebhook()">
        Add Webhook
      </button>
      
      <nz-table [nzData]="webhooks()" [nzLoading]="loading()">
        <thead>
          <tr>
            <th>URL</th>
            <th>Events</th>
            <th>Status</th>
            <th>Last Delivery</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (webhook of webhooks(); track webhook.id) {
            <tr>
              <td>{{ webhook.url }}</td>
              <td>
                <nz-tag *ngFor="let event of webhook.events">
                  {{ event }}
                </nz-tag>
              </td>
              <td>
                <nz-badge 
                  [nzStatus]="webhook.enabled ? 'success' : 'default'"
                  [nzText]="webhook.enabled ? 'Enabled' : 'Disabled'">
                </nz-badge>
              </td>
              <td>{{ webhook.lastDelivery | date:'short' }}</td>
              <td>
                <button nz-button (click)="viewDeliveries(webhook)">
                  Deliveries
                </button>
                <button nz-button (click)="testWebhook(webhook)">
                  Test
                </button>
                <button nz-button nzDanger (click)="deleteWebhook(webhook)">
                  Delete
                </button>
              </td>
            </tr>
          }
        </tbody>
      </nz-table>
    </nz-card>
  `
})
export class WebhookConfigComponent {
  // ... implementation
}
```

### Success Metrics
- 99.9% webhook delivery rate
- 95% first-attempt success
- <30s delivery latency (p95)
- 100% signature verification

---

## GAP-035: User Profile & Settings Enhancement
**Priority**: P3  
**Effort**: 1 week  
**Value**: Low  
**Dependencies**: None

### What It Is
Enhanced user profile with bio, avatar, social links, preferences, security settings, and activity privacy.

### Why It Matters
- Personalization
- User identity
- Trust building
- Team collaboration

### Current State
⚠️ **Partial**: Basic Firebase Auth profile  
- displayName and email only
- No custom fields
- Limited preferences
- No social features

### Enhancement Approach
**Solution**: Extended user profile in Firestore

```typescript
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  avatar: string;
  bio: string;
  location: string;
  website: string;
  socialLinks: {
    github?: string;
    linkedin?: string;
    twitter?: string;
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    emailDigest: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'members_only';
    activityVisibility: 'public' | 'members_only' | 'private';
  };
  stats: {
    tasksCompleted: number;
    blueprintsCreated: number;
    commentsPosted: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Decision
🟢 **Defer**: Focus on core features first. Enhance profiles after P1/P2 gaps are addressed.

---

## GAP-036: Billing & Subscription System
**Priority**: P2  
**Effort**: 4 weeks  
**Value**: Medium (if monetization planned)  
**Dependencies**: None

### What It Is
Subscription plan management, usage-based billing, invoice generation, and payment processing via Stripe.

### Why It Matters
- Revenue generation
- Tiered access control
- Usage tracking
- Professional billing

### Current State
❌ **Not Implemented**: No billing system  
- No paid plans
- No usage tracking
- No payment processing
- Free access only

### Firebase Implementation Approach
**Solution**: Stripe + Firebase Extensions

```bash
# Install Stripe Firebase Extension
firebase ext:install stripe/firestore-stripe-payments
```

```typescript
// Subscription management
interface SubscriptionPlan {
  id: string;
  name: 'free' | 'pro' | 'enterprise';
  price: number;
  interval: 'month' | 'year';
  features: {
    blueprints: number;
    users: number;
    storage: number; // GB
    apiCalls: number; // per month
  };
}

class BillingService {
  async createCheckoutSession(
    userId: string,
    planId: string
  ): Promise<string> {
    const sessionRef = await admin.firestore()
      .collection('customers')
      .doc(userId)
      .collection('checkout_sessions')
      .add({
        price: planId,
        success_url: `${appUrl}/billing/success`,
        cancel_url: `${appUrl}/billing/cancel`,
        mode: 'subscription'
      });
    
    // Extension creates Stripe checkout session
    const session = await sessionRef.get();
    return session.data().url;
  }
  
  async getSubscriptionStatus(userId: string): Promise<{
    status: string;
    plan: string;
    currentPeriodEnd: Date;
  }> {
    const subscriptions = await admin.firestore()
      .collection('customers')
      .doc(userId)
      .collection('subscriptions')
      .where('status', 'in', ['active', 'trialing'])
      .get();
    
    if (subscriptions.empty) {
      return { status: 'free', plan: 'free', currentPeriodEnd: null };
    }
    
    const sub = subscriptions.docs[0].data();
    return {
      status: sub.status,
      plan: sub.plan,
      currentPeriodEnd: new Date(sub.current_period_end.seconds * 1000)
    };
  }
}
```

### Usage Tracking
```typescript
// Track API usage for billing
class UsageTracker {
  async recordUsage(
    userId: string,
    metric: 'api_calls' | 'storage' | 'users',
    quantity: number = 1
  ): Promise<void> {
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    await admin.firestore()
      .collection('usage')
      .doc(`${userId}_${month}`)
      .set({
        userId,
        month,
        [metric]: admin.firestore.FieldValue.increment(quantity),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
  }
  
  async checkQuota(
    userId: string,
    metric: string
  ): Promise<boolean> {
    const subscription = await billingService.getSubscriptionStatus(userId);
    const plan = subscriptionPlans[subscription.plan];
    
    const month = new Date().toISOString().slice(0, 7);
    const usage = await admin.firestore()
      .collection('usage')
      .doc(`${userId}_${month}`)
      .get();
    
    const currentUsage = usage.data()?.[metric] || 0;
    const quota = plan.features[metric];
    
    return currentUsage < quota;
  }
}
```

### Success Metrics (if implemented)
- 10% free-to-paid conversion
- <5% churn rate
- 99.99% payment success rate
- <24h invoice delivery

### Decision
⚠️ **Conditional**: Only implement if monetization is planned. Defer otherwise.

---

## GAP-037: Mobile App (iOS/Android)
**Priority**: P3  
**Effort**: 12+ weeks  
**Value**: Low (web-first strategy)  
**Dependencies**: GAP-031 (Notifications)

### What It Is
Native mobile apps for iOS and Android with push notifications, offline support, and mobile-optimized UI.

### Why It Matters
- Mobile accessibility
- Push notifications
- Offline capability
- Native experience

### Current State
✅ **Not Needed**: Progressive Web App (PWA) sufficient  
- Responsive web design works on mobile
- PWA installable on mobile
- Web push notifications available
- Lower development/maintenance cost

### Future Consideration
**When Needed**:
- >50% mobile traffic
- Native features required (camera, GPS)
- App store presence important
- Offline-first critical

**Approach**: Flutter or React Native for cross-platform

### Decision
🟢 **Defer Indefinitely**: PWA provides 80% of native app benefits with 20% of the cost.

---

## GAP-038: AI/ML Features
**Priority**: P3  
**Effort**: 8+ weeks  
**Value**: Low (nice-to-have)  
**Dependencies**: None

### What It Is
AI-powered features like task recommendations, smart assignment, progress prediction, and anomaly detection.

### Why It Matters
- Automation
- Intelligence
- Productivity boost
- Competitive advantage

### Current State
❌ **Not Implemented**: No AI/ML features  
- Manual task management
- No predictive insights
- No automation recommendations

### Future Consideration
**Potential Features**:
- Smart task assignment (ML-based)
- Progress prediction (time series)
- Anomaly detection (delays, bottlenecks)
- Natural language task creation
- Automated status updates

**Firebase Approach**: Vertex AI + Cloud Functions

### Decision
🟢 **Defer**: Focus on core functionality first. AI features are enhancement, not requirement.

---

## GAP-039: Advanced Analytics Dashboard
**Priority**: P2  
**Effort**: 3 weeks  
**Value**: Medium  
**Dependencies**: None

### What It Is
Business intelligence dashboard with insights, reports, charts, and data visualization for project metrics.

### Why It Matters
- Data-driven decisions
- Performance visibility
- Trend analysis
- Management reporting

### Current State
⚠️ **Partial**: Basic Firebase Analytics  
- No custom dashboards
- No business metrics
- No trend analysis
- Limited reporting

### Implementation Approach
**Solution**: Firebase Analytics + Custom Dashboard

```typescript
// Analytics service
class AnalyticsService {
  async getProjectMetrics(blueprintId: string, timeRange: string): Promise<{
    taskCompletion: number;
    avgCompletionTime: number;
    activeUsers: number;
    productivity: number;
  }> {
    const startDate = this.getStartDate(timeRange);
    
    const tasks = await admin.firestore()
      .collection('tasks')
      .where('blueprintId', '==', blueprintId)
      .where('createdAt', '>=', startDate)
      .get();
    
    const completed = tasks.docs.filter(d => d.data().status === 'completed');
    
    const completionTimes = completed.map(d => {
      const created = d.data().createdAt.toMillis();
      const finished = d.data().completedAt.toMillis();
      return (finished - created) / (1000 * 60 * 60); // hours
    });
    
    return {
      taskCompletion: completed.length / tasks.size,
      avgCompletionTime: completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length,
      activeUsers: await this.getActiveUsers(blueprintId, startDate),
      productivity: this.calculateProductivity(tasks.docs)
    };
  }
}
```

### Dashboard Component
```typescript
@Component({
  selector: 'app-analytics-dashboard',
  template: `
    <nz-row [nzGutter]="16">
      <nz-col [nzSpan]="6">
        <nz-statistic 
          nzTitle="Task Completion Rate"
          [nzValue]="metrics().taskCompletion * 100"
          nzSuffix="%">
        </nz-statistic>
      </nz-col>
      
      <nz-col [nzSpan]="6">
        <nz-statistic 
          nzTitle="Avg Completion Time"
          [nzValue]="metrics().avgCompletionTime"
          nzSuffix="hours">
        </nz-statistic>
      </nz-col>
      
      <nz-col [nzSpan]="6">
        <nz-statistic 
          nzTitle="Active Users"
          [nzValue]="metrics().activeUsers">
        </nz-statistic>
      </nz-col>
      
      <nz-col [nzSpan]="6">
        <nz-statistic 
          nzTitle="Productivity Score"
          [nzValue]="metrics().productivity"
          nzSuffix="/100">
        </nz-statistic>
      </nz-col>
    </nz-row>
    
    <nz-row [nzGutter]="16" style="margin-top: 24px;">
      <nz-col [nzSpan]="12">
        <nz-card nzTitle="Task Trends">
          <canvas id="taskTrendsChart"></canvas>
        </nz-card>
      </nz-col>
      
      <nz-col [nzSpan]="12">
        <nz-card nzTitle="Team Performance">
          <canvas id="teamPerformanceChart"></canvas>
        </nz-card>
      </nz-col>
    </nz-row>
  `
})
export class AnalyticsDashboardComponent {
  // Implementation with Chart.js or similar
}
```

### Success Metrics
- 60% management adoption
- 3+ reports viewed per user per week
- Actionable insights generated
- Decision-making time reduced 30%

---

## GAP-040: Multi-Language Support (i18n)
**Priority**: P3  
**Effort**: 2 weeks  
**Value**: Low (unless global expansion planned)  
**Dependencies**: None

### What It Is
Internationalization support with multiple language translations, locale-aware formatting, and RTL support.

### Why It Matters
- Global expansion
- Market accessibility
- User experience
- Competitive advantage

### Current State
❌ **Not Implemented**: English only  
- No translation system
- Hardcoded strings
- No locale support

### Future Consideration
**When Needed**:
- Expanding to non-English markets
- >20% non-English users
- Regulatory requirements

**Angular Approach**: @angular/localize + ngx-translate

### Decision
🟢 **Defer**: English-first strategy unless market demand justifies investment.

---

## GAP-041: Team Collaboration Features
**Priority**: P2  
**Effort**: 2 weeks  
**Value**: Medium  
**Dependencies**: GAP-031 (Notifications)

### What It Is
Real-time collaboration with task comments, @mentions, file attachments, and threaded discussions.

### Why It Matters
- Team communication
- Context preservation
- Reduce external tools
- Collaboration efficiency

### Current State
⚠️ **Partial**: Basic comments exist  
- Task comments available
- No @mentions
- No file attachments
- No threading

### Enhancement Approach
**Solution**: Enhance comment system

```typescript
interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  content: string;
  mentions: string[]; // User IDs mentioned
  attachments: {
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
  parentId?: string; // For threading
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// @mention parsing
function parseMentions(content: string): string[] {
  const mentionRegex = /@\[([^\]]+)\]\(([a-zA-Z0-9-]+)\)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[2]); // Extract user ID
  }
  
  return mentions;
}

// Comment service with mentions
async function createComment(
  taskId: string,
  content: string,
  attachments: File[]
): Promise<void> {
  const mentions = parseMentions(content);
  
  // Upload attachments
  const uploadedAttachments = await Promise.all(
    attachments.map(file => uploadFile(file))
  );
  
  // Create comment
  const comment = await admin.firestore()
    .collection('comments')
    .add({
      taskId,
      authorId: currentUser.uid,
      authorName: currentUser.displayName,
      content,
      mentions,
      attachments: uploadedAttachments,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  
  // Notify mentioned users
  await Promise.all(
    mentions.map(userId =>
      notificationService.notify({
        userId,
        type: 'mention',
        title: 'You were mentioned',
        body: `${currentUser.displayName} mentioned you in a comment`,
        actionUrl: `/tasks/${taskId}#comment-${comment.id}`
      })
    )
  );
}
```

### Success Metrics
- 80% tasks have comments
- 50% users use @mentions
- 30% comments with attachments
- User satisfaction > 4/5

---

## GAP-042: Export & Reporting
**Priority**: P3  
**Effort**: 1 week  
**Value**: Low  
**Dependencies**: None

### What It Is
Export data to CSV/PDF/Excel with customizable reports and scheduled delivery.

### Why It Matters
- Data portability
- External analysis
- Compliance
- Management reporting

### Current State
❌ **Not Implemented**: No export functionality  
- Cannot export task lists
- No PDF reports
- Manual data extraction

### Future Consideration
**When Needed**:
- Compliance requirements
- Management reporting needs
- Data portability demands

**Implementation**: Cloud Functions + PDF generation library

### Decision
🟢 **Defer**: Low priority unless compliance or specific customer need arises.

---

## Summary

### Priority Breakdown
- **P1**: 2 gaps (Notifications, Search) - Critical for user engagement and experience
- **P2**: 5 gaps (Activity Feed, Webhooks, Billing, Analytics, Collaboration) - Enhance product value
- **P3**: 5 gaps (Profiles, Mobile App, AI/ML, i18n, Export) - Future enhancements

### Implementation Timeline
1. **Q1 2026** (6 weeks):
   - Notifications (3w)
   - Search (3w)

2. **Q2 2026** (9 weeks):
   - Activity Feed (2w)
   - Webhook Enhancement (2w)
   - Analytics Dashboard (3w)
   - Collaboration Enhancement (2w)

3. **Q3-Q4 2026** (Conditional):
   - Billing System (4w) - if monetization planned
   - Other P2 items as needed

### Estimated Costs (P1+P2)
- **Algolia**: $0-50/month (depends on usage)
- **SendGrid**: $15/month (email notifications)
- **FCM**: Free (push notifications)
- **Stripe**: 2.9% + $0.30 per transaction (if billing implemented)
- **Total**: ~$20-100/month (excluding billing)

### ROI Analysis
- **Notifications**: 40% increase in user engagement
- **Search**: 50% faster content discovery, 10x improved UX
- **Activity Feed**: 30% increase in daily active users
- **Webhooks**: Enable partner integrations and revenue opportunities
- **Overall**: Higher retention, faster growth, competitive advantage

---

**Status**: ✅ Analysis Complete  
**Next Review**: 2026-03-25
