/**
 * Lifecycle Manager Interface
 * 生命週期管理器介面
 *
 * 負責協調模組的完整生命週期，從初始化到銷毀。
 *
 * @packageDocumentation
 * @module BlueprintCore
 */

import { Signal } from '@angular/core';

import { IExecutionContext } from '../context/execution-context.interface';
import { ModuleStatus } from '../modules/module-status.enum';
import { IBlueprintModule } from '../modules/module.interface';

/**
 * 生命週期管理器介面
 *
 * 管理所有模組的生命週期狀態轉換，確保狀態機的正確性。
 *
 * @example
 * ```typescript
 * // Initialize module
 * await lifecycleManager.initialize(module, context);
 *
 * // Start module
 * await lifecycleManager.start(module.id);
 *
 * // Mark as ready
 * await lifecycleManager.ready(module.id);
 *
 * // Stop module
 * await lifecycleManager.stop(module.id);
 *
 * // Dispose module
 * await lifecycleManager.dispose(module.id);
 * ```
 */
export interface ILifecycleManager {
  /**
   * 初始化模組
   *
   * @param module - 要初始化的模組
   * @param context - 執行上下文
   * @returns Promise<void>
   *
   * @throws Error 如果模組已初始化
   */
  initialize(module: IBlueprintModule, context: IExecutionContext): Promise<void>;

  /**
   * 啟動模組
   *
   * @param moduleId - 模組 ID
   * @returns Promise<void>
   *
   * @throws Error 如果模組未初始化或狀態不正確
   */
  start(moduleId: string): Promise<void>;

  /**
   * 標記模組為就緒狀態
   *
   * @param moduleId - 模組 ID
   * @returns Promise<void>
   *
   * @throws Error 如果模組未啟動
   */
  ready(moduleId: string): Promise<void>;

  /**
   * 停止模組
   *
   * @param moduleId - 模組 ID
   * @returns Promise<void>
   *
   * @throws Error 如果模組未運行
   */
  stop(moduleId: string): Promise<void>;

  /**
   * 銷毀模組
   *
   * @param moduleId - 模組 ID
   * @returns Promise<void>
   *
   * @throws Error 如果模組未停止
   */
  dispose(moduleId: string): Promise<void>;

  /**
   * 獲取模組當前狀態
   *
   * @param moduleId - 模組 ID
   * @returns 模組狀態
   *
   * @throws Error 如果模組不存在
   */
  getState(moduleId: string): ModuleStatus;

  /**
   * 檢查模組是否已就緒
   *
   * @param moduleId - 模組 ID
   * @returns true 如果模組已就緒
   */
  isModuleReady(moduleId: string): boolean;

  /**
   * 獲取所有處於指定狀態的模組
   *
   * @param status - 模組狀態
   * @returns 模組 ID 陣列
   */
  getModulesByState(status: ModuleStatus): string[];

  /**
   * 模組總數 (Signal)
   *
   * @returns Signal<number>
   */
  moduleCount: Signal<number>;
}

/**
 * 生命週期狀態轉換規則
 *
 * State Machine:
 * uninitialized → initialized → starting → started → ready →
 * stopping → stopped → disposed
 *
 * Any state → error (on failure)
 * error → previous stable state (on recovery)
 */
export const LIFECYCLE_TRANSITIONS: Record<ModuleStatus, ModuleStatus[]> = {
  [ModuleStatus.UNINITIALIZED]: [ModuleStatus.INITIALIZED, ModuleStatus.ERROR],
  [ModuleStatus.INITIALIZED]: [ModuleStatus.STARTING, ModuleStatus.ERROR],
  [ModuleStatus.STARTING]: [ModuleStatus.STARTED, ModuleStatus.ERROR],
  [ModuleStatus.STARTED]: [ModuleStatus.READY, ModuleStatus.ERROR],
  [ModuleStatus.READY]: [ModuleStatus.STOPPING, ModuleStatus.ERROR],
  [ModuleStatus.STOPPING]: [ModuleStatus.STOPPED, ModuleStatus.ERROR],
  [ModuleStatus.STOPPED]: [ModuleStatus.DISPOSED, ModuleStatus.STARTING, ModuleStatus.ERROR],
  [ModuleStatus.ERROR]: [ModuleStatus.INITIALIZED, ModuleStatus.STOPPED],
  [ModuleStatus.DISPOSED]: [],
  [ModuleStatus.INITIALIZING]: [ModuleStatus.INITIALIZED, ModuleStatus.ERROR],
  [ModuleStatus.RUNNING]: [ModuleStatus.STOPPING, ModuleStatus.ERROR]
};
