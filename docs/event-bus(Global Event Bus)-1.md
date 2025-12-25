是的！這是**全局事件總線（Global Event Bus）**架構。讓我詳細說明如何重現此事件系統，以及需要注意的設計原則和代碼實踐。

## 事件系統核心架構設計

### 整體架構圖

```
┌──────────────────────────────────────────────────────────┐
│                   Application Layer                       │
│         (Issues Service, PR Service, etc.)                │
└──────────────────────────────────────────────────────────┘
                         ↓ publish events
┌──────────────────────────────────────────────────────────┐
│                  Event Bus Interface                      │
│              (抽象層 - 不依賴具體實現)                      │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│               Event Bus Implementation                    │
│         (Kafka / RabbitMQ / In-Memory / Redis)           │
└──────────────────────────────────────────────────────────┘
                         ↓ consume events
┌──────────────────────────────────────────────────────────┐
│                  Event Consumers                          │
│    (Notification, Search, Webhook, Analytics, etc.)      │
└──────────────────────────────────────────────────────────┘
```

## 核心設計原則

### 1. **事件設計原則**

#### 原則 1.1: 事件不可變（Immutable）
```typescript
// ❌ 錯誤：事件可以被修改
class IssueOpenedEvent {
  issue: Issue;
  
  updateIssue(newData: Partial<Issue>) {
    this.issue = { ...this.issue, ...newData };  // 不應該修改
  }
}

// ✅ 正確：事件完全不可變
interface IssueOpenedEvent {
  readonly eventId: string;
  readonly eventType: 'issues.opened';
  readonly timestamp: Date;
  readonly aggregateId: string;     // issue.id
  readonly aggregateType: 'issue';
  readonly payload: Readonly<{
    readonly issue: Readonly<Issue>;
    readonly repository: Readonly<Repository>;
    readonly sender: Readonly<User>;
  }>;
  readonly metadata: Readonly<{
    readonly version: string;
    readonly source: string;
    readonly correlationId?: string;
    readonly causationId?: string;
  }>;
}
```

#### 原則 1.2: 事件命名規範
```typescript
// 事件命名格式: <實體>.<動作的過去式>
// ✅ 好的命名
'issues.opened'
'pull_request.merged'
'repository.created'
'user.registered'

// ❌ 不好的命名
'issue.open'           // 應該用過去式
'create_repository'    // 格式不一致
'UserUpdated'          // 應該用小寫加點號
```

#### 原則 1.3: 事件要包含完整上下文
```typescript
// ❌ 錯誤：缺少必要上下文
interface IssueClosedEvent {
  issueId: string;  // 只有 ID，消費者需要再查詢
}

// ✅ 正確：包含足夠的上下文資訊
interface IssueClosedEvent {
  eventId: string;
  eventType: 'issues.closed';
  timestamp: Date;
  payload: {
    issue: {
      id: string;
      number: number;
      title: string;
      state: 'closed';
      closedBy: User;
      closedAt: Date;
      // 包含消費者可能需要的資訊
    };
    repository: {
      id: string;
      fullName: string;
      owner: User;
    };
    actor: User;
    reason?: 'completed' | 'not_planned';
  };
  metadata: {
    version: string;
    source: string;
  };
}
```

### 2. **事件總線設計原則**

#### 原則 2.1: 依賴抽象而非具體實現

```typescript
// 定義抽象介面
interface IEventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): Promise<Subscription>;
  unsubscribe(subscription: Subscription): Promise<void>;
}

// 領域服務只依賴介面
class IssuesService {
  constructor(
    private readonly eventBus: IEventBus  // 依賴抽象
  ) {}
  
  async createIssue(data: CreateIssueInput): Promise<Issue> {
    const issue = await this.repository.save(data);
    
    // 不關心 EventBus 的具體實現
    await this.eventBus.publish({
      eventType: 'issues.opened',
      // ...
    });
    
    return issue;
  }
}

// 可以有多種實現
class KafkaEventBus implements IEventBus { /* ... */ }
class RabbitMQEventBus implements IEventBus { /* ... */ }
class InMemoryEventBus implements IEventBus { /* ... */ }
class RedisEventBus implements IEventBus { /* ... */ }
```

#### 原則 2.2: At-Least-Once 語義

```typescript
class EventBus implements IEventBus {
  async publish(event: DomainEvent): Promise<void> {
    // 1. 先持久化事件（保證不丟失）
    await this.eventStore.append(event);
    
    // 2. 再發送到消息佇列
    try {
      await this.messageQueue.send(event);
    } catch (error) {
      // 即使發送失敗，事件已經持久化
      // 可以通過後台任務重試
      await this.retryQueue.enqueue(event);
      throw error;
    }
  }
}

// 消費者需要實現冪等性
class NotificationConsumer {
  private processedEvents = new Set<string>();
  
  async handle(event: DomainEvent): Promise<void> {
    // 檢查是否已處理過（防止重複處理）
    if (this.processedEvents.has(event.eventId)) {
      console.log(`Event ${event.eventId} already processed, skipping`);
      return;
    }
    
    // 處理事件
    await this.processEvent(event);
    
    // 記錄已處理（可以存在資料庫）
    this.processedEvents.add(event.eventId);
  }
}
```

### 3. **事件消費者設計原則**

#### 原則 3.1: 單一職責原則

```typescript
// ❌ 錯誤：一個消費者做太多事情
class MegaConsumer {
  async handleIssueOpened(event: IssueOpenedEvent) {
    await this.sendNotification(event);      // 通知
    await this.indexToSearch(event);         // 搜尋
    await this.triggerWebhook(event);        // Webhook
    await this.updateAnalytics(event);       // 分析
    await this.logAudit(event);             // 稽核
  }
}

// ✅ 正確：每個消費者只負責一件事
class NotificationConsumer {
  @Subscribe('issues.opened')
  async handle(event: IssueOpenedEvent) {
    await this.sendNotification(event);
  }
}

class SearchIndexerConsumer {
  @Subscribe('issues.opened')
  async handle(event: IssueOpenedEvent) {
    await this.indexToSearch(event);
  }
}

class WebhookConsumer {
  @Subscribe('issues.opened')
  async handle(event: IssueOpenedEvent) {
    await this.triggerWebhook(event);
  }
}
```

#### 原則 3.2: 冪等性（Idempotency）

```typescript
// 消費者必須實現冪等性
class NotificationConsumer {
  @Subscribe('issues.opened')
  async handle(event: IssueOpenedEvent) {
    // 方法 1: 使用事件 ID 作為冪等鍵
    const idempotencyKey = `notification:${event.eventId}`;
    
    const alreadyProcessed = await this.cache.get(idempotencyKey);
    if (alreadyProcessed) {
      return; // 已處理過，跳過
    }
    
    // 處理事件
    await this.sendNotification(event);
    
    // 記錄已處理（設置過期時間）
    await this.cache.set(idempotencyKey, 'true', { ttl: 86400 });
  }
}

// 方法 2: 資料庫層面保證冪等性
class SearchIndexerConsumer {
  @Subscribe('issues.opened')
  async handle(event: IssueOpenedEvent) {
    // 使用 upsert 操作（存在則更新，不存在則插入）
    await this.searchEngine.upsert({
      id: event.payload.issue.id,  // 使用業務 ID
      type: 'issue',
      title: event.payload.issue.title,
      body: event.payload.issue.body,
      // ...
    });
    // 即使重複執行，結果也是一樣的
  }
}
```

#### 原則 3.3: 錯誤處理與重試

```typescript
class EventConsumer {
  @Subscribe('issues.opened')
  async handle(event: IssueOpenedEvent) {
    try {
      await this.processEvent(event);
    } catch (error) {
      // 分類錯誤
      if (this.isTransientError(error)) {
        // 暫時性錯誤：重試
        throw error; // 讓消息佇列重新投遞
      } else if (this.isPermanentError(error)) {
        // 永久性錯誤：記錄並丟棄
        await this.logError(event, error);
        await this.deadLetterQueue.send(event);
        // 不要 throw，避免無限重試
      } else {
        // 未知錯誤：記錄並重試
        await this.logError(event, error);
        throw error;
      }
    }
  }
  
  private isTransientError(error: Error): boolean {
    // 網路錯誤、超時、資料庫連線失敗等
    return error instanceof NetworkError 
      || error instanceof TimeoutError
      || error instanceof DatabaseConnectionError;
  }
  
  private isPermanentError(error: Error): boolean {
    // 資料驗證錯誤、業務邏輯錯誤等
    return error instanceof ValidationError
      || error instanceof BusinessLogicError;
  }
}
```

### 4. **事件版本控制原則**

#### 原則 4.1: 事件模式演進

```typescript
// V1 版本
interface IssueOpenedEventV1 {
  eventType: 'issues.opened';
  version: 'v1';
  payload: {
    issueId: string;
    title: string;
  };
}

// V2 版本：新增欄位
interface IssueOpenedEventV2 {
  eventType: 'issues.opened';
  version: 'v2';
  payload: {
    issueId: string;
    title: string;
    body: string;        // 新增
    labels: string[];    // 新增
  };
}

// 事件適配器：處理不同版本
class EventAdapter {
  adapt(event: DomainEvent): IssueOpenedEventV2 {
    if (event.version === 'v1') {
      return {
        ...event,
        version: 'v2',
        payload: {
          ...event.payload,
          body: '',           // 預設值
          labels: []          // 預設值
        }
      };
    }
    return event as IssueOpenedEventV2;
  }
}

// 消費者處理
class NotificationConsumer {
  constructor(private adapter: EventAdapter) {}
  
  @Subscribe('issues.opened')
  async handle(event: DomainEvent) {
    // 統一轉換為最新版本
    const latestEvent = this.adapter.adapt(event);
    await this.processEvent(latestEvent);
  }
}
```

### 5. **事件儲存原則**

#### 原則 5.1: Event Store 設計

```typescript
// Event Store 介面
interface IEventStore {
  append(event: DomainEvent): Promise<void>;
  getEvents(criteria: EventCriteria): Promise<DomainEvent[]>;
  getEventsByAggregate(
    aggregateId: string, 
    aggregateType: string
  ): Promise<DomainEvent[]>;
  getEventsSince(timestamp: Date): Promise<DomainEvent[]>;
}

// Event Store 實現
class PostgresEventStore implements IEventStore {
  async append(event: DomainEvent): Promise<void> {
    await this.db.query(`
      INSERT INTO events (
        event_id,
        event_type,
        aggregate_id,
        aggregate_type,
        event_data,
        metadata,
        timestamp,
        version
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      event.eventId,
      event.eventType,
      event.aggregateId,
      event.aggregateType,
      JSON.stringify(event.payload),
      JSON.stringify(event.metadata),
      event.timestamp,
      event.metadata.version
    ]);
  }
  
  async getEventsByAggregate(
    aggregateId: string,
    aggregateType: string
  ): Promise<DomainEvent[]> {
    const result = await this.db.query(`
      SELECT * FROM events
      WHERE aggregate_id = $1 AND aggregate_type = $2
      ORDER BY timestamp ASC
    `, [aggregateId, aggregateType]);
    
    return result.rows.map(row => this.deserializeEvent(row));
  }
}
```

## 完整的實現範例（Angular + NestJS 風格）

### 1. 事件定義

```typescript
// libs/shared/events/src/lib/base-event.ts
export abstract class DomainEvent {
  readonly eventId: string;
  readonly timestamp: Date;
  readonly aggregateId: string;
  readonly aggregateType: string;
  
  abstract readonly eventType: string;
  abstract readonly payload: unknown;
  
  readonly metadata: {
    readonly version: string;
    readonly source: string;
    readonly correlationId?: string;
    readonly causationId?: string;
  };
  
  constructor(data: Partial<DomainEvent>) {
    this.eventId = data.eventId ?? uuid();
    this.timestamp = data.timestamp ?? new Date();
    this.aggregateId = data.aggregateId!;
    this.aggregateType = data.aggregateType!;
    this.metadata = {
      version: data.metadata?.version ?? '1.0',
      source: data.metadata?.source ?? 'unknown',
      correlationId: data.metadata?.correlationId,
      causationId: data.metadata?.causationId
    };
  }
}

// libs/shared/events/src/lib/issues/issue-opened.event.ts
export class IssueOpenedEvent extends DomainEvent {
  readonly eventType = 'issues.opened' as const;
  readonly aggregateType = 'issue' as const;
  
  readonly payload: Readonly<{
    issue: {
      id: string;
      number: number;
      title: string;
      body: string;
      state: 'open';
      createdAt: Date;
    };
    repository: {
      id: string;
      fullName: string;
      owner: {
        id: string;
        login: string;
      };
    };
    sender: {
      id: string;
      login: string;
    };
  }>;
  
  constructor(data: {
    issue: Issue;
    repository: Repository;
    sender: User;
    correlationId?: string;
  }) {
    super({
      aggregateId: data.issue.id,
      aggregateType: 'issue',
      metadata: {
        version: '2024.1',
        source: 'issues-service',
        correlationId: data.correlationId
      }
    });
    
    this.payload = {
      issue: {
        id: data.issue.id,
        number: data.issue.number,
        title: data.issue.title,
        body: data.issue.body,
        state: 'open',
        createdAt: data.issue.createdAt
      },
      repository: {
        id: data.repository.id,
        fullName: data.repository.fullName,
        owner: {
          id: data.repository.owner.id,
          login: data.repository.owner.login
        }
      },
      sender: {
        id: data.sender.id,
        login: data.sender.login
      }
    };
  }
}
```

### 2. Event Bus 介面與實現

```typescript
// libs/shared/event-bus/src/lib/event-bus.interface.ts
export interface IEventBus {
  publish(event: DomainEvent): Promise<void>;
  publishBatch(events: DomainEvent[]): Promise<void>;
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>,
    options?: SubscribeOptions
  ): Promise<Subscription>;
  unsubscribe(subscription: Subscription): Promise<void>;
}

export type EventHandler<T extends DomainEvent> = (event: T) => Promise<void>;

export interface SubscribeOptions {
  concurrency?: number;
  retryPolicy?: RetryPolicy;
  deadLetterQueue?: string;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoff: 'exponential' | 'linear' | 'fixed';
  initialDelay: number;
  maxDelay?: number;
}

// libs/shared/event-bus/src/lib/in-memory-event-bus.ts
export class InMemoryEventBus implements IEventBus {
  private handlers = new Map<string, Set<EventHandler<any>>>();
  private eventStore?: IEventStore;
  
  constructor(options?: { eventStore?: IEventStore }) {
    this.eventStore = options?.eventStore;
  }
  
  async publish(event: DomainEvent): Promise<void> {
    // 1. 持久化事件
    if (this.eventStore) {
      await this.eventStore.append(event);
    }
    
    // 2. 分發事件
    const handlers = this.handlers.get(event.eventType) ?? new Set();
    
    // 並行執行所有處理器
    await Promise.all(
      Array.from(handlers).map(handler =>
        this.executeHandler(handler, event)
      )
    );
  }
  
  async publishBatch(events: DomainEvent[]): Promise<void> {
    // 批次處理以提升效能
    if (this.eventStore) {
      await this.eventStore.appendBatch(events);
    }
    
    for (const event of events) {
      await this.publish(event);
    }
  }
  
  async subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>,
    options?: SubscribeOptions
  ): Promise<Subscription> {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    
    // 包裝處理器以支援重試
    const wrappedHandler = this.wrapWithRetry(handler, options?.retryPolicy);
    this.handlers.get(eventType)!.add(wrappedHandler);
    
    return {
      eventType,
      handler: wrappedHandler,
      unsubscribe: () => this.unsubscribe({ eventType, handler: wrappedHandler })
    };
  }
  
  async unsubscribe(subscription: Subscription): Promise<void> {
    const handlers = this.handlers.get(subscription.eventType);
    if (handlers) {
      handlers.delete(subscription.handler);
    }
  }
  
  private async executeHandler(
    handler: EventHandler<any>,
    event: DomainEvent
  ): Promise<void> {
    try {
      await handler(event);
    } catch (error) {
      console.error(`Error handling event ${event.eventType}:`, error);
      // 可以將失敗的事件發送到 DLQ
    }
  }
  
  private wrapWithRetry<T extends DomainEvent>(
    handler: EventHandler<T>,
    policy?: RetryPolicy
  ): EventHandler<T> {
    if (!policy) return handler;
    
    return async (event: T) => {
      let lastError: Error | undefined;
      
      for (let attempt = 0; attempt < policy.maxAttempts; attempt++) {
        try {
          await handler(event);
          return; // 成功
        } catch (error) {
          lastError = error as Error;
          
          if (attempt < policy.maxAttempts - 1) {
            const delay = this.calculateDelay(attempt, policy);
            await this.sleep(delay);
          }
        }
      }
      
      throw lastError;
    };
  }
  
  private calculateDelay(attempt: number, policy: RetryPolicy): number {
    switch (policy.backoff) {
      case 'exponential':
        return Math.min(
          policy.initialDelay * Math.pow(2, attempt),
          policy.maxDelay ?? Infinity
        );
      case 'linear':
        return policy.initialDelay * (attempt + 1);
      case 'fixed':
        return policy.initialDelay;
    }
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 3. 裝飾器模式（Angular 風格）

```typescript
// libs/shared/event-bus/src/lib/decorators.ts
export function Subscribe(eventType: string, options?: SubscribeOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    // 儲存訂閱資訊到類別的元數據
    if (!Reflect.hasMetadata('subscriptions', target.constructor)) {
      Reflect.defineMetadata('subscriptions', [], target.constructor);
    }
    
    const subscriptions = Reflect.getMetadata('subscriptions', target.constructor);
    subscriptions.push({
      eventType,
      methodName: propertyKey,
      options
    });
    
    Reflect.defineMetadata('subscriptions', subscriptions, target.constructor);
  };
}

// libs/shared/event-bus/src/lib/event-consumer.base.ts
export abstract class EventConsumer {
  protected abstract eventBus: IEventBus;
  private subscriptions: Subscription[] = [];
  
  async initialize(): Promise<void> {
    const subscriptions = Reflect.getMetadata('subscriptions', this.constructor) || [];
    
    for (const sub of subscriptions) {
      const handler = (this as any)[sub.methodName].bind(this);
      const subscription = await this.eventBus.subscribe(
        sub.eventType,
        handler,
        sub.options
      );
      this.subscriptions.push(subscription);
    }
  }
  
  async destroy(): Promise<void> {
    for (const subscription of this.subscriptions) {
      await this.eventBus.unsubscribe(subscription);
    }
  }
}
```

### 4. 使用範例

```typescript
// apps/issues-service/src/issues.service.ts
@Injectable()
export class IssuesService {
  constructor(
    private readonly repository: IssuesRepository,
    private readonly eventBus: IEventBus
  ) {}
  
  async createIssue(data: CreateIssueInput): Promise<Issue> {
    // 1. 執行業務邏輯
    const issue = await this.repository.save({
      title: data.title,
      body: data.body,
      createdBy: data.creator,
      repository: data.repository,
      state: 'open'
    });
    
    // 2. 發布領域事件
    await this.eventBus.publish(
      new IssueOpenedEvent({
        issue,
        repository: data.repository,
        sender: data.creator,
        correlationId: data.correlationId
      })
    );
    
    return issue;
  }
}

// apps/notification-service/src/consumers/issue-notification.consumer.ts
@Injectable()
export class IssueNotificationConsumer extends EventConsumer {
  constructor(
    protected readonly eventBus: IEventBus,
    private readonly notificationService: NotificationService,
    private readonly permissionService: PermissionService
  ) {
    super();
  }
  
  @Subscribe('issues.opened', {
    retryPolicy: {
      maxAttempts: 3,
      backoff: 'exponential',
      initialDelay: 1000,
      maxDelay: 10000
    }
  })
  async handleIssueOpened(event: IssueOpenedEvent): Promise<void> {
    // 檢查冪等性
    const processed = await this.isAlreadyProcessed(event.eventId);
    if (processed) {
      return;
    }
    
    // 1. 找出需要通知的人
    const watchers = await this.getRepositoryWatchers(event.payload.repository.id);
    const mentions = this.extractMentions(event.payload.issue.body);
    const recipients = [...new Set([...watchers, ...mentions])];
    
    // 2. 權限過濾
    const allowedRecipients = await this.permissionService.filterByPermission(
      recipients,
      event.payload.repository.id,
      'read'
    );
    
    // 3. 發送通知
    await this.notificationService.sendBatch({
      type: 'issue_opened',
      recipients: allowedRecipients,
      data: {
        issueNumber: event.payload.issue.number,
        issueTitle: event.payload.issue.title,
        repository: event.payload.repository.fullName,
        sender: event.payload.sender.login,
        url: this.buildIssueUrl(event.payload)
      }
    });
    
    // 4. 標記為已處理
    await this.markAsProcessed(event.eventId);
  }
  
  private async isAlreadyProcessed(eventId: string): Promise<boolean> {
    // 從快取或資料庫檢查
    return await this.cache.exists(`processed:${eventId}`);
  }
  
  private async markAsProcessed(eventId: string): Promise<void> {
    await this.cache.set(`processed:${eventId}`, 'true', { ttl: 86400 });
  }
  
  private extractMentions(text: string): string[] {
    const regex = /@(\w+)/g;
    const matches = text.matchAll(regex);
    return Array.from(matches, m => m[1]);
  }
  
  private buildIssueUrl(payload: IssueOpenedEvent['payload']): string {
    return `https://github.com/${payload.repository.fullName}/issues/${payload.issue.number}`;
  }
  
  private async getRepositoryWatchers(repoId: string): Promise<string[]> {
    // 實現獲取 watchers 邏輯
    return [];
  }
}

// apps/search-service/src/consumers/issue-search.consumer.ts
@Injectable()
export class IssueSearchConsumer extends EventConsumer {
  constructor(
    protected readonly eventBus: IEventBus,
    private readonly searchEngine: SearchEngine
  ) {
    super();
  }
  
  @Subscribe('issues.opened')
  async handleIssueOpened(event: IssueOpenedEvent): Promise<void> {
    // 索引到搜尋引擎（使用 upsert 保證冪等性）
    await this.searchEngine.upsert({
      id: event.payload.issue.id,
      type: 'issue',
      repository: event.payload.repository.fullName,
      number: event.payload.issue.number,
      title: event.payload.issue.title,
      body: event.payload.issue.body,
      state: event.payload.issue.state,
      createdAt: event.payload.issue.createdAt,
      createdBy: event.payload.sender.login
    });
  }
  
  @Subscribe('issues.closed')
  async handleIssueClosed(event: IssueClosedEvent): Promise<void> {
    // 更新索引
    await this.searchEngine.update(event.payload.issue.id, {
      state: 'closed',
      closedAt: event.payload.issue.closedAt
    });
  }
}
```

### 5. Module 配置（Angular/NestJS 風格）

```typescript
// apps/issues-service/src/issues.module.ts
@Module({
  imports: [
    EventBusModule.forRoot({
      implementation: 'in-memory', // 或 'kafka', 'rabbitmq'
      eventStore: {
        type: 'postgres',
        connection: process.env.DATABASE_URL
      }
    })
  ],
  providers: [
    IssuesService,
    IssuesRepository
  ],
  exports: [IssuesService]
})
export class IssuesModule {}

// apps/notification-service/src/notification.module.ts
@Module({
  imports: [
    EventBusModule.forRoot({
      implementation: 'in-memory'
    })
  ],
  providers: [
    NotificationService,
    IssueNotificationConsumer,
    PullRequestNotificationConsumer
  ]
})
export class NotificationModule implements OnModuleInit {
  constructor(
    private readonly issueConsumer: IssueNotificationConsumer,
    private readonly prConsumer: PullRequestNotificationConsumer
  ) {}
  
  async onModuleInit() {
    // 初始化所有消費者
    await this.issueConsumer.initialize();
    await this.prConsumer.initialize();
  }
}
```

