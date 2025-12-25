/**
 * 進階裝飾器使用範例
 *
 * 展示 @EventHandler, @Retry, @Subscribe 的組合使用方式
 */

import { Injectable } from '@angular/core';

import { EventHandler, Retry, Subscribe } from '../decorators';
import { DomainEvent } from '../models';
import { EventConsumer } from '../services/event-consumer.base';

// ============================================================================
// 範例 1: 基本的事件處理器
// ============================================================================

interface Task {
  id: string;
  title: string;
  assigneeId?: string;
}

class TaskCreatedEvent extends DomainEvent<{ task: Task }> {
  override readonly eventType = 'task.created' as const;
  override readonly payload: { task: Task };

  constructor(task: Task) {
    super(
      { task },
      {
        aggregateId: task.id,
        aggregateType: 'Task',
        aggregateVersion: 1
      }
    );
    this.payload = { task };
  }
}

class TaskUpdatedEvent extends DomainEvent<{ task: Task; changes: Partial<Task> }> {
  override readonly eventType = 'task.updated' as const;
  override readonly payload: { task: Task; changes: Partial<Task> };

  constructor(task: Task, changes: Partial<Task>) {
    super(
      { task, changes },
      {
        aggregateId: task.id,
        aggregateType: 'Task'
      }
    );
    this.payload = { task, changes };
  }
}

/**
 * 通知消費者
 *
 * 使用 @EventHandler 標記為事件處理器，設定優先級和標籤
 */
@EventHandler({
  priority: 10,
  tags: ['notification', 'email'],
  description: '處理任務事件並發送通知',
  group: 'notifications',
  version: '1.0.0'
})
@Injectable({ providedIn: 'root' })
export class NotificationConsumer extends EventConsumer {
  /**
   * 處理任務建立事件
   * 使用 @Subscribe 自動訂閱，並配置重試策略
   */
  @Subscribe('task.created', {
    retryPolicy: {
      maxAttempts: 3,
      backoff: 'exponential',
      initialDelay: 1000
    }
  })
  async handleTaskCreated(event: TaskCreatedEvent): Promise<void> {
    console.log('📧 發送任務建立通知:', event.payload.task.title);

    // 模擬發送電子郵件
    await this.sendEmail(event.payload.task.assigneeId, `新任務: ${event.payload.task.title}`);
  }

  /**
   * 處理任務更新事件
   */
  @Subscribe('task.updated')
  async handleTaskUpdated(event: TaskUpdatedEvent): Promise<void> {
    console.log('📧 發送任務更新通知:', event.payload.task.title);

    await this.sendEmail(event.payload.task.assigneeId, `任務更新: ${event.payload.task.title}`);
  }

  /**
   * 使用 @Retry 裝飾器為特定方法添加重試邏輯
   */
  @Retry({
    maxAttempts: 5,
    backoff: 'exponential',
    initialDelay: 500,
    maxDelay: 10000
  })
  private async sendEmail(userId: string | undefined, message: string): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // 模擬 API 呼叫（可能失敗）
    if (Math.random() < 0.3) {
      throw new Error('Email service temporarily unavailable');
    }

    console.log(`✉️  Email sent to ${userId}: ${message}`);
  }
}

// ============================================================================
// 範例 2: 高優先級處理器
// ============================================================================

/**
 * 稽核日誌消費者
 *
 * 設定高優先級以確保在其他處理器之前執行
 */
@EventHandler({
  priority: 100, // 最高優先級
  tags: ['audit', 'compliance'],
  description: '記錄所有事件到稽核日誌',
  group: 'audit',
  enabled: true
})
@Injectable({ providedIn: 'root' })
export class AuditLogConsumer extends EventConsumer {
  /**
   * 訂閱所有事件（使用通配符）
   */
  @Subscribe('*')
  async handleAllEvents(event: DomainEvent): Promise<void> {
    // 記錄到稽核日誌
    await this.logToAuditTrail({
      eventId: event.eventId,
      eventType: event.eventType,
      timestamp: event.timestamp,
      metadata: event.metadata
    });
  }

  @Retry({
    maxAttempts: 10, // 稽核日誌很重要，多次重試
    backoff: 'linear',
    initialDelay: 2000
  })
  private async logToAuditTrail(data: any): Promise<void> {
    console.log('📝 稽核日誌:', data);
    // 寫入持久化儲存
  }
}

// ============================================================================
// 範例 3: 分析消費者（低優先級）
// ============================================================================

/**
 * 分析消費者
 *
 * 設定低優先級，在其他關鍵處理器之後執行
 */
@EventHandler({
  priority: 1, // 低優先級
  tags: ['analytics', 'metrics'],
  description: '收集事件統計資訊',
  group: 'analytics'
})
@Injectable({ providedIn: 'root' })
export class AnalyticsConsumer extends EventConsumer {
  private eventCounts = new Map<string, number>();

  @Subscribe('task.*') // 訂閱所有 task 事件
  async handleTaskEvents(event: DomainEvent): Promise<void> {
    // 更新統計
    const count = this.eventCounts.get(event.eventType) || 0;
    this.eventCounts.set(event.eventType, count + 1);

    console.log('📊 事件統計更新:', {
      eventType: event.eventType,
      count: count + 1
    });

    // 非關鍵操作，失敗也不重試
    await this.updateDashboard();
  }

  /**
   * 不使用重試的範例
   * 如果失敗就失敗，不影響主要流程
   */
  private async updateDashboard(): Promise<void> {
    // 更新儀表板（非關鍵操作）
  }
}

// ============================================================================
// 範例 4: 組合多個裝飾器
// ============================================================================

/**
 * 搜尋索引消費者
 *
 * 展示如何組合使用所有裝飾器
 */
@EventHandler({
  priority: 50,
  tags: ['search', 'indexing'],
  description: '維護搜尋索引',
  group: 'search-indexing'
})
@Injectable({ providedIn: 'root' })
export class SearchIndexConsumer extends EventConsumer {
  /**
   * 建立索引 - 使用重試確保可靠性
   */
  @Subscribe('task.created', {
    retryPolicy: {
      maxAttempts: 3,
      backoff: 'exponential',
      initialDelay: 1000 // Fixed: Added required initialDelay property
    }
  })
  @Retry({
    maxAttempts: 5, // 額外的方法級別重試
    backoff: 'exponential',
    initialDelay: 1000
  })
  async indexTask(event: TaskCreatedEvent): Promise<void> {
    console.log('🔍 建立搜尋索引:', event.payload.task.title);

    await this.addToSearchIndex({
      id: event.payload.task.id,
      title: event.payload.task.title,
      type: 'task'
    });
  }

  /**
   * 更新索引
   */
  @Subscribe('task.updated')
  @Retry({
    maxAttempts: 3,
    backoff: 'linear'
  })
  async updateIndex(event: TaskUpdatedEvent): Promise<void> {
    console.log('🔍 更新搜尋索引:', event.payload.task.title);

    await this.updateSearchIndex(event.payload.task.id, event.payload.changes);
  }

  /**
   * 刪除索引 - 使用固定延遲重試
   */
  @Subscribe('task.deleted')
  @Retry({
    maxAttempts: 3,
    backoff: 'fixed',
    initialDelay: 2000
  })
  async removeIndex(event: DomainEvent): Promise<void> {
    const taskId = event.payload?.['taskId'] as string;
    console.log('🔍 刪除搜尋索引:', taskId);

    await this.removeFromSearchIndex(taskId);
  }

  private async addToSearchIndex(doc: any): Promise<void> {
    // 模擬搜尋服務 API 呼叫
  }

  private async updateSearchIndex(id: string, updates: any): Promise<void> {
    // 模擬更新操作
  }

  private async removeFromSearchIndex(id: string): Promise<void> {
    // 模擬刪除操作
  }
}

// ============================================================================
// 使用範例
// ============================================================================

/*
// 在應用程式中使用：

import { Component, inject, OnInit } from '@angular/core';
import { InMemoryEventBus } from '../implementations/in-memory';
import { NotificationConsumer, AuditLogConsumer } from './decorators-example';

@Component({
  selector: 'app-demo',
  standalone: true,
  template: `
    <h2>進階裝飾器範例</h2>
    <button (click)="createTask()">建立任務</button>
    <button (click)="updateTask()">更新任務</button>
  `
})
export class DemoComponent implements OnInit {
  private eventBus = inject(InMemoryEventBus);
  
  // 注入消費者以自動初始化訂閱
  private notificationConsumer = inject(NotificationConsumer);
  private auditConsumer = inject(AuditLogConsumer);
  private analyticsConsumer = inject(AnalyticsConsumer);
  private searchConsumer = inject(SearchIndexConsumer);

  ngOnInit(): void {
    console.log('✅ 所有消費者已初始化並開始監聽事件');
  }

  async createTask(): Promise<void> {
    const task: Task = {
      id: crypto.randomUUID(),
      title: '新任務範例',
      assigneeId: 'user-123'
    };

    const event = new TaskCreatedEvent(task);
    await this.eventBus.publish(event);
    
    // 事件會自動觸發以下處理器（依優先級排序）:
    // 1. AuditLogConsumer (priority: 100)
    // 2. SearchIndexConsumer (priority: 50)
    // 3. NotificationConsumer (priority: 10)
    // 4. AnalyticsConsumer (priority: 1)
  }

  async updateTask(): Promise<void> {
    const task: Task = {
      id: 'task-123',
      title: '更新後的任務',
      assigneeId: 'user-123'
    };

    const event = new TaskUpdatedEvent(task, { title: '更新後的任務' });
    await this.eventBus.publish(event);
  }
}
*/
