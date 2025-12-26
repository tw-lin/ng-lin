# Global Event Bus - Complete Usage Guide

完整的全局事件匯流排使用指南，包含最佳實踐和實際範例。

## 目錄

1. [快速開始](#快速開始)
2. [核心概念](#核心概念)
3. [使用範例](#使用範例)
4. [最佳實踐](#最佳實踐)
5. [進階主題](#進階主題)
6. [常見問題](#常見問題)

## 快速開始

### 1. 安裝依賴

專案已包含所有必要依賴：
- `@angular/core` (v20+)
- `rxjs` (v7.8+)
- `reflect-metadata`

### 2. 定義你的第一個事件

```typescript
import { DomainEvent } from '@core/event-bus';

export class UserRegisteredEvent extends DomainEvent {
  readonly eventType = 'user.registered' as const;
  readonly aggregateType = 'user' as const;
  
  readonly payload: Readonly<{
    user: {
      id: string;
      email: string;
      name: string;
    };
  }>;
  
  constructor(data: { user: { id: string; email: string; name: string } }) {
    super({
      aggregateId: data.user.id,
      aggregateType: 'user',
      metadata: {
        version: '1.0',
        source: 'auth-service'
      }
    });
    
    this.payload = { user: { ...data.user } };
  }
}
```

### 3. 發布事件

```typescript
import { inject, Injectable } from '@angular/core';
import { InMemoryEventBus } from '@core/event-bus';
import { UserRegisteredEvent } from './user-events';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly eventBus = inject(InMemoryEventBus);
  
  async register(email: string, password: string, name: string): Promise<void> {
    // 1. 執行業務邏輯
    const user = await this.createUser(email, password, name);
    
    // 2. 發布事件
    await this.eventBus.publish(
      new UserRegisteredEvent({ user })
    );
  }
}
```

### 4. 訂閱事件

```typescript
import { Injectable, OnInit } from '@angular/core';
import { EventConsumer, Subscribe } from '@core/event-bus';
import { UserRegisteredEvent } from './user-events';

@Injectable({ providedIn: 'root' })
export class WelcomeEmailConsumer extends EventConsumer implements OnInit {
  
  async ngOnInit(): Promise<void> {
    await this.initialize();
  }
  
  @Subscribe('user.registered')
  async handleUserRegistered(event: UserRegisteredEvent): Promise<void> {
    // 發送歡迎郵件
    await this.emailService.sendWelcomeEmail(event.payload.user.email);
  }
}
```

## 核心概念

### Domain Events (領域事件)

事件是系統中已發生事情的**不可變記錄**。

#### 事件設計原則

1. **使用過去式命名**: `user.registered` 而非 `user.register`
2. **不可變性**: 所有屬性都是 `readonly`
3. **完整上下文**: 包含處理事件所需的所有資訊
4. **明確類型**: 使用 `as const` 確保類型安全

#### 事件結構

```typescript
class MyEvent extends DomainEvent {
  // 1. 事件類型（必須）
  readonly eventType = 'my.event' as const;
  
  // 2. 聚合類型（必須）
  readonly aggregateType = 'my-aggregate' as const;
  
  // 3. 事件載荷（必須，不可變）
  readonly payload: Readonly<{
    // 你的資料...
  }>;
  
  // 4. 建構函式
  constructor(data: /* 你的資料類型 */) {
    super({
      aggregateId: data.id,
      aggregateType: 'my-aggregate',
      metadata: {
        version: '1.0',
        source: 'my-service'
      }
    });
    
    this.payload = { /* 複製資料 */ };
  }
}
```

### Event Bus (事件匯流排)

事件匯流排負責發布和分發事件。

#### 主要方法

```typescript
interface IEventBus {
  // 發布單一事件
  publish(event: DomainEvent): Promise<void>;
  
  // 批次發布事件
  publishBatch(events: DomainEvent[]): Promise<void>;
  
  // 訂閱事件
  subscribe<T>(
    eventType: string,
    handler: (event: T) => Promise<void>,
    options?: SubscribeOptions
  ): Promise<Subscription>;
  
  // 取消訂閱
  unsubscribe(subscription: Subscription): Promise<void>;
  
  // 觀察事件流
  observe<T>(eventType: string): Observable<T>;
  
  // 觀察所有事件
  observeAll(): Observable<DomainEvent>;
}
```

### Event Consumers (事件消費者)

事件消費者監聽並處理特定事件。

#### 兩種訂閱方式

**方式 A: 使用 @Subscribe 裝飾器（推薦）**

```typescript
@Injectable()
export class MyConsumer extends EventConsumer implements OnInit {
  async ngOnInit() {
    await this.initialize(); // 自動訂閱所有 @Subscribe 方法
  }
  
  @Subscribe('my.event', {
    retryPolicy: {
      maxAttempts: 3,
      backoff: 'exponential',
      initialDelay: 1000
    }
  })
  async handleMyEvent(event: MyEvent): Promise<void> {
    // 處理事件
  }
}
```

**方式 B: 使用 RxJS Observable**

```typescript
@Component({ /* ... */ })
export class MyComponent implements OnInit {
  private eventBus = inject(InMemoryEventBus);
  private destroyRef = inject(DestroyRef);
  
  ngOnInit() {
    this.eventBus
      .observe<MyEvent>('my.event')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        // 處理事件
      });
  }
}
```

## 使用範例

### 範例 1: 完整的任務管理系統

查看 `examples/` 目錄中的完整實作：

- `task-events.ts` - 事件定義
- `task.service.ts` - 服務發布事件
- `notification.consumer.ts` - 通知消費者
- `analytics.consumer.ts` - 分析消費者
- `demo.component.ts` - UI 元件整合

### 範例 2: 多個消費者處理同一事件

```typescript
// 事件定義
export class OrderPlacedEvent extends DomainEvent {
  readonly eventType = 'order.placed' as const;
  readonly aggregateType = 'order' as const;
  
  readonly payload: Readonly<{
    order: { id: string; total: number; items: any[] };
    customer: { id: string; email: string };
  }>;
}

// 消費者 1: 發送確認郵件
@Injectable()
export class OrderEmailConsumer extends EventConsumer {
  @Subscribe('order.placed')
  async handleOrderPlaced(event: OrderPlacedEvent) {
    await this.emailService.sendOrderConfirmation(
      event.payload.customer.email,
      event.payload.order
    );
  }
}

// 消費者 2: 更新庫存
@Injectable()
export class InventoryConsumer extends EventConsumer {
  @Subscribe('order.placed')
  async handleOrderPlaced(event: OrderPlacedEvent) {
    await this.inventoryService.decreaseStock(
      event.payload.order.items
    );
  }
}

// 消費者 3: 記錄分析
@Injectable()
export class OrderAnalyticsConsumer extends EventConsumer {
  @Subscribe('order.placed')
  async handleOrderPlaced(event: OrderPlacedEvent) {
    await this.analyticsService.track('order_placed', {
      orderId: event.payload.order.id,
      total: event.payload.order.total
    });
  }
}
```

### 範例 3: 事件鏈（Saga Pattern）

```typescript
// 步驟 1: 下單
export class OrderPlacedEvent extends DomainEvent {
  readonly eventType = 'order.placed' as const;
}

// 步驟 2: 付款處理
export class PaymentProcessedEvent extends DomainEvent {
  readonly eventType = 'payment.processed' as const;
}

// 步驟 3: 訂單確認
export class OrderConfirmedEvent extends DomainEvent {
  readonly eventType = 'order.confirmed' as const;
}

// Saga 協調器
@Injectable()
export class OrderSaga extends EventConsumer {
  
  @Subscribe('order.placed')
  async onOrderPlaced(event: OrderPlacedEvent) {
    // 處理付款
    const paymentResult = await this.paymentService.process(event.payload.order);
    
    // 發布付款事件
    await this.eventBus.publish(
      new PaymentProcessedEvent({ orderId: event.payload.order.id, ...paymentResult })
    );
  }
  
  @Subscribe('payment.processed')
  async onPaymentProcessed(event: PaymentProcessedEvent) {
    // 確認訂單
    await this.orderService.confirm(event.payload.orderId);
    
    // 發布確認事件
    await this.eventBus.publish(
      new OrderConfirmedEvent({ orderId: event.payload.orderId })
    );
  }
}
```

## 最佳實踐

### 1. 冪等性（Idempotency）

確保事件處理器可以安全地重複執行：

```typescript
@Injectable()
export class IdempotentConsumer extends EventConsumer {
  private cache = inject(CacheService);
  
  @Subscribe('my.event')
  async handleEvent(event: MyEvent): Promise<void> {
    // 1. 檢查是否已處理
    const cacheKey = `processed:${event.eventId}`;
    if (await this.cache.exists(cacheKey)) {
      console.log('Event already processed, skipping');
      return;
    }
    
    // 2. 處理事件
    await this.doSomething(event);
    
    // 3. 標記已處理（24小時過期）
    await this.cache.set(cacheKey, 'true', { ttl: 86400 });
  }
}
```

### 2. 錯誤處理與重試

```typescript
@Subscribe('my.event', {
  retryPolicy: {
    maxAttempts: 3,
    backoff: 'exponential',
    initialDelay: 1000,
    maxDelay: 30000
  }
})
async handleEvent(event: MyEvent): Promise<void> {
  try {
    await this.process(event);
  } catch (error) {
    // 判斷錯誤類型
    if (this.isPermanentError(error)) {
      // 永久性錯誤：記錄並跳過
      await this.logError(event, error);
      return; // 不重新拋出
    }
    
    // 暫時性錯誤：重新拋出以觸發重試
    throw error;
  }
}

private isPermanentError(error: any): boolean {
  return error instanceof ValidationError ||
         error instanceof BusinessLogicError;
}
```

### 3. 事件版本控制

```typescript
// V1
export class UserUpdatedEventV1 extends DomainEvent {
  readonly eventType = 'user.updated' as const;
  readonly payload: { userId: string; name: string };
  
  constructor(data: { userId: string; name: string }) {
    super({
      aggregateId: data.userId,
      aggregateType: 'user',
      metadata: { version: '1.0', source: 'user-service' }
    });
    this.payload = data;
  }
}

// V2 - 新增 email 欄位
export class UserUpdatedEventV2 extends DomainEvent {
  readonly eventType = 'user.updated' as const;
  readonly payload: { userId: string; name: string; email: string };
  
  constructor(data: { userId: string; name: string; email: string }) {
    super({
      aggregateId: data.userId,
      aggregateType: 'user',
      metadata: { version: '2.0', source: 'user-service' }
    });
    this.payload = data;
  }
}

// 消費者處理多版本
@Subscribe('user.updated')
async handleUserUpdated(event: DomainEvent) {
  if (event.metadata.version === '1.0') {
    const v1Event = event as UserUpdatedEventV1;
    // 處理 V1
  } else if (event.metadata.version === '2.0') {
    const v2Event = event as UserUpdatedEventV2;
    // 處理 V2
  }
}
```

### 4. 測試

```typescript
describe('MyService', () => {
  let service: MyService;
  let eventBus: InMemoryEventBus;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MyService, InMemoryEventBus]
    });
    
    service = TestBed.inject(MyService);
    eventBus = TestBed.inject(InMemoryEventBus);
  });
  
  it('should publish event', async () => {
    const publishSpy = spyOn(eventBus, 'publish').and.returnValue(Promise.resolve());
    
    await service.doSomething();
    
    expect(publishSpy).toHaveBeenCalled();
    const event = publishSpy.calls.mostRecent().args[0];
    expect(event.eventType).toBe('my.event');
  });
});

describe('MyConsumer', () => {
  let consumer: MyConsumer;
  let eventBus: InMemoryEventBus;
  
  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [MyConsumer, InMemoryEventBus]
    });
    
    consumer = TestBed.inject(MyConsumer);
    eventBus = TestBed.inject(InMemoryEventBus);
    
    await consumer.initialize();
  });
  
  it('should handle event', async () => {
    const processSpy = spyOn<any>(consumer, 'process').and.returnValue(Promise.resolve());
    
    await eventBus.publish(new MyEvent({ /* data */ }));
    
    expect(processSpy).toHaveBeenCalled();
  });
});
```

## 進階主題

### 1. 事件過濾

```typescript
@Subscribe('task.updated', {
  filter: (event) => {
    const e = event as TaskUpdatedEvent;
    // 只處理高優先級任務
    return e.payload.priority === 'high';
  }
})
async handleHighPriorityTask(event: TaskUpdatedEvent) {
  // 處理高優先級任務更新
}
```

### 2. 事件聚合

```typescript
@Component({ /* ... */ })
export class ActivityFeedComponent implements OnInit {
  private eventBus = inject(InMemoryEventBus);
  
  ngOnInit() {
    // 監聽多種事件類型
    merge(
      this.eventBus.observe('task.created'),
      this.eventBus.observe('task.updated'),
      this.eventBus.observe('task.completed')
    ).pipe(
      takeUntilDestroyed(this.destroyRef),
      scan((activities, event) => [event, ...activities].slice(0, 10), [] as DomainEvent[])
    ).subscribe(activities => {
      this.recentActivities.set(activities);
    });
  }
}
```

### 3. 事件重放

```typescript
@Injectable()
export class EventReplayService {
  private eventStore = inject(InMemoryEventStore);
  private eventBus = inject(InMemoryEventBus);
  
  async replayEvents(since: Date): Promise<void> {
    const events = await this.eventStore.getEventsSince(since);
    
    for (const event of events) {
      await this.eventBus.publish(event);
    }
  }
  
  async rebuildProjection(aggregateId: string): Promise<any> {
    const events = await this.eventStore.getEventsByAggregate(
      aggregateId,
      'task'
    );
    
    // 從事件重建狀態
    let state = {};
    for (const event of events) {
      state = this.applyEvent(state, event);
    }
    
    return state;
  }
}
```

## 常見問題

### Q: 事件處理失敗會怎樣？

A: 系統會根據重試策略自動重試。如果所有重試都失敗，錯誤會被記錄，但不會影響其他處理器。

### Q: 如何確保事件處理的順序？

A: 對於同一聚合的事件，系統保證按發布順序處理。不同聚合的事件可能並行處理。

### Q: 可以取消已發布的事件嗎？

A: 不可以。事件是不可變的歷史記錄。如果需要撤銷，應發布新的補償事件。

### Q: 如何處理大量事件？

A: 使用批次發布（`publishBatch`）和適當的重試策略。考慮實作事件過濾和優先級處理。

### Q: 事件會被持久化嗎？

A: 是的，所有事件都會被儲存到 EventStore。預設使用記憶體儲存，生產環境應使用持久化儲存。

### Q: 如何除錯事件流？

A: 
1. 使用瀏覽器開發工具查看控制台日誌
2. 使用 `eventBus.observeAll()` 監聽所有事件
3. 檢查 `eventBus.totalEvents()` 和 `eventBus.subscriptionCount()`

## 參考資源

- [GitHub 事件系統架構](../../docs/event-bus(Global%20Event%20Bus)-0.md)
- [事件驅動架構設計原則](../../docs/event-bus(Global%20Event%20Bus)-1.md)
- [API 參考文檔](./README.md)
- [範例代碼](./examples/)

## 授權

MIT License
