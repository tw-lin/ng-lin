import { Injectable, signal, WritableSignal } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import type {
  EnhancedBlueprintEvent,
  EventActor,
  EventMetadata,
  SubscriptionOptions,
  EnhancedEventHandler,
  UnsubscribeFunction
} from './models/blueprint-event.model';
import type { EventLogEntry, EventLogFilter } from './models/event-log-entry.model';
import { EventPriority } from './models/event-priority.enum';
import { SystemEventType } from './types/system-event-type.enum';

/**
 * 強化的 Event Bus 服務
 *
 * 提供增強的事件發布-訂閱機制，包含：
 * - 統一的 SystemEventType 事件類型
 * - 事件優先級支援
 * - 事件驗證機制
 * - 完整的事件日誌系統
 * - 事件序列化/反序列化
 *
 * @example
 * ```typescript
 * // 注入服務
 * private eventBus = inject(EnhancedEventBusService);
 *
 * // 發送事件
 * this.eventBus.emitEvent({
 *   type: SystemEventType.TASK_COMPLETED,
 *   blueprintId: 'bp-123',
 *   timestamp: new Date(),
 *   actor: { userId: 'user-1', userName: 'Admin', role: 'admin' },
 *   data: { taskId: 'task-1' }
 * });
 *
 * // 訂閱事件
 * const unsubscribe = this.eventBus.onEvent(
 *   SystemEventType.TASK_COMPLETED,
 *   (event) => console.log('Task completed:', event.data)
 * );
 *
 * // 取消訂閱
 * unsubscribe();
 * ```
 */
@Injectable({ providedIn: 'root' })
export class EnhancedEventBusService {
  /** 事件流 Subject */
  private readonly eventSubject = new Subject<EnhancedBlueprintEvent>();

  /** 事件日誌 */
  private readonly eventLog: EventLogEntry[] = [];

  /** 最大日誌大小 */
  private readonly maxLogSize = 1000;

  /** 事件計數器 */
  private eventCounter = 0;

  /** 訂閱追蹤 */
  private readonly subscriptions = new Map<string, Set<Subscription>>();

  /** 事件節流映射 */
  private readonly eventThrottle = new Map<string, number>();

  /** 節流間隔（毫秒） */
  private readonly throttleMs = 50;

  /** 當前藍圖 ID */
  private currentBlueprintId = '';

  /** 當前使用者 ID */
  private currentUserId = '';

  /** 事件計數 Signal */
  public readonly eventCount: WritableSignal<number> = signal(0);

  /** 最後事件時間 Signal */
  public readonly lastEventTime: WritableSignal<Date | null> = signal(null);

  /** 錯誤計數 Signal */
  public readonly errorCount: WritableSignal<number> = signal(0);

  /**
   * 初始化事件總線
   *
   * @param blueprintId - 藍圖 ID
   * @param userId - 使用者 ID
   */
  initialize(blueprintId: string, userId: string): void {
    this.currentBlueprintId = blueprintId;
    this.currentUserId = userId;
  }

  /**
   * 發送事件
   *
   * @param event - 事件物件
   * @param priority - 事件優先級（可選）
   */
  emitEvent<T = unknown>(event: EnhancedBlueprintEvent<T>, priority: EventPriority = EventPriority.NORMAL): void {
    // 驗證事件
    if (!this.validateEvent(event)) {
      console.error('[EnhancedEventBus] Invalid event format:', event);
      return;
    }

    // 檢查節流
    if (this.shouldThrottle(event.type)) {
      console.warn(`[EnhancedEventBus] Event "${event.type}" throttled`);
      return;
    }

    const startTime = Date.now();

    // 添加 ID 和優先級
    const enhancedEvent: EnhancedBlueprintEvent<T> = {
      ...event,
      id: event.id || this.generateEventId(),
      priority: priority
    };

    // 發送事件
    this.eventSubject.next(enhancedEvent);

    // 記錄日誌
    this.logEvent(enhancedEvent, startTime);

    // 更新計數
    this.eventCount.update(count => count + 1);
    this.lastEventTime.set(new Date());
  }

  /**
   * 簡化的事件發送方法
   *
   * @param type - 事件類型
   * @param data - 事件資料
   * @param actor - 事件參與者
   * @param metadata - 事件元資料
   */
  emit<T = unknown>(type: SystemEventType | string, data: T, actor?: EventActor, metadata?: EventMetadata): void {
    const event: EnhancedBlueprintEvent<T> = {
      type,
      blueprintId: this.currentBlueprintId,
      timestamp: new Date(),
      actor: actor || {
        userId: this.currentUserId,
        userName: 'System',
        role: 'system'
      },
      data,
      metadata
    };

    this.emitEvent(event);
  }

  /**
   * 訂閱事件
   *
   * @param eventType - 事件類型
   * @param handler - 處理函式
   * @param options - 訂閱選項
   * @returns 取消訂閱函式
   */
  onEvent<T = unknown>(
    eventType: SystemEventType | string,
    handler: EnhancedEventHandler<T>,
    options?: SubscriptionOptions
  ): UnsubscribeFunction {
    let observable = this.eventSubject.asObservable().pipe(filter(event => event.type === eventType));

    // 應用自定義過濾器
    if (options?.filter) {
      observable = observable.pipe(filter(options.filter));
    }

    const subscription = observable.subscribe({
      next: async event => {
        try {
          await handler(event as EnhancedBlueprintEvent<T>);
        } catch (error) {
          this.handleError(error as Error, eventType as string);
        }
      },
      error: error => this.handleError(error, eventType as string)
    });

    // 追蹤訂閱
    this.trackSubscription(eventType as string, subscription);

    return () => {
      subscription.unsubscribe();
      this.untrackSubscription(eventType as string, subscription);
    };
  }

  /**
   * 一次性訂閱
   *
   * @param eventType - 事件類型
   * @param handler - 處理函式
   * @returns 取消訂閱函式
   */
  onceEvent<T = unknown>(eventType: SystemEventType | string, handler: EnhancedEventHandler<T>): UnsubscribeFunction {
    let unsubscribe: UnsubscribeFunction | null = null;
    let called = false;

    const wrappedHandler: EnhancedEventHandler<T> = async event => {
      if (called) return;
      called = true;

      if (unsubscribe) {
        unsubscribe();
      }

      await handler(event);
    };

    unsubscribe = this.onEvent(eventType, wrappedHandler);
    return unsubscribe;
  }

  /**
   * 訂閱多個事件類型
   *
   * @param eventTypes - 事件類型陣列
   * @param handler - 處理函式
   * @returns 取消訂閱函式
   */
  onEvents<T = unknown>(eventTypes: Array<SystemEventType | string>, handler: EnhancedEventHandler<T>): UnsubscribeFunction {
    const unsubscribes = eventTypes.map(type => this.onEvent(type, handler));

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }

  /**
   * 訂閱所有事件（全域監聽）
   *
   * @param handler - 處理函式
   * @returns 取消訂閱函式
   */
  onAllEvents<T = unknown>(handler: EnhancedEventHandler<T>): UnsubscribeFunction {
    const subscription = this.eventSubject.subscribe({
      next: async event => {
        try {
          await handler(event as EnhancedBlueprintEvent<T>);
        } catch (error) {
          this.handleError(error as Error, 'ALL');
        }
      }
    });

    this.trackSubscription('*', subscription);

    return () => {
      subscription.unsubscribe();
      this.untrackSubscription('*', subscription);
    };
  }

  /**
   * 驗證事件格式
   *
   * @param event - 事件物件
   * @returns 是否有效
   */
  validateEvent(event: EnhancedBlueprintEvent): boolean {
    if (!event) return false;
    if (!event.type) return false;
    if (!event.blueprintId) return false;
    if (!event.timestamp) return false;
    if (!event.actor) return false;
    if (event.data === undefined) return false;

    // 驗證 actor 結構
    if (!event.actor.userId || !event.actor.role) return false;

    return true;
  }

  /**
   * 取得事件日誌
   *
   * @param filter - 過濾條件
   * @returns 事件日誌陣列
   */
  getEventLog(logFilter?: EventLogFilter): EventLogEntry[] {
    let logs = [...this.eventLog];

    if (logFilter) {
      if (logFilter.eventTypes && logFilter.eventTypes.length > 0) {
        logs = logs.filter(log => logFilter.eventTypes!.includes(log.eventType));
      }

      if (logFilter.blueprintId) {
        logs = logs.filter(log => log.blueprintId === logFilter.blueprintId);
      }

      if (logFilter.startTime) {
        logs = logs.filter(log => log.timestamp >= logFilter.startTime!);
      }

      if (logFilter.endTime) {
        logs = logs.filter(log => log.timestamp <= logFilter.endTime!);
      }

      if (logFilter.hasError !== undefined) {
        logs = logs.filter(log => (logFilter.hasError ? !log.success : log.success));
      }

      if (logFilter.source) {
        logs = logs.filter(log => log.source === logFilter.source);
      }

      if (logFilter.limit) {
        logs = logs.slice(-logFilter.limit);
      }
    }

    return logs;
  }

  /**
   * 清除事件日誌
   */
  clearEventLog(): void {
    this.eventLog.length = 0;
  }

  /**
   * 取得訂閱數量
   *
   * @param eventType - 事件類型
   * @returns 訂閱數量
   */
  getSubscriptionCount(eventType: string): number {
    return this.subscriptions.get(eventType)?.size ?? 0;
  }

  /**
   * 取得所有活躍的事件類型
   *
   * @returns 事件類型陣列
   */
  getActiveEventTypes(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * 取得統計資訊
   */
  getStatistics(): {
    totalEvents: number;
    errorCount: number;
    activeSubscriptions: number;
    logSize: number;
    lastEventTime: Date | null;
  } {
    let totalSubs = 0;
    this.subscriptions.forEach(subs => {
      totalSubs += subs.size;
    });

    return {
      totalEvents: this.eventCount(),
      errorCount: this.errorCount(),
      activeSubscriptions: totalSubs,
      logSize: this.eventLog.length,
      lastEventTime: this.lastEventTime()
    };
  }

  /**
   * 序列化事件
   *
   * @param event - 事件物件
   * @returns JSON 字串
   */
  serializeEvent(event: EnhancedBlueprintEvent): string {
    return JSON.stringify({
      ...event,
      timestamp: event.timestamp.toISOString()
    });
  }

  /**
   * 反序列化事件
   *
   * @param json - JSON 字串
   * @returns 事件物件
   */
  deserializeEvent(json: string): EnhancedBlueprintEvent {
    const parsed = JSON.parse(json);
    return {
      ...parsed,
      timestamp: new Date(parsed.timestamp)
    };
  }

  /**
   * 釋放資源
   */
  dispose(): void {
    // 取消所有訂閱
    this.subscriptions.forEach(subs => {
      subs.forEach(sub => sub.unsubscribe());
    });
    this.subscriptions.clear();

    // 清除日誌
    this.clearEventLog();

    // 完成 Subject
    this.eventSubject.complete();

    // 重置計數
    this.eventCount.set(0);
    this.errorCount.set(0);
    this.lastEventTime.set(null);
  }

  // ===== 私有方法 =====

  /**
   * 生成事件 ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${++this.eventCounter}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * 記錄事件
   */
  private logEvent(event: EnhancedBlueprintEvent, startTime: number): void {
    const entry: EventLogEntry = {
      eventId: event.id || this.generateEventId(),
      eventType: event.type as string,
      blueprintId: event.blueprintId,
      timestamp: event.timestamp,
      source: event.metadata?.source || 'unknown',
      dataSummary: this.summarizeData(event.data),
      processingTime: Date.now() - startTime,
      success: true
    };

    this.eventLog.push(entry);

    // 維護最大大小
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.splice(0, this.eventLog.length - this.maxLogSize);
    }
  }

  /**
   * 摘要資料
   */
  private summarizeData(data: unknown): string {
    try {
      const str = JSON.stringify(data);
      return str.length > 100 ? `${str.substring(0, 100)}...` : str;
    } catch {
      return '[Unable to serialize]';
    }
  }

  /**
   * 檢查是否應節流
   */
  private shouldThrottle(eventType: string | SystemEventType): boolean {
    const typeStr = eventType as string;
    const lastEmit = this.eventThrottle.get(typeStr) || 0;
    const now = Date.now();

    if (now - lastEmit < this.throttleMs) {
      return true;
    }

    this.eventThrottle.set(typeStr, now);
    return false;
  }

  /**
   * 處理錯誤
   */
  private handleError(error: Error, eventType: string): void {
    console.error(`[EnhancedEventBus] Error in handler for "${eventType}":`, error);

    this.errorCount.update(count => count + 1);

    // 記錄錯誤到最後一個日誌條目
    if (this.eventLog.length > 0) {
      const lastLog = this.eventLog[this.eventLog.length - 1];
      lastLog.error = {
        message: error.message,
        stack: error.stack
      };
      lastLog.success = false;
    }

    // 發送系統錯誤事件
    this.emit(
      SystemEventType.SYSTEM_ERROR,
      {
        originalEventType: eventType,
        error: error.message,
        stack: error.stack
      },
      { userId: 'system', userName: 'System', role: 'system' }
    );
  }

  /**
   * 追蹤訂閱
   */
  private trackSubscription(eventType: string, subscription: Subscription): void {
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, new Set());
    }
    this.subscriptions.get(eventType)!.add(subscription);
  }

  /**
   * 取消追蹤訂閱
   */
  private untrackSubscription(eventType: string, subscription: Subscription): void {
    const subs = this.subscriptions.get(eventType);
    if (subs) {
      subs.delete(subscription);
      if (subs.size === 0) {
        this.subscriptions.delete(eventType);
      }
    }
  }
}
