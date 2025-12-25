## Global Event Bus 完整架構

```
src/app/core/event-bus/
│
├── interfaces/                              # 介面定義
│   ├── event-bus.interface.ts              # Event Bus 抽象介面
│   ├── event-store.interface.ts            # Event Store 抽象介面
│   ├── event-handler.interface.ts          # 事件處理器介面
│   ├── subscription.interface.ts           # 訂閱介面
│   └── retry-policy.interface.ts           # 重試策略介面
│
├── models/                                  # 領域模型
│   ├── domain-event.base.ts                # 事件基礎類別
│   ├── event-metadata.model.ts             # 事件元數據
│   ├── event-envelope.model.ts             # 事件信封（包裝）
│   └── subscription.model.ts               # 訂閱模型
│
├── implementations/                         # 具體實作
│   ├── in-memory/
│   │   ├── in-memory-event-bus.ts          # 記憶體實作
│   │   └── in-memory-event-store.ts
│   ├── firebase/
│   │   ├── firebase-event-bus.ts           # Firebase 實作
│   │   └── firebase-event-store.ts
│   ├── supabase/
│   │   ├── supabase-event-bus.ts           # Supabase 實作
│   │   └── supabase-event-store.ts
│   └── kafka/
│       └── kafka-event-bus.ts              # Kafka 實作（未來）
│
├── decorators/                              # 裝飾器
│   ├── subscribe.decorator.ts              # @Subscribe 裝飾器
│   ├── event-handler.decorator.ts          # @EventHandler 裝飾器
│   └── retry.decorator.ts                  # @Retry 裝飾器
│
├── services/                                # 服務
│   ├── event-dispatcher.service.ts         # 事件分發器
│   ├── event-serializer.service.ts         # 事件序列化
│   ├── event-validator.service.ts          # 事件驗證
│   ├── retry-manager.service.ts            # 重試管理
│   └── dead-letter-queue.service.ts        # 死信佇列
│
├── consumers/                               # 基礎消費者類別
│   ├── event-consumer.base.ts              # 消費者基礎類別
│   └── async-event-consumer.base.ts        # 非同步消費者
│
├── utils/                                   # 工具函數
│   ├── event-id-generator.util.ts          # 事件 ID 生成
│   ├── event-matcher.util.ts               # 事件匹配
│   └── correlation-tracker.util.ts         # 關聯追蹤
│
├── constants/                               # 常數定義
│   ├── event-bus-tokens.ts                 # DI Token
│   └── event-types.constants.ts            # 事件類型常數
│
├── errors/                                  # 錯誤定義
│   ├── event-bus.error.ts                  # Event Bus 錯誤
│   ├── event-handler.error.ts              # 處理器錯誤
│   └── serialization.error.ts              # 序列化錯誤
│
├── testing/                                 # 測試工具
│   ├── mock-event-bus.ts                   # Mock Event Bus
│   ├── test-event.ts                       # 測試事件
│   └── event-bus-test.utils.ts             # 測試工具
│
├── event-bus.module.ts                      # 事件總線模組
└── index.ts                                 # 公開 API
```

## 詳細檔案結構與職責

### 1. Interfaces (介面層)

```
interfaces/
│
├── event-bus.interface.ts
│   介面: IEventBus
│   職責: 定義事件總線的核心方法
│   方法:
│   - publish(event: DomainEvent): Promise<void>
│   - publishBatch(events: DomainEvent[]): Promise<void>
│   - subscribe<T>(eventType, handler, options?): Promise<Subscription>
│   - unsubscribe(subscription: Subscription): Promise<void>
│   - getEventHistory(criteria): Promise<DomainEvent[]>
│
├── event-store.interface.ts
│   介面: IEventStore
│   職責: 定義事件持久化的方法
│   方法:
│   - append(event: DomainEvent): Promise<void>
│   - appendBatch(events: DomainEvent[]): Promise<void>
│   - getEvents(criteria: EventCriteria): Promise<DomainEvent[]>
│   - getEventsByAggregate(id, type): Promise<DomainEvent[]>
│   - getEventsSince(timestamp: Date): Promise<DomainEvent[]>
│
├── event-handler.interface.ts
│   類型: EventHandler<T extends DomainEvent>
│   職責: 定義事件處理函數的簽名
│   簽名: (event: T) => Promise<void> | void
│
├── subscription.interface.ts
│   介面: ISubscription
│   職責: 定義訂閱的結構
│   屬性:
│   - id: string
│   - eventType: string
│   - handler: EventHandler<any>
│   - options?: SubscribeOptions
│   方法:
│   - unsubscribe(): Promise<void>
│
└── retry-policy.interface.ts
    介面: IRetryPolicy
    職責: 定義重試策略
    屬性:
    - maxAttempts: number
    - backoff: 'exponential' | 'linear' | 'fixed'
    - initialDelay: number
    - maxDelay?: number
    - shouldRetry?: (error: Error, attempt: number) => boolean
```

### 2. Models (模型層)

```
models/
│
├── domain-event.base.ts
│   類別: DomainEvent (抽象基礎類別)
│   職責: 所有領域事件的基礎
│   屬性:
│   - eventId: string (唯一識別)
│   - eventType: string (事件類型)
│   - timestamp: Date (發生時間)
│   - aggregateId: string (聚合根 ID)
│   - aggregateType: string (聚合類型)
│   - payload: unknown (事件負載)
│   - metadata: EventMetadata (元數據)
│
├── event-metadata.model.ts
│   類別: EventMetadata
│   職責: 事件元數據
│   屬性:
│   - version: string (事件版本)
│   - source: string (事件來源)
│   - correlationId?: string (關聯 ID)
│   - causationId?: string (因果 ID)
│   - userId?: string (觸發用戶)
│   - tenantId?: string (租戶 ID)
│
├── event-envelope.model.ts
│   類別: EventEnvelope
│   職責: 包裝事件以便傳輸
│   屬性:
│   - event: DomainEvent
│   - retryCount: number
│   - lastAttempt?: Date
│   - error?: Error
│
└── subscription.model.ts
    類別: Subscription
    職責: 訂閱的具體實作
    實作: ISubscription 介面
```

### 3. Implementations (實作層)

```
implementations/
│
├── in-memory/
│   ├── in-memory-event-bus.ts
│   │   類別: InMemoryEventBus
│   │   職責: 記憶體版本的事件總線（開發/測試）
│   │   特點:
│   │   - 快速、簡單
│   │   - 無持久化
│   │   - 適合本地開發
│   │
│   └── in-memory-event-store.ts
│       類別: InMemoryEventStore
│       職責: 記憶體版本的事件儲存
│       實作: 使用 Map 儲存事件
│
├── firebase/
│   ├── firebase-event-bus.ts
│   │   類別: FirebaseEventBus
│   │   職責: 基於 Firebase Realtime Database 的事件總線
│   │   特點:
│   │   - 即時同步
│   │   - 自動持久化
│   │   - 支援多客戶端
│   │
│   └── firebase-event-store.ts
│       類別: FirebaseEventStore
│       職責: 使用 Firestore 儲存事件
│       實作: 事件按時間序列儲存
│
├── supabase/
│   ├── supabase-event-bus.ts
│   │   類別: SupabaseEventBus
│   │   職責: 基於 Supabase Realtime 的事件總線
│   │   特點:
│   │   - PostgreSQL 後端
│   │   - Realtime 訂閱
│   │   - 強類型查詢
│   │
│   └── supabase-event-store.ts
│       類別: SupabaseEventStore
│       職責: 使用 Supabase 資料庫儲存事件
│       Schema:
│       - events 表
│       - event_subscriptions 表
│
└── kafka/
    └── kafka-event-bus.ts
        類別: KafkaEventBus
        職責: 基於 Kafka 的分散式事件總線（未來）
        特點:
        - 高吞吐量
        - 分散式
        - 可擴展
```

### 4. Decorators (裝飾器層)

```
decorators/
│
├── subscribe.decorator.ts
│   裝飾器: @Subscribe(eventType: string, options?: SubscribeOptions)
│   職責: 標記方法為事件處理器
│   用法:
│   @Subscribe('issues.opened', { retryPolicy: {...} })
│   async handleIssueOpened(event: IssueOpenedEvent) {}
│
├── event-handler.decorator.ts
│   裝飾器: @EventHandler()
│   職責: 標記類別為事件處理器
│   用法:
│   @EventHandler()
│   export class IssueNotificationConsumer {}
│
└── retry.decorator.ts
    裝飾器: @Retry(policy: IRetryPolicy)
    職責: 為方法添加重試邏輯
    用法:
    @Retry({ maxAttempts: 3, backoff: 'exponential' })
    async processEvent(event) {}
```

### 5. Services (服務層)

```
services/
│
├── event-dispatcher.service.ts
│   類別: EventDispatcherService
│   職責: 
│   - 將事件分發給所有訂閱者
│   - 管理並行執行
│   - 處理錯誤隔離
│   方法:
│   - dispatch(event: DomainEvent): Promise<void>
│   - dispatchToHandler(handler, event): Promise<void>
│
├── event-serializer.service.ts
│   類別: EventSerializerService
│   職責:
│   - 序列化事件為 JSON
│   - 反序列化 JSON 為事件對象
│   - 處理複雜類型（Date, Map, Set）
│   方法:
│   - serialize(event: DomainEvent): string
│   - deserialize(json: string): DomainEvent
│
├── event-validator.service.ts
│   類別: EventValidatorService
│   職責:
│   - 驗證事件結構
│   - 驗證事件內容
│   - 驗證事件版本
│   方法:
│   - validate(event: DomainEvent): ValidationResult
│   - validateSchema(event): boolean
│
├── retry-manager.service.ts
│   類別: RetryManagerService
│   職責:
│   - 管理重試邏輯
│   - 計算重試延遲
│   - 判斷是否應該重試
│   方法:
│   - shouldRetry(error, attempt): boolean
│   - calculateDelay(attempt, policy): number
│   - executeWithRetry(fn, policy): Promise<any>
│
└── dead-letter-queue.service.ts
    類別: DeadLetterQueueService
    職責:
    - 儲存失敗的事件
    - 提供重新處理機制
    - 失敗分析
    方法:
    - send(event: EventEnvelope): Promise<void>
    - getFailedEvents(): Promise<EventEnvelope[]>
    - retry(eventId: string): Promise<void>
```

### 6. Consumers (消費者基礎類別)

```
consumers/
│
├── event-consumer.base.ts
│   類別: EventConsumer (抽象基礎類別)
│   職責:
│   - 提供消費者的基礎功能
│   - 自動註冊訂閱
│   - 生命週期管理
│   方法:
│   - initialize(): Promise<void>
│   - destroy(): Promise<void>
│   - onModuleInit(): 自動初始化訂閱
│   - onModuleDestroy(): 自動清理訂閱
│
└── async-event-consumer.base.ts
    類別: AsyncEventConsumer
    職責:
    - 支援非同步事件處理
    - 並行處理控制
    - 背壓管理
    屬性:
    - concurrency: number (並行度)
    方法:
    - processBatch(events): Promise<void>
```

### 7. Utils (工具層)

```
utils/
│
├── event-id-generator.util.ts
│   函數集:
│   - generateEventId(): string
│   - generateCorrelationId(): string
│   - generateCausationId(): string
│
├── event-matcher.util.ts
│   類別: EventMatcher
│   職責: 匹配事件類型（支援萬用字元）
│   方法:
│   - matches(pattern: string, eventType: string): boolean
│   範例: 
│   - 'issues.*' 匹配 'issues.opened', 'issues.closed'
│   - 'issues.**.labeled' 匹配所有標籤相關事件
│
└── correlation-tracker.util.ts
    類別: CorrelationTracker
    職責:
    - 追蹤事件的因果鏈
    - 建立事件關聯圖
    方法:
    - track(event: DomainEvent): void
    - getChain(eventId: string): DomainEvent[]
```

### 8. Constants (常數層)

```
constants/
│
├── event-bus-tokens.ts
│   DI Token 定義:
│   - EVENT_BUS: InjectionToken<IEventBus>
│   - EVENT_STORE: InjectionToken<IEventStore>
│   - EVENT_DISPATCHER: InjectionToken<EventDispatcherService>
│
└── event-types.constants.ts
    事件類型常數:
    - ISSUE_EVENTS: 所有 Issue 相關事件
    - PR_EVENTS: 所有 PR 相關事件
    - REPOSITORY_EVENTS: 所有 Repository 相關事件
```

### 9. Errors (錯誤層)

```
errors/
│
├── event-bus.error.ts
│   類別:
│   - EventBusError (基礎錯誤)
│   - PublishError (發布失敗)
│   - SubscribeError (訂閱失敗)
│
├── event-handler.error.ts
│   類別:
│   - EventHandlerError (處理器錯誤)
│   - HandlerTimeoutError (處理超時)
│   - HandlerRetryExhaustedError (重試耗盡)
│
└── serialization.error.ts
    類別:
    - SerializationError (序列化錯誤)
    - DeserializationError (反序列化錯誤)
```

### 10. Testing (測試工具層)

```
testing/
│
├── mock-event-bus.ts
│   類別: MockEventBus
│   職責: 測試用的 Mock Event Bus
│   特點:
│   - 記錄所有發布的事件
│   - 提供斷言方法
│   方法:
│   - getPublishedEvents(): DomainEvent[]
│   - clearEvents(): void
│   - expectEventPublished(eventType): boolean
│
├── test-event.ts
│   類別: TestEvent
│   職責: 測試用的事件類別
│
└── event-bus-test.utils.ts
    工具函數:
    - createTestEvent(): DomainEvent
    - waitForEvent(eventType, timeout): Promise<DomainEvent>
    - assertEventPublished(eventType): void
```

## Module 配置

```
event-bus.module.ts
│
職責:
- 配置 Event Bus 實作
- 註冊服務
- 提供配置選項

提供的配置方法:
- EventBusModule.forRoot(config): 根模組配置
- EventBusModule.forFeature(): 功能模組配置

配置選項:
- implementation: 'in-memory' | 'firebase' | 'supabase' | 'kafka'
- eventStore: EventStoreConfig
- defaultRetryPolicy: IRetryPolicy
- enableDeadLetterQueue: boolean
```

## 依賴關係圖

```
┌──────────────────────────────────────────────┐
│           Implementations                     │
│  (InMemory, Firebase, Supabase, Kafka)       │
└──────────────────────────────────────────────┘
                    ↑ 實作
┌──────────────────────────────────────────────┐
│              Interfaces                       │
│     (IEventBus, IEventStore, etc.)           │
└──────────────────────────────────────────────┘
                    ↑ 依賴
┌──────────────────────────────────────────────┐
│              Services                         │
│  (Dispatcher, Serializer, Validator)         │
└──────────────────────────────────────────────┘
         ↑ 使用                    ↑ 使用
┌────────────────┐        ┌────────────────────┐
│   Decorators   │        │   Consumers        │
│   (@Subscribe) │        │   (Base Classes)   │
└────────────────┘        └────────────────────┘
         ↑ 使用                    ↑ 繼承
┌──────────────────────────────────────────────┐
│          Feature Modules                      │
│     (Issues, Discussions, Wiki)              │
└──────────────────────────────────────────────┘
```

## 公開 API (index.ts)

```
index.ts 導出:

// Interfaces
- IEventBus
- IEventStore
- ISubscription
- EventHandler
- IRetryPolicy

// Base Classes
- DomainEvent
- EventConsumer
- AsyncEventConsumer

// Decorators
- @Subscribe
- @EventHandler
- @Retry

// Services
- EventDispatcherService
- EventSerializerService

// Constants
- EVENT_BUS (Token)
- EVENT_STORE (Token)

// Module
- EventBusModule

// Errors
- EventBusError
- EventHandlerError

// Testing (僅在測試環境)
- MockEventBus
- TestEvent
```

這個架構設計提供了：
- 清晰的職責分離
- 高度可測試性
- 多種實作選擇
- 完整的錯誤處理
- 靈活的配置選項
- 完善的測試支援