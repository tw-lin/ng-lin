import type { EventPriority } from './event-priority.enum';
import type { SystemEventType } from '../types/system-event-type.enum';

/**
 * 事件參與者資訊
 *
 * 記錄觸發事件的使用者資訊
 */
export interface EventActor {
  /** 使用者 ID */
  userId: string;
  /** 使用者名稱 */
  userName: string;
  /** 使用者角色 */
  role: string;
}

/**
 * 事件元資料
 *
 * 提供事件的額外上下文資訊
 */
export interface EventMetadata {
  /** 事件來源模組 */
  source?: string;
  /** 關聯 ID - 用於追蹤相關事件 */
  correlationId?: string;
  /** 因果 ID - 記錄觸發此事件的原因事件 */
  causationId?: string;
  /** 額外的自定義資料 */
  [key: string]: unknown;
}

/**
 * 強化的藍圖事件介面
 *
 * 提供完整的事件上下文和追蹤能力
 *
 * @template T - 事件資料類型
 */
export interface EnhancedBlueprintEvent<T = unknown> {
  /** 事件類型 */
  type: SystemEventType | string;
  /** 藍圖 ID */
  blueprintId: string;
  /** 事件時間戳 */
  timestamp: Date;
  /** 事件參與者 */
  actor: EventActor;
  /** 事件資料 */
  data: T;
  /** 事件元資料 */
  metadata?: EventMetadata;
  /** 事件優先級 */
  priority?: EventPriority;
  /** 事件唯一識別碼 */
  id?: string;
}

/**
 * 事件訂閱選項
 */
export interface SubscriptionOptions {
  /** 訂閱優先級 */
  priority?: EventPriority;
  /** 事件過濾器 */
  filter?: (event: EnhancedBlueprintEvent) => boolean;
  /** 訂閱上下文 */
  context?: unknown;
}

/**
 * 事件處理器類型
 *
 * @template T - 事件資料類型
 */
export type EnhancedEventHandler<T = unknown> = (event: EnhancedBlueprintEvent<T>) => void | Promise<void>;

/**
 * 取消訂閱函式類型
 */
export type UnsubscribeFunction = () => void;
