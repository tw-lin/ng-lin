import 'reflect-metadata';

/**
 * EventHandler 裝飾器
 *
 * 類別級別的裝飾器，用於標記事件處理器類別。
 * 可以為整個類別設定預設的處理器配置，例如優先級、標籤等。
 *
 * 這個裝飾器與 @Subscribe 配合使用，提供類別級別的元數據管理。
 *
 * @param options 選用的處理器配置
 *
 * @example
 * ```typescript
 * @EventHandler({
 *   priority: 10,
 *   tags: ['notification', 'email'],
 *   enabled: true
 * })
 * export class NotificationConsumer extends EventConsumer {
 *   @Subscribe('task.created')
 *   async handleTaskCreated(event: TaskCreatedEvent) {
 *     // 處理事件
 *   }
 * }
 * ```
 */

/**
 * 事件處理器配置選項
 */
export interface EventHandlerOptions {
  /**
   * 處理器優先級（數字越大優先級越高）
   * 用於控制同一事件類型的多個處理器的執行順序
   *
   * @default 0
   */
  priority?: number;

  /**
   * 處理器標籤，用於分類和過濾
   *
   * @example ['notification', 'email']
   */
  tags?: string[];

  /**
   * 處理器描述
   */
  description?: string;

  /**
   * 是否啟用此處理器
   *
   * @default true
   */
  enabled?: boolean;

  /**
   * 處理器群組名稱
   * 用於批次管理相同群組的處理器
   */
  group?: string;

  /**
   * 處理器版本
   * 用於事件處理器的版本管理
   *
   * @example '1.0.0'
   */
  version?: string;
}

/**
 * EventHandler 類別裝飾器
 *
 * 為事件處理器類別添加元數據。
 * 這些元數據可用於：
 * - 處理器的自動發現和註冊
 * - 優先級排序
 * - 分組管理
 * - 啟用/停用控制
 * - 監控和診斷
 *
 * @param options 處理器配置選項
 * @returns 類別裝飾器函數
 */
export function EventHandler(options: EventHandlerOptions = {}): ClassDecorator {
  return function <TFunction extends Function>(target: TFunction): TFunction {
    // 設定預設值
    const handlerMetadata: EventHandlerOptions = {
      priority: options.priority ?? 0,
      tags: options.tags ?? [],
      description: options.description ?? '',
      enabled: options.enabled ?? true,
      group: options.group,
      version: options.version ?? '1.0.0'
    };

    // 儲存處理器元數據
    Reflect.defineMetadata('eventHandler', handlerMetadata, target);

    // 標記為事件處理器
    Reflect.defineMetadata('isEventHandler', true, target);

    return target;
  };
}

/**
 * 檢查類別是否為事件處理器
 *
 * @param target 要檢查的類別
 * @returns 如果是事件處理器則返回 true
 */
export function isEventHandler(target: any): boolean {
  return Reflect.getMetadata('isEventHandler', target) === true;
}

/**
 * 取得事件處理器的元數據
 *
 * @param target 事件處理器類別
 * @returns 處理器元數據，如果不是事件處理器則返回 undefined
 */
export function getEventHandlerMetadata(target: any): EventHandlerOptions | undefined {
  if (!isEventHandler(target)) {
    return undefined;
  }
  return Reflect.getMetadata('eventHandler', target);
}
