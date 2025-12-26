# Global Event Bus - Level 5: Event Sourcing 與 CQRS

> **演進階段**: 進階架構模式  
> **狀態**: 📝 規劃中  
> **日期**: 2025-12-25

---

## 概述

Event Sourcing (事件溯源) 將事件作為系統的唯一真相來源，結合 CQRS (Command Query Responsibility Segregation) 實現讀寫分離，達到最高的可擴展性和可審計性。

---

## Event Sourcing 核心概念

### 1. 事件即真相

```typescript
// 傳統方式：儲存當前狀態
class Task {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  updatedAt: Date;
}

// Event Sourcing：儲存所有事件
class TaskEventStore {
  events: DomainEvent[] = [
    new TaskCreatedEvent({ ... }),
    new TaskAssignedEvent({ ... }),
    new TaskStatusChangedEvent({ ... }),
    new TaskCompletedEvent({ ... })
  ];
}
```

### 2. 狀態重建

```typescript
export class TaskAggregate {
  private events: DomainEvent[] = [];
  
  // 當前狀態
  private state: Task;
  
  // 從事件重建狀態
  static fromEvents(events: DomainEvent[]): TaskAggregate {
    const aggregate = new TaskAggregate();
    
    for (const event of events) {
      aggregate.apply(event);
    }
    
    return aggregate;
  }
  
  private apply(event: DomainEvent): void {
    this.events.push(event);
    
    // 根據事件類型更新狀態
    switch (event.eventType) {
      case 'task.created':
        this.applyTaskCreated(event as TaskCreatedEvent);
        break;
      case 'task.status.changed':
        this.applyTaskStatusChanged(event as TaskStatusChangedEvent);
        break;
      case 'task.completed':
        this.applyTaskCompleted(event as TaskCompletedEvent);
        break;
    }
  }
  
  private applyTaskCreated(event: TaskCreatedEvent): void {
    this.state = {
      id: event.payload.task.id,
      title: event.payload.task.title,
      status: 'pending',
      createdAt: event.timestamp,
      createdBy: event.payload.creator.id
    };
  }
  
  private applyTaskStatusChanged(event: TaskStatusChangedEvent): void {
    this.state.status = event.payload.newStatus;
    this.state.updatedAt = event.timestamp;
  }
  
  private applyTaskCompleted(event: TaskCompletedEvent): void {
    this.state.status = 'completed';
    this.state.completedAt = event.timestamp;
    this.state.completedBy = event.payload.completedBy.id;
  }
  
  // 獲取當前狀態
  getState(): Task {
    return { ...this.state };
  }
  
  // 獲取事件歷史
  getEvents(): DomainEvent[] {
    return [...this.events];
  }
}
```

---

## 快照 (Snapshots)

### 效能優化策略

當事件數量很大時，每次重建狀態會很慢。快照定期儲存當前狀態。

```typescript
export interface Snapshot<T> {
  aggregateId: string;
  aggregateType: string;
  version: number; // 快照建立時的事件版本
  state: T;
  timestamp: Date;
}

export class SnapshotStore {
  private snapshots = new Map<string, Snapshot<any>>();
  
  save<T>(snapshot: Snapshot<T>): void {
    this.snapshots.set(snapshot.aggregateId, snapshot);
  }
  
  load<T>(aggregateId: string): Snapshot<T> | null {
    return this.snapshots.get(aggregateId) || null;
  }
}

export class TaskAggregate {
  static fromEventsWithSnapshot(
    events: DomainEvent[],
    snapshot?: Snapshot<Task>
  ): TaskAggregate {
    const aggregate = new TaskAggregate();
    
    if (snapshot) {
      // 從快照開始
      aggregate.state = snapshot.state;
      aggregate.version = snapshot.version;
      
      // 只重放快照之後的事件
      const eventsAfterSnapshot = events.filter(
        e => e.timestamp > snapshot.timestamp
      );
      
      for (const event of eventsAfterSnapshot) {
        aggregate.apply(event);
      }
    } else {
      // 沒有快照，重放所有事件
      for (const event of events) {
        aggregate.apply(event);
      }
    }
    
    return aggregate;
  }
  
  createSnapshot(): Snapshot<Task> {
    return {
      aggregateId: this.state.id,
      aggregateType: 'task',
      version: this.version,
      state: { ...this.state },
      timestamp: new Date()
    };
  }
}
```

### 快照策略

```typescript
export class SnapshotStrategy {
  // 每 N 個事件建立快照
  shouldCreateSnapshot(eventCount: number, threshold: number = 100): boolean {
    return eventCount % threshold === 0;
  }
  
  // 時間間隔快照
  shouldCreateSnapshotByTime(
    lastSnapshot: Date,
    intervalMs: number = 3600000 // 1 hour
  ): boolean {
    return Date.now() - lastSnapshot.getTime() > intervalMs;
  }
}
```

---

## CQRS 架構

### 讀寫分離

```
┌─────────────────────────────────────────────────┐
│                  Write Side (Commands)           │
├─────────────────────────────────────────────────┤
│  CreateTaskCommand → TaskAggregate → EventStore │
│  UpdateTaskCommand → TaskAggregate → EventStore │
└─────────────────────────────────────────────────┘
                        ↓ events
┌─────────────────────────────────────────────────┐
│                   Event Bus                      │
└─────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────┐
│                  Read Side (Queries)             │
├─────────────────────────────────────────────────┤
│  Projections:                                    │
│  - TaskListProjection → Read Database           │
│  - TaskDetailsProjection → Read Database        │
│  - TaskStatisticsProjection → Read Database     │
└─────────────────────────────────────────────────┘
```

### Command 實作

```typescript
export interface Command {
  readonly commandId: string;
  readonly commandType: string;
  readonly aggregateId: string;
  readonly timestamp: Date;
}

export class CreateTaskCommand implements Command {
  readonly commandId = crypto.randomUUID();
  readonly commandType = 'task.create';
  readonly aggregateId: string;
  readonly timestamp = new Date();
  
  constructor(
    public readonly data: {
      title: string;
      description?: string;
      blueprintId: string;
      creatorId: string;
    }
  ) {
    this.aggregateId = crypto.randomUUID(); // 新任務ID
  }
}

export class UpdateTaskStatusCommand implements Command {
  readonly commandId = crypto.randomUUID();
  readonly commandType = 'task.updateStatus';
  readonly timestamp = new Date();
  
  constructor(
    public readonly aggregateId: string,
    public readonly data: {
      newStatus: TaskStatus;
      userId: string;
    }
  ) {}
}
```

### Command Handler

```typescript
@Injectable()
export class TaskCommandHandler {
  private eventStore = inject(EventStore);
  private eventBus = inject(InMemoryEventBus);
  
  async handle(command: CreateTaskCommand): Promise<Task> {
    // 1. 創建 Aggregate
    const aggregate = new TaskAggregate();
    
    // 2. 執行業務邏輯（產生事件）
    const event = new TaskCreatedEvent({
      task: {
        id: command.aggregateId,
        title: command.data.title,
        description: command.data.description,
        status: 'pending'
      },
      blueprintId: command.data.blueprintId,
      creator: await this.userService.findById(command.data.creatorId)
    });
    
    // 3. 儲存事件
    await this.eventStore.append(event);
    
    // 4. 發布事件
    await this.eventBus.publish(event);
    
    // 5. 返回結果
    aggregate.apply(event);
    return aggregate.getState();
  }
  
  async handle(command: UpdateTaskStatusCommand): Promise<Task> {
    // 1. 載入 Aggregate
    const events = await this.eventStore.query({
      aggregateId: command.aggregateId,
      aggregateType: 'task'
    });
    
    const aggregate = TaskAggregate.fromEvents(events);
    
    // 2. 驗證業務規則
    const currentState = aggregate.getState();
    if (currentState.status === 'completed') {
      throw new Error('Cannot change status of completed task');
    }
    
    // 3. 產生事件
    const event = new TaskStatusChangedEvent({
      task: currentState,
      newStatus: command.data.newStatus,
      previousStatus: currentState.status,
      changedBy: await this.userService.findById(command.data.userId)
    });
    
    // 4. 儲存並發布
    await this.eventStore.append(event);
    await this.eventBus.publish(event);
    
    // 5. 返回更新後的狀態
    aggregate.apply(event);
    return aggregate.getState();
  }
}
```

### Projection (讀模型)

```typescript
export class TaskListProjection {
  private tasks = signal<TaskListItem[]>([]);
  
  // 訂閱事件並更新讀模型
  @Subscribe('task.created')
  async onTaskCreated(event: TaskCreatedEvent): Promise<void> {
    this.tasks.update(tasks => [
      ...tasks,
      {
        id: event.payload.task.id,
        title: event.payload.task.title,
        status: event.payload.task.status,
        createdAt: event.timestamp,
        createdBy: event.payload.creator.name
      }
    ]);
  }
  
  @Subscribe('task.status.changed')
  async onTaskStatusChanged(event: TaskStatusChangedEvent): Promise<void> {
    this.tasks.update(tasks =>
      tasks.map(task =>
        task.id === event.aggregateId
          ? { ...task, status: event.payload.newStatus }
          : task
      )
    );
  }
  
  // 查詢方法
  getAll(): TaskListItem[] {
    return this.tasks();
  }
  
  getByStatus(status: TaskStatus): TaskListItem[] {
    return this.tasks().filter(t => t.status === status);
  }
}
```

---

## 時間旅行 (Time Travel)

### 狀態回溯

```typescript
export class TimeTravelService {
  async getStateAtTime<T>(
    aggregateId: string,
    targetTime: Date
  ): Promise<T> {
    // 取得目標時間之前的所有事件
    const events = await this.eventStore.query({
      aggregateId,
      toTimestamp: targetTime
    });
    
    // 重建狀態
    const aggregate = TaskAggregate.fromEvents(events);
    return aggregate.getState() as T;
  }
  
  async getStateAtVersion<T>(
    aggregateId: string,
    version: number
  ): Promise<T> {
    const events = await this.eventStore.query({
      aggregateId,
      limit: version
    });
    
    const aggregate = TaskAggregate.fromEvents(events);
    return aggregate.getState() as T;
  }
}
```

### 事件重放 (Replay)

```typescript
export class EventReplayService {
  async replay(
    from: Date,
    to: Date,
    eventTypes?: string[]
  ): Promise<void> {
    // 取得時間範圍內的事件
    const events = await this.eventStore.query({
      fromTimestamp: from,
      toTimestamp: to,
      eventType: eventTypes
    });
    
    // 重新發布事件
    for (const event of events) {
      await this.eventBus.publish(event);
    }
  }
  
  async replayForAggregate(aggregateId: string): Promise<void> {
    const events = await this.eventStore.query({ aggregateId });
    
    for (const event of events) {
      await this.eventBus.publish(event);
    }
  }
}
```

---

## 事件補償 (Compensation)

### Saga 模式

```typescript
export class TaskCreationSaga {
  @Subscribe('task.created')
  async onTaskCreated(event: TaskCreatedEvent): Promise<void> {
    try {
      // 1. 通知被指派人
      await this.notificationService.send(...);
      
      // 2. 更新搜尋索引
      await this.searchService.index(...);
      
      // 3. 記錄分析數據
      await this.analyticsService.track(...);
      
    } catch (error) {
      // 發布補償事件
      await this.eventBus.publish(
        new TaskCreationFailedEvent({
          taskId: event.aggregateId,
          reason: error.message
        })
      );
    }
  }
  
  @Subscribe('task.creation.failed')
  async onTaskCreationFailed(event: TaskCreationFailedEvent): Promise<void> {
    // 回滾操作
    await this.taskRepository.delete(event.payload.taskId);
  }
}
```

---

## 優勢與挑戰

### 優勢 ✅

1. **完整審計日誌**: 所有變更都有記錄
2. **時間旅行**: 可以查看任意時間點的狀態
3. **事件重放**: 可以修復錯誤或遷移資料
4. **高擴展性**: 讀寫分離，各自優化
5. **業務洞察**: 完整事件歷史提供分析價值

### 挑戰 ⚠️

1. **學習曲線**: 概念較複雜
2. **最終一致性**: 讀寫之間有延遲
3. **儲存成本**: 事件數量會持續增長
4. **事件演進**: 需要版本控制策略
5. **除錯困難**: 問題排查需要分析事件鏈

---

## 下一步（Level 6）

Level 6 將涵蓋：

1. **分散式事件匯流排**: Kafka, RabbitMQ 整合
2. **分散式追蹤**: OpenTelemetry
3. **事件串流處理**: Real-time analytics
4. **跨服務事件**: Microservices communication
5. **Saga 編排**: 分散式交易

---

**文檔版本**: 5.0  
**最後更新**: 2025-12-25  
**維護者**: GigHub 開發團隊
