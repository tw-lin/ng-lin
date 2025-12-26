# Global Event Bus - Level 3: 領域事件與消費者實作

> **演進階段**: 實際業務整合  
> **狀態**: 📝 規劃中  
> **日期**: 2025-12-25

---

## 概述

本文檔定義 GigHub 系統的完整領域事件集合，並實作對應的事件消費者。基於 Level 2 的基礎架構，將事件系統整合到實際業務流程中。

---

## 領域事件定義

### 1. Blueprint Events（藍圖事件）

#### 1.1 blueprint.created

```typescript
export class BlueprintCreatedEvent extends DomainEvent {
  readonly eventType = 'blueprint.created' as const;
  readonly aggregateType = 'blueprint' as const;
  
  readonly payload: {
    blueprint: Blueprint;
    owner: User | Organization;
    creator: User;
    initialMembers: BlueprintMember[];
  };
  
  constructor(data: BlueprintCreatedEvent['payload']) {
    super({
      aggregateId: data.blueprint.id,
      aggregateType: 'blueprint',
      metadata: {
        version: '1.0',
        source: 'blueprint-service',
        userContext: {
          userId: data.creator.id,
          roles: ['creator'],
          permissions: ['blueprint:manage']
        }
      }
    });
    this.payload = data;
  }
}
```

#### 1.2 blueprint.updated

```typescript
export class BlueprintUpdatedEvent extends DomainEvent {
  readonly eventType = 'blueprint.updated' as const;
  readonly aggregateType = 'blueprint' as const;
  
  readonly payload: {
    blueprint: Blueprint;
    changes: Partial<Blueprint>;
    updatedBy: User;
    previousVersion?: Blueprint;
  };
}
```

#### 1.3 blueprint.member.added

```typescript
export class BlueprintMemberAddedEvent extends DomainEvent {
  readonly eventType = 'blueprint.member.added' as const;
  readonly aggregateType = 'blueprint' as const;
  
  readonly payload: {
    blueprint: Blueprint;
    member: BlueprintMember;
    addedBy: User;
    permissions: string[];
  };
}
```

#### 1.4 blueprint.member.removed

```typescript
export class BlueprintMemberRemovedEvent extends DomainEvent {
  readonly eventType = 'blueprint.member.removed' as const;
  readonly aggregateType = 'blueprint' as const;
  
  readonly payload: {
    blueprint: Blueprint;
    member: BlueprintMember;
    removedBy: User;
    reason?: string;
  };
}
```

#### 1.5 blueprint.archived

```typescript
export class BlueprintArchivedEvent extends DomainEvent {
  readonly eventType = 'blueprint.archived' as const;
  readonly aggregateType = 'blueprint' as const;
  
  readonly payload: {
    blueprint: Blueprint;
    archivedBy: User;
    reason?: string;
  };
}
```

---

### 2. Task Events（任務事件）

#### 2.1 task.created

```typescript
export class TaskCreatedEvent extends DomainEvent {
  readonly eventType = 'task.created' as const;
  readonly aggregateType = 'task' as const;
  
  readonly payload: {
    task: Task;
    blueprint: Blueprint;
    creator: User;
    assignee?: User | Team | Partner;
  };
}
```

#### 2.2 task.assigned

```typescript
export class TaskAssignedEvent extends DomainEvent {
  readonly eventType = 'task.assigned' as const;
  readonly aggregateType = 'task' as const;
  
  readonly payload: {
    task: Task;
    assignee: User | Team | Partner;
    assignedBy: User;
    previousAssignee?: User | Team | Partner;
  };
}
```

#### 2.3 task.status.changed

```typescript
export class TaskStatusChangedEvent extends DomainEvent {
  readonly eventType = 'task.status.changed' as const;
  readonly aggregateType = 'task' as const;
  
  readonly payload: {
    task: Task;
    newStatus: TaskStatus;
    previousStatus: TaskStatus;
    changedBy: User;
    comment?: string;
  };
}
```

#### 2.4 task.completed

```typescript
export class TaskCompletedEvent extends DomainEvent {
  readonly eventType = 'task.completed' as const;
  readonly aggregateType = 'task' as const;
  
  readonly payload: {
    task: Task;
    completedBy: User;
    completionTime: Date;
    result?: TaskResult;
  };
}
```

#### 2.5 task.comment.added

```typescript
export class TaskCommentAddedEvent extends DomainEvent {
  readonly eventType = 'task.comment.added' as const;
  readonly aggregateType = 'task' as const;
  
  readonly payload: {
    task: Task;
    comment: Comment;
    author: User;
  };
}
```

---

### 3. User Events（用戶事件）

#### 3.1 user.registered

```typescript
export class UserRegisteredEvent extends DomainEvent {
  readonly eventType = 'user.registered' as const;
  readonly aggregateType = 'user' as const;
  
  readonly payload: {
    user: User;
    registrationMethod: 'email' | 'google' | 'anonymous';
    ipAddress?: string;
  };
}
```

#### 3.2 user.profile.updated

```typescript
export class UserProfileUpdatedEvent extends DomainEvent {
  readonly eventType = 'user.profile.updated' as const;
  readonly aggregateType = 'user' as const;
  
  readonly payload: {
    user: User;
    changes: Partial<User>;
    updatedBy: User;
  };
}
```

---

### 4. Organization Events（組織事件）

#### 4.1 organization.created

```typescript
export class OrganizationCreatedEvent extends DomainEvent {
  readonly eventType = 'organization.created' as const;
  readonly aggregateType = 'organization' as const;
  
  readonly payload: {
    organization: Organization;
    owner: User;
    initialMembers: OrganizationMember[];
  };
}
```

#### 4.2 organization.member.added

```typescript
export class OrganizationMemberAddedEvent extends DomainEvent {
  readonly eventType = 'organization.member.added' as const;
  readonly aggregateType = 'organization' as const;
  
  readonly payload: {
    organization: Organization;
    member: OrganizationMember;
    addedBy: User;
    role: OrganizationRole;
  };
}
```

---

### 5. Notification Events（通知事件）

#### 5.1 notification.sent

```typescript
export class NotificationSentEvent extends DomainEvent {
  readonly eventType = 'notification.sent' as const;
  readonly aggregateType = 'notification' as const;
  
  readonly payload: {
    notification: Notification;
    recipients: User[];
    channels: ('email' | 'push' | 'in-app')[];
  };
}
```

#### 5.2 notification.read

```typescript
export class NotificationReadEvent extends DomainEvent {
  readonly eventType = 'notification.read' as const;
  readonly aggregateType = 'notification' as const;
  
  readonly payload: {
    notification: Notification;
    readBy: User;
    readAt: Date;
  };
}
```

---

## 事件消費者實作

### 1. NotificationConsumer

負責監聽所有需要通知的事件，並發送通知。

```typescript
@Injectable({ providedIn: 'root' })
export class NotificationConsumer extends EventConsumer {
  private readonly notificationService = inject(NotificationService);
  private readonly userService = inject(UserService);
  
  // 任務創建通知
  @Subscribe('task.created', {
    retryPolicy: {
      maxAttempts: 3,
      backoff: 'exponential',
      initialDelay: 1000
    }
  })
  async onTaskCreated(event: TaskCreatedEvent): Promise<void> {
    const { task, blueprint, assignee } = event.payload;
    
    // 通知被指派人
    if (assignee) {
      await this.notificationService.send({
        type: 'task_assigned',
        recipients: await this.resolveRecipients(assignee),
        title: `新任務：${task.title}`,
        body: `您被指派了新任務「${task.title}」在藍圖「${blueprint.name}」中`,
        data: {
          taskId: task.id,
          blueprintId: blueprint.id,
          link: `/blueprints/${blueprint.id}/tasks/${task.id}`
        }
      });
    }
    
    // 通知藍圖成員
    const watchers = await this.userService.getBlueprintWatchers(blueprint.id);
    if (watchers.length > 0) {
      await this.notificationService.send({
        type: 'task_created',
        recipients: watchers,
        title: `新任務：${task.title}`,
        body: `${event.payload.creator.name} 在「${blueprint.name}」創建了新任務`,
        data: {
          taskId: task.id,
          blueprintId: blueprint.id
        }
      });
    }
  }
  
  // 任務狀態變更通知
  @Subscribe('task.status.changed')
  async onTaskStatusChanged(event: TaskStatusChangedEvent): Promise<void> {
    const { task, newStatus, changedBy } = event.payload;
    
    // 通知任務創建者
    await this.notificationService.send({
      type: 'task_status_changed',
      recipients: [await this.userService.findById(task.createdBy)],
      title: `任務狀態更新：${task.title}`,
      body: `${changedBy.name} 將任務狀態變更為「${newStatus}」`,
      data: { taskId: task.id }
    });
  }
  
  // 任務完成通知
  @Subscribe('task.completed')
  async onTaskCompleted(event: TaskCompletedEvent): Promise<void> {
    const { task, completedBy } = event.payload;
    
    // 通知所有相關人員
    const stakeholders = await this.userService.getTaskStakeholders(task.id);
    
    await this.notificationService.send({
      type: 'task_completed',
      recipients: stakeholders,
      title: `任務完成：${task.title}`,
      body: `${completedBy.name} 完成了任務「${task.title}」`,
      data: { taskId: task.id }
    });
  }
  
  // 藍圖成員新增通知
  @Subscribe('blueprint.member.added')
  async onBlueprintMemberAdded(event: BlueprintMemberAddedEvent): Promise<void> {
    const { blueprint, member, addedBy } = event.payload;
    
    await this.notificationService.send({
      type: 'blueprint_member_added',
      recipients: await this.resolveRecipients(member),
      title: `您被加入藍圖：${blueprint.name}`,
      body: `${addedBy.name} 將您加入藍圖「${blueprint.name}」`,
      data: { blueprintId: blueprint.id }
    });
  }
  
  private async resolveRecipients(
    assignee: User | Team | Partner
  ): Promise<User[]> {
    if ('email' in assignee) {
      // User
      return [assignee as User];
    } else if ('organizationId' in assignee) {
      // Team or Partner
      return this.userService.getTeamMembers(assignee.id);
    }
    return [];
  }
}
```

---

### 2. ActivityFeedConsumer

負責更新用戶和藍圖的活動動態。

```typescript
@Injectable({ providedIn: 'root' })
export class ActivityFeedConsumer extends EventConsumer {
  private readonly activityService = inject(ActivityFeedService);
  
  // 任務創建活動
  @Subscribe('task.created')
  async onTaskCreated(event: TaskCreatedEvent): Promise<void> {
    const { task, blueprint, creator } = event.payload;
    
    await this.activityService.create({
      type: 'task_created',
      actor: creator,
      blueprintId: blueprint.id,
      targetType: 'task',
      targetId: task.id,
      description: `創建了任務「${task.title}」`,
      timestamp: event.timestamp
    });
  }
  
  // 任務狀態變更活動
  @Subscribe('task.status.changed')
  async onTaskStatusChanged(event: TaskStatusChangedEvent): Promise<void> {
    const { task, newStatus, previousStatus, changedBy } = event.payload;
    
    await this.activityService.create({
      type: 'task_status_changed',
      actor: changedBy,
      blueprintId: task.blueprintId,
      targetType: 'task',
      targetId: task.id,
      description: `將任務「${task.title}」狀態從「${previousStatus}」變更為「${newStatus}」`,
      timestamp: event.timestamp
    });
  }
  
  // 藍圖創建活動
  @Subscribe('blueprint.created')
  async onBlueprintCreated(event: BlueprintCreatedEvent): Promise<void> {
    const { blueprint, creator } = event.payload;
    
    await this.activityService.create({
      type: 'blueprint_created',
      actor: creator,
      blueprintId: blueprint.id,
      targetType: 'blueprint',
      targetId: blueprint.id,
      description: `創建了藍圖「${blueprint.name}」`,
      timestamp: event.timestamp
    });
  }
}
```

---

### 3. AnalyticsConsumer

負責追蹤統計數據。

```typescript
@Injectable({ providedIn: 'root' })
export class AnalyticsConsumer extends EventConsumer {
  private readonly analyticsService = inject(AnalyticsService);
  
  // 任務數量統計
  private taskCount = signal(0);
  private completedTaskCount = signal(0);
  
  readonly completionRate = computed(() => {
    const total = this.taskCount();
    if (total === 0) return 0;
    return Math.round((this.completedTaskCount() / total) * 100);
  });
  
  @Subscribe('task.created')
  async onTaskCreated(event: TaskCreatedEvent): Promise<void> {
    this.taskCount.update(count => count + 1);
    
    await this.analyticsService.track({
      event: 'task_created',
      properties: {
        blueprintId: event.payload.blueprint.id,
        assigneeType: event.payload.assignee?.constructor.name,
        timestamp: event.timestamp
      }
    });
  }
  
  @Subscribe('task.completed')
  async onTaskCompleted(event: TaskCompletedEvent): Promise<void> {
    this.completedTaskCount.update(count => count + 1);
    
    const { task, completedBy, completionTime } = event.payload;
    const duration = completionTime.getTime() - task.createdAt.getTime();
    
    await this.analyticsService.track({
      event: 'task_completed',
      properties: {
        taskId: task.id,
        blueprintId: task.blueprintId,
        durationMs: duration,
        completedBy: completedBy.id
      }
    });
  }
  
  @Subscribe('blueprint.created')
  async onBlueprintCreated(event: BlueprintCreatedEvent): Promise<void> {
    await this.analyticsService.track({
      event: 'blueprint_created',
      properties: {
        blueprintId: event.payload.blueprint.id,
        ownerType: event.payload.blueprint.ownerType,
        memberCount: event.payload.initialMembers.length
      }
    });
  }
}
```

---

### 4. AuditLogConsumer

負責記錄所有重要操作的稽核日誌。

```typescript
@Injectable({ providedIn: 'root' })
export class AuditLogConsumer extends EventConsumer {
  private readonly auditService = inject(AuditLogService);
  
  // 監聽所有事件
  ngOnInit(): void {
    super.ngOnInit();
    
    // 訂閱所有事件進行稽核
    this.eventBus.observeAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async (event) => {
        await this.logEvent(event);
      });
  }
  
  private async logEvent(event: DomainEvent): Promise<void> {
    // 提取用戶資訊
    const userId = event.metadata.userContext?.userId;
    const action = this.extractAction(event.eventType);
    const resource = this.extractResource(event);
    
    await this.auditService.log({
      eventId: event.eventId,
      eventType: event.eventType,
      userId,
      action,
      resource,
      timestamp: event.timestamp,
      metadata: event.metadata,
      payload: this.sanitizePayload(event)
    });
  }
  
  private extractAction(eventType: string): string {
    const parts = eventType.split('.');
    return parts[parts.length - 1]; // e.g., 'created', 'updated', 'deleted'
  }
  
  private extractResource(event: DomainEvent): AuditResource {
    return {
      type: event.aggregateType,
      id: event.aggregateId
    };
  }
  
  private sanitizePayload(event: DomainEvent): any {
    // 移除敏感資訊（密碼、token 等）
    const payload = { ...event };
    // 實作敏感資料過濾邏輯
    return payload;
  }
}
```

---

### 5. SearchIndexerConsumer

負責更新搜尋索引。

```typescript
@Injectable({ providedIn: 'root' })
export class SearchIndexerConsumer extends EventConsumer {
  private readonly searchService = inject(SearchService);
  
  @Subscribe('task.created')
  async onTaskCreated(event: TaskCreatedEvent): Promise<void> {
    const { task } = event.payload;
    
    await this.searchService.index({
      id: task.id,
      type: 'task',
      title: task.title,
      description: task.description,
      status: task.status,
      blueprintId: task.blueprintId,
      createdAt: task.createdAt
    });
  }
  
  @Subscribe('task.updated')
  async onTaskUpdated(event: TaskUpdatedEvent): Promise<void> {
    const { task } = event.payload;
    
    await this.searchService.update({
      id: task.id,
      type: 'task',
      title: task.title,
      description: task.description,
      status: task.status
    });
  }
  
  @Subscribe('blueprint.created')
  async onBlueprintCreated(event: BlueprintCreatedEvent): Promise<void> {
    const { blueprint } = event.payload;
    
    await this.searchService.index({
      id: blueprint.id,
      type: 'blueprint',
      name: blueprint.name,
      description: blueprint.description,
      ownerType: blueprint.ownerType,
      createdAt: blueprint.createdAt
    });
  }
}
```

---

## 服務整合範例

### TaskService 整合事件發布

```typescript
@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly eventBus = inject(InMemoryEventBus);
  private readonly taskRepository = inject(TaskRepository);
  private readonly blueprintRepository = inject(BlueprintRepository);
  
  async createTask(data: CreateTaskInput): Promise<Task> {
    // 1. 驗證權限
    await this.permissionService.requirePermission(
      data.blueprintId,
      'task:create'
    );
    
    // 2. 執行業務邏輯
    const task = await this.taskRepository.create({
      ...data,
      status: 'pending',
      createdAt: new Date(),
      createdBy: data.creatorId
    });
    
    // 3. 發布領域事件
    const blueprint = await this.blueprintRepository.findById(data.blueprintId);
    const creator = await this.userService.findById(data.creatorId);
    
    await this.eventBus.publish(
      new TaskCreatedEvent({
        task,
        blueprint,
        creator,
        assignee: data.assigneeId 
          ? await this.resolveAssignee(data.assigneeId) 
          : undefined
      })
    );
    
    return task;
  }
  
  async updateTaskStatus(
    taskId: string,
    newStatus: TaskStatus,
    userId: string
  ): Promise<Task> {
    const task = await this.taskRepository.findById(taskId);
    const previousStatus = task.status;
    
    // 更新狀態
    const updatedTask = await this.taskRepository.update(taskId, {
      status: newStatus,
      updatedAt: new Date()
    });
    
    // 發布事件
    const changedBy = await this.userService.findById(userId);
    
    await this.eventBus.publish(
      new TaskStatusChangedEvent({
        task: updatedTask,
        newStatus,
        previousStatus,
        changedBy
      })
    );
    
    // 如果狀態變更為 completed，發布 task.completed 事件
    if (newStatus === 'completed') {
      await this.eventBus.publish(
        new TaskCompletedEvent({
          task: updatedTask,
          completedBy: changedBy,
          completionTime: new Date()
        })
      );
    }
    
    return updatedTask;
  }
}
```

---

## 消費者註冊

### 在 app.config.ts 註冊所有消費者

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { APP_INITIALIZER } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    
    // Event Bus
    InMemoryEventBus,
    InMemoryEventStore,
    
    // Event Consumers
    NotificationConsumer,
    ActivityFeedConsumer,
    AnalyticsConsumer,
    AuditLogConsumer,
    SearchIndexerConsumer,
    
    // 初始化消費者
    {
      provide: APP_INITIALIZER,
      useFactory: (
        notification: NotificationConsumer,
        activity: ActivityFeedConsumer,
        analytics: AnalyticsConsumer,
        audit: AuditLogConsumer,
        search: SearchIndexerConsumer
      ) => {
        return () => {
          // 觸發 ngOnInit 以初始化訂閱
          notification.ngOnInit();
          activity.ngOnInit();
          analytics.ngOnInit();
          audit.ngOnInit();
          search.ngOnInit();
        };
      },
      deps: [
        NotificationConsumer,
        ActivityFeedConsumer,
        AnalyticsConsumer,
        AuditLogConsumer,
        SearchIndexerConsumer
      ],
      multi: true
    }
  ]
};
```

---

## 測試策略

### 事件發布測試

```typescript
describe('TaskService', () => {
  let service: TaskService;
  let eventBus: InMemoryEventBus;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TaskService, InMemoryEventBus]
    });
    
    service = TestBed.inject(TaskService);
    eventBus = TestBed.inject(InMemoryEventBus);
  });
  
  it('should publish TaskCreatedEvent when task is created', async () => {
    const eventSpy = jasmine.createSpy('eventHandler');
    
    eventBus.observe<TaskCreatedEvent>('task.created')
      .subscribe(eventSpy);
    
    await service.createTask({
      title: 'Test Task',
      blueprintId: 'blueprint-1',
      creatorId: 'user-1'
    });
    
    expect(eventSpy).toHaveBeenCalledOnceWith(
      jasmine.objectContaining({
        eventType: 'task.created',
        payload: jasmine.objectContaining({
          task: jasmine.objectContaining({ title: 'Test Task' })
        })
      })
    );
  });
});
```

### 消費者測試

```typescript
describe('NotificationConsumer', () => {
  let consumer: NotificationConsumer;
  let eventBus: InMemoryEventBus;
  let notificationService: jasmine.SpyObj<NotificationService>;
  
  beforeEach(() => {
    const notificationSpy = jasmine.createSpyObj('NotificationService', ['send']);
    
    TestBed.configureTestingModule({
      providers: [
        NotificationConsumer,
        InMemoryEventBus,
        { provide: NotificationService, useValue: notificationSpy }
      ]
    });
    
    consumer = TestBed.inject(NotificationConsumer);
    eventBus = TestBed.inject(InMemoryEventBus);
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
  });
  
  it('should send notification when task is created', async () => {
    consumer.ngOnInit(); // 初始化訂閱
    
    const event = new TaskCreatedEvent({
      task: mockTask,
      blueprint: mockBlueprint,
      creator: mockUser,
      assignee: mockAssignee
    });
    
    await eventBus.publish(event);
    
    await new Promise(resolve => setTimeout(resolve, 100)); // 等待非同步處理
    
    expect(notificationService.send).toHaveBeenCalled();
  });
});
```

---

## 效能優化

### 批次處理事件

```typescript
export class BatchEventProcessor {
  private eventQueue: DomainEvent[] = [];
  private readonly batchSize = 100;
  private readonly flushInterval = 5000; // 5 秒
  
  constructor(private eventBus: InMemoryEventBus) {
    // 定期批次發布
    setInterval(() => this.flush(), this.flushInterval);
  }
  
  enqueue(event: DomainEvent): void {
    this.eventQueue.push(event);
    
    if (this.eventQueue.length >= this.batchSize) {
      this.flush();
    }
  }
  
  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;
    
    const batch = this.eventQueue.splice(0, this.batchSize);
    await this.eventBus.publishBatch(batch);
  }
}
```

---

## 下一步（Level 4）

Level 4 將涵蓋：

1. **事件版本控制**: 事件演進與向後兼容性策略
2. **事件溯源 (Event Sourcing)**: 完整事件歷史重建
3. **快照 (Snapshots)**: 效能優化
4. **時間旅行 (Time Travel)**: 狀態回溯
5. **分散式追蹤**: OpenTelemetry 整合

---

**文檔版本**: 3.0  
**最後更新**: 2025-12-25  
**維護者**: GigHub 開發團隊
