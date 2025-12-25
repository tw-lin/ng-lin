# Global Event Bus - Level 4: 事件版本控制與演進

> **演進階段**: 長期維護與演進策略  
> **狀態**: 📝 規劃中  
> **日期**: 2025-12-25

---

## 概述

隨著系統演進，事件結構需要變更以適應新需求。本文檔定義事件版本控制策略，確保向後兼容性並支援平滑升級。

---

## 事件版本控制原則

### 1. 語義化版本控制

事件版本遵循語義化版本規範 (Semver):

```
major.minor.patch

例: 1.2.3
- major: 不兼容的變更
- minor: 向後兼容的新增功能
- patch: 向後兼容的bug修復
```

### 2. 版本演進範例

#### 版本 1.0: 初始版本

```typescript
export class TaskCreatedEvent extends DomainEvent {
  readonly eventType = 'task.created' as const;
  
  readonly payload: {
    task: {
      id: string;
      title: string;
      status: 'pending' | 'in-progress' | 'completed';
    };
    creator: {
      id: string;
      name: string;
    };
  };
  
  constructor(data: TaskCreatedEvent['payload']) {
    super({
      aggregateId: data.task.id,
      aggregateType: 'task',
      metadata: { version: '1.0' }
    });
    this.payload = data;
  }
}
```

#### 版本 1.1: 新增可選欄位（向後兼容）

```typescript
export class TaskCreatedEvent extends DomainEvent {
  readonly eventType = 'task.created' as const;
  
  readonly payload: {
    task: {
      id: string;
      title: string;
      status: 'pending' | 'in-progress' | 'completed';
      description?: string; // 新增：可選欄位
      priority?: 'low' | 'medium' | 'high'; // 新增：可選欄位
    };
    creator: {
      id: string;
      name: string;
      email?: string; // 新增：可選欄位
    };
  };
  
  constructor(data: TaskCreatedEvent['payload']) {
    super({
      aggregateId: data.task.id,
      aggregateType: 'task',
      metadata: { version: '1.1' }
    });
    this.payload = data;
  }
}
```

#### 版本 2.0: 破壞性變更（不兼容）

```typescript
export class TaskCreatedEvent extends DomainEvent {
  readonly eventType = 'task.created' as const;
  
  readonly payload: {
    task: {
      id: string;
      title: string;
      // 破壞性變更：狀態欄位重構
      state: {
        status: 'pending' | 'in-progress' | 'completed' | 'archived';
        subStatus?: string;
        transitions: StateTransition[];
      };
      description?: string;
      priority?: 'low' | 'medium' | 'high';
    };
    // 破壞性變更：creator 改為 createdBy
    createdBy: {
      id: string;
      name: string;
      email: string; // 現在是必填
      role: string;
    };
    // 新增：blueprint 資訊
    blueprint: {
      id: string;
      name: string;
    };
  };
  
  constructor(data: TaskCreatedEvent['payload']) {
    super({
      aggregateId: data.task.id,
      aggregateType: 'task',
      metadata: { version: '2.0' }
    });
    this.payload = data;
  }
}
```

---

## 事件轉換器 (Event Upcasters)

### 概念

事件轉換器負責將舊版本事件轉換為新版本，確保消費者只需處理最新版本。

### 實作範例

```typescript
export interface EventUpcaster<TFrom, TTo> {
  readonly fromVersion: string;
  readonly toVersion: string;
  upcast(event: TFrom): TTo;
}

export class TaskCreatedEventUpcaster_1_0_to_1_1 
  implements EventUpcaster<TaskCreatedEventV1_0, TaskCreatedEventV1_1> 
{
  readonly fromVersion = '1.0';
  readonly toVersion = '1.1';
  
  upcast(event: TaskCreatedEventV1_0): TaskCreatedEventV1_1 {
    return {
      ...event,
      metadata: {
        ...event.metadata,
        version: '1.1'
      },
      payload: {
        task: {
          ...event.payload.task,
          description: undefined, // 新欄位預設值
          priority: undefined
        },
        creator: {
          ...event.payload.creator,
          email: undefined
        }
      }
    };
  }
}

export class TaskCreatedEventUpcaster_1_1_to_2_0 
  implements EventUpcaster<TaskCreatedEventV1_1, TaskCreatedEventV2_0> 
{
  readonly fromVersion = '1.1';
  readonly toVersion = '2.0';
  
  upcast(event: TaskCreatedEventV1_1): TaskCreatedEventV2_0 {
    return {
      ...event,
      metadata: {
        ...event.metadata,
        version: '2.0'
      },
      payload: {
        task: {
          id: event.payload.task.id,
          title: event.payload.task.title,
          // 轉換狀態結構
          state: {
            status: event.payload.task.status,
            subStatus: undefined,
            transitions: []
          },
          description: event.payload.task.description,
          priority: event.payload.task.priority
        },
        // creator → createdBy
        createdBy: {
          id: event.payload.creator.id,
          name: event.payload.creator.name,
          email: event.payload.creator.email || 'unknown@example.com',
          role: 'member' // 預設角色
        },
        // 新增欄位（需要額外資料來源）
        blueprint: {
          id: 'unknown',
          name: 'Unknown Blueprint'
        }
      }
    };
  }
}
```

---

## 事件版本管理器

### UpcasterChain

自動管理版本鏈，將任意版本轉換為目標版本。

```typescript
export class UpcasterChain {
  private upcasters = new Map<string, EventUpcaster<any, any>>();
  
  register(upcaster: EventUpcaster<any, any>): void {
    const key = `${upcaster.fromVersion}_to_${upcaster.toVersion}`;
    this.upcasters.set(key, upcaster);
  }
  
  upcast<TTarget>(
    event: DomainEvent,
    targetVersion: string
  ): TTarget {
    const currentVersion = event.metadata.version;
    
    if (currentVersion === targetVersion) {
      return event as unknown as TTarget;
    }
    
    // 找到版本升級路徑
    const path = this.findUpcastPath(currentVersion, targetVersion);
    
    if (!path) {
      throw new Error(
        `No upcast path from ${currentVersion} to ${targetVersion}`
      );
    }
    
    // 依序執行轉換
    let result: any = event;
    for (const step of path) {
      result = step.upcast(result);
    }
    
    return result as TTarget;
  }
  
  private findUpcastPath(
    fromVersion: string,
    toVersion: string
  ): EventUpcaster<any, any>[] | null {
    // 實作廣度優先搜尋找到版本升級路徑
    // 簡化版本：假設版本是線性的
    const path: EventUpcaster<any, any>[] = [];
    let current = fromVersion;
    
    while (current !== toVersion) {
      const next = this.findNextVersion(current);
      if (!next) return null;
      
      const key = `${current}_to_${next}`;
      const upcaster = this.upcasters.get(key);
      if (!upcaster) return null;
      
      path.push(upcaster);
      current = next;
    }
    
    return path;
  }
  
  private findNextVersion(version: string): string | null {
    // 找到下一個版本
    for (const [key, upcaster] of this.upcasters.entries()) {
      if (upcaster.fromVersion === version) {
        return upcaster.toVersion;
      }
    }
    return null;
  }
}
```

---

## 版本化 EventBus

### 自動轉換版本

```typescript
@Injectable({ providedIn: 'root' })
export class VersionedEventBus implements IEventBus {
  private readonly innerBus = inject(InMemoryEventBus);
  private readonly upcasterChain = new UpcasterChain();
  
  constructor() {
    // 註冊所有轉換器
    this.upcasterChain.register(new TaskCreatedEventUpcaster_1_0_to_1_1());
    this.upcasterChain.register(new TaskCreatedEventUpcaster_1_1_to_2_0());
    // ... 其他轉換器
  }
  
  async publish(event: DomainEvent): Promise<void> {
    // 發布時不轉換，保留原始版本
    return this.innerBus.publish(event);
  }
  
  observe<T extends DomainEvent>(
    eventType: string,
    targetVersion: string = 'latest'
  ): Observable<T> {
    return this.innerBus.observe(eventType).pipe(
      map(event => {
        // 自動轉換到目標版本
        if (targetVersion === 'latest') {
          return this.upcasterChain.upcast<T>(event, this.getLatestVersion(eventType));
        }
        return this.upcasterChain.upcast<T>(event, targetVersion);
      })
    );
  }
  
  private getLatestVersion(eventType: string): string {
    // 從事件類型映射獲取最新版本
    const versionMap: Record<string, string> = {
      'task.created': '2.0',
      'task.updated': '1.5',
      // ...
    };
    return versionMap[eventType] || '1.0';
  }
  
  readonly totalEvents = this.innerBus.totalEvents;
  readonly subscriptionCount = this.innerBus.subscriptionCount;
  readonly failedEvents = this.innerBus.failedEvents;
  
  publishBatch = this.innerBus.publishBatch.bind(this.innerBus);
  observeAll = this.innerBus.observeAll.bind(this.innerBus);
}
```

---

## 消費者版本處理

### 方式 1: 只處理最新版本

```typescript
@Injectable()
export class NotificationConsumer extends EventConsumer {
  @Subscribe('task.created', { 
    version: '2.0', // 明確指定版本
    retryPolicy: { ... }
  })
  async onTaskCreated(event: TaskCreatedEventV2_0): Promise<void> {
    // 只需處理 v2.0 結構
    const { task, createdBy, blueprint } = event.payload;
    
    await this.notificationService.send({
      title: `新任務：${task.title}`,
      body: `${createdBy.name} 在「${blueprint.name}」創建了新任務`,
      // ...
    });
  }
}
```

### 方式 2: 支援多版本（逐步遷移）

```typescript
@Injectable()
export class LegacyNotificationConsumer extends EventConsumer {
  @Subscribe('task.created', { version: '1.0' })
  async onTaskCreatedV1(event: TaskCreatedEventV1_0): Promise<void> {
    // 處理 v1.0 事件
    this.handleTaskCreated({
      task: event.payload.task,
      creator: event.payload.creator,
      blueprint: null // v1.0 沒有 blueprint
    });
  }
  
  @Subscribe('task.created', { version: '2.0' })
  async onTaskCreatedV2(event: TaskCreatedEventV2_0): Promise<void> {
    // 處理 v2.0 事件
    this.handleTaskCreated({
      task: {
        id: event.payload.task.id,
        title: event.payload.task.title,
        status: event.payload.task.state.status
      },
      creator: {
        id: event.payload.createdBy.id,
        name: event.payload.createdBy.name
      },
      blueprint: event.payload.blueprint
    });
  }
  
  private handleTaskCreated(data: NormalizedTaskCreated): void {
    // 共用處理邏輯
  }
}
```

---

## 事件儲存版本化

### EventStore 支援版本查詢

```typescript
export interface IEventStore {
  // 現有方法
  append(event: DomainEvent): Promise<void>;
  query(options: QueryOptions): Promise<DomainEvent[]>;
  
  // 新增：版本化查詢
  queryWithVersion(
    options: QueryOptions & { version?: string }
  ): Promise<DomainEvent[]>;
  
  // 新增：獲取事件版本歷史
  getVersionHistory(eventType: string): Promise<EventVersionInfo[]>;
}

export interface EventVersionInfo {
  version: string;
  introducedAt: Date;
  deprecatedAt?: Date;
  description: string;
}
```

### 實作範例

```typescript
@Injectable({ providedIn: 'root' })
export class VersionedEventStore implements IEventStore {
  private readonly innerStore = inject(InMemoryEventStore);
  private readonly upcasterChain = inject(UpcasterChain);
  
  async queryWithVersion(
    options: QueryOptions & { version?: string }
  ): Promise<DomainEvent[]> {
    const events = await this.innerStore.query(options);
    
    if (!options.version) {
      return events;
    }
    
    // 轉換到指定版本
    return events.map(event => 
      this.upcasterChain.upcast(event, options.version!)
    );
  }
  
  async getVersionHistory(eventType: string): Promise<EventVersionInfo[]> {
    // 從元數據儲存查詢版本歷史
    return [
      {
        version: '1.0',
        introducedAt: new Date('2024-01-01'),
        description: 'Initial version'
      },
      {
        version: '1.1',
        introducedAt: new Date('2024-06-01'),
        description: 'Added optional description and priority fields'
      },
      {
        version: '2.0',
        introducedAt: new Date('2025-01-01'),
        description: 'Restructured status field and renamed creator to createdBy'
      }
    ];
  }
  
  // 委派其他方法
  append = this.innerStore.append.bind(this.innerStore);
  query = this.innerStore.query.bind(this.innerStore);
  replay = this.innerStore.replay.bind(this.innerStore);
}
```

---

## 版本遷移策略

### 1. 藍綠部署（Blue-Green Deployment）

```
Phase 1: 部署新版本（支援 v1.0 和 v2.0）
├─ 新消費者同時監聽兩個版本
├─ 新生產者發布 v2.0 事件
└─ 舊消費者繼續處理 v1.0

Phase 2: 驗證期（監控錯誤率和效能）
├─ 比較新舊消費者處理結果
└─ 確認 v2.0 事件正確處理

Phase 3: 逐步遷移
├─ 將流量逐步切換到 v2.0 消費者
├─ 監控系統健康度
└─ 準備回滾計畫

Phase 4: 淘汰舊版本
├─ 停止發布 v1.0 事件
├─ 移除 v1.0 消費者
└─ 保留轉換器供歷史事件重放
```

### 2. 特性開關（Feature Flags）

```typescript
@Injectable()
export class TaskService {
  private readonly eventBus = inject(VersionedEventBus);
  private readonly featureFlags = inject(FeatureFlagService);
  
  async createTask(data: CreateTaskInput): Promise<Task> {
    const task = await this.taskRepository.create(data);
    
    // 根據特性開關決定事件版本
    const useV2Events = await this.featureFlags.isEnabled('task-events-v2');
    
    if (useV2Events) {
      await this.eventBus.publish(new TaskCreatedEventV2_0({ ... }));
    } else {
      await this.eventBus.publish(new TaskCreatedEventV1_0({ ... }));
    }
    
    return task;
  }
}
```

---

## 版本棄用政策

### 棄用通知

```typescript
export interface DeprecationWarning {
  eventType: string;
  version: string;
  deprecatedAt: Date;
  removedAt: Date; // 預計移除日期
  migrationGuide: string; // 遷移指南連結
}

export class EventDeprecationService {
  private warnings = signal<DeprecationWarning[]>([]);
  
  registerDeprecation(warning: DeprecationWarning): void {
    this.warnings.update(warnings => [...warnings, warning]);
    
    // 記錄警告
    console.warn(
      `Event ${warning.eventType} v${warning.version} is deprecated. ` +
      `It will be removed on ${warning.removedAt.toISOString()}. ` +
      `See migration guide: ${warning.migrationGuide}`
    );
  }
  
  checkDeprecations(event: DomainEvent): void {
    const warning = this.warnings().find(
      w => w.eventType === event.eventType && w.version === event.metadata.version
    );
    
    if (warning) {
      // 發出棄用警告
      console.warn(`Using deprecated event: ${warning.eventType} v${warning.version}`);
    }
  }
}
```

### 棄用時程範例

```
v1.0 (2024-01-01 發布)
├─ 2024-12-31: 標記為棄用
├─ 2025-06-30: 最後支援日期
└─ 2025-07-01: 移除支援

v1.1 (2024-06-01 發布)
├─ 2025-12-31: 標記為棄用
├─ 2026-06-30: 最後支援日期
└─ 2026-07-01: 移除支援

v2.0 (2025-01-01 發布)
└─ 當前版本
```

---

## 測試版本轉換

### 單元測試

```typescript
describe('TaskCreatedEventUpcaster_1_0_to_1_1', () => {
  let upcaster: TaskCreatedEventUpcaster_1_0_to_1_1;
  
  beforeEach(() => {
    upcaster = new TaskCreatedEventUpcaster_1_0_to_1_1();
  });
  
  it('should upcast v1.0 to v1.1', () => {
    const v1Event: TaskCreatedEventV1_0 = {
      eventId: '123',
      eventType: 'task.created',
      timestamp: new Date(),
      aggregateId: 'task-1',
      aggregateType: 'task',
      metadata: { version: '1.0' },
      payload: {
        task: { id: 'task-1', title: 'Test', status: 'pending' },
        creator: { id: 'user-1', name: 'John' }
      }
    };
    
    const v1_1Event = upcaster.upcast(v1Event);
    
    expect(v1_1Event.metadata.version).toBe('1.1');
    expect(v1_1Event.payload.task.description).toBeUndefined();
    expect(v1_1Event.payload.task.priority).toBeUndefined();
    expect(v1_1Event.payload.creator.email).toBeUndefined();
  });
});
```

### 整合測試

```typescript
describe('UpcasterChain', () => {
  let chain: UpcasterChain;
  
  beforeEach(() => {
    chain = new UpcasterChain();
    chain.register(new TaskCreatedEventUpcaster_1_0_to_1_1());
    chain.register(new TaskCreatedEventUpcaster_1_1_to_2_0());
  });
  
  it('should upcast from v1.0 to v2.0', () => {
    const v1Event = createTaskCreatedEventV1_0();
    
    const v2Event = chain.upcast<TaskCreatedEventV2_0>(v1Event, '2.0');
    
    expect(v2Event.metadata.version).toBe('2.0');
    expect(v2Event.payload.createdBy).toBeDefined();
    expect(v2Event.payload.blueprint).toBeDefined();
  });
});
```

---

## 最佳實踐

### ✅ DO

1. **總是設定版本號**: 每個事件都應有明確的版本
2. **向後兼容優先**: 優先使用新增可選欄位
3. **提供轉換器**: 為每個版本變更提供轉換器
4. **文檔化變更**: 清楚記錄每個版本的變更
5. **測試轉換邏輯**: 確保版本轉換正確無誤
6. **提前通知棄用**: 至少提前 6 個月通知

### ❌ DON'T

1. **不要刪除欄位**: 使用可選欄位標記為 deprecated
2. **不要立即移除舊版本**: 保留至少一年的支援期
3. **不要跳過版本**: 提供所有中間版本的轉換器
4. **不要假設轉換總是成功**: 處理轉換失敗情況

---

## 下一步（Level 5）

Level 5 將涵蓋：

1. **事件溯源 (Event Sourcing)**: 完整事件歷史作為系統真相來源
2. **快照 (Snapshots)**: 效能優化策略
3. **時間旅行 (Time Travel)**: 狀態回溯與重建
4. **事件重放 (Event Replay)**: 修復錯誤與資料遷移
5. **CQRS 模式**: Command/Query 責任分離

---

**文檔版本**: 4.0  
**最後更新**: 2025-12-25  
**維護者**: GigHub 開發團隊
