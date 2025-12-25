/**
 * Blueprint Container Interface
 * 藍圖容器介面
 *
 * 藍圖系統的主要入口點，整合所有核心元件。
 *
 * @packageDocumentation
 * @module BlueprintCore
 */

import { Signal } from '@angular/core';

import { IBlueprintConfig } from '../config/blueprint-config.interface';
import { ModuleStatus } from '../modules/module-status.enum';
import { IBlueprintModule } from '../modules/module.interface';

/**
 * 藍圖容器介面
 *
 * 負責整個藍圖系統的初始化、運行和管理。
 *
 * @example
 * ```typescript
 * // Create container with config
 * const container = new BlueprintContainer(config);
 *
 * // Initialize
 * await container.initialize();
 *
 * // Load module
 * await container.loadModule(tasksModule);
 *
 * // Start container
 * await container.start();
 *
 * // Unload module
 * await container.unloadModule('tasks-module');
 *
 * // Dispose
 * await container.dispose();
 * ```
 */
export interface IBlueprintContainer {
  /**
   * 容器 ID
   */
  readonly id: string;

  /**
   * 容器配置
   */
  readonly config: IBlueprintConfig;

  /**
   * 容器狀態 (Signal)
   */
  readonly status: Signal<'uninitialized' | 'initializing' | 'ready' | 'running' | 'stopping' | 'stopped' | 'error'>;

  /**
   * 已載入的模組數量 (Signal)
   */
  readonly moduleCount: Signal<number>;

  /**
   * 初始化容器
   *
   * @returns Promise<void>
   */
  initialize(): Promise<void>;

  /**
   * 啟動容器（啟動所有已載入模組）
   *
   * @returns Promise<void>
   */
  start(): Promise<void>;

  /**
   * 停止容器（停止所有模組）
   *
   * @returns Promise<void>
   */
  stop(): Promise<void>;

  /**
   * 銷毀容器
   *
   * @returns Promise<void>
   */
  dispose(): Promise<void>;

  /**
   * 載入模組
   *
   * @param module - 要載入的模組
   * @returns Promise<void>
   */
  loadModule(module: IBlueprintModule): Promise<void>;

  /**
   * 卸載模組
   *
   * @param moduleId - 模組 ID
   * @returns Promise<void>
   */
  unloadModule(moduleId: string): Promise<void>;

  /**
   * 重新載入模組（熱重載）
   *
   * @param moduleId - 模組 ID
   * @returns Promise<void>
   */
  reloadModule(moduleId: string): Promise<void>;

  /**
   * 獲取模組
   *
   * @param moduleId - 模組 ID
   * @returns 模組實例
   */
  getModule(moduleId: string): IBlueprintModule | undefined;

  /**
   * 獲取所有模組
   *
   * @returns 模組陣列
   */
  getAllModules(): IBlueprintModule[];

  /**
   * 獲取指定狀態的模組
   *
   * @param status - 模組狀態
   * @returns 模組陣列
   */
  getModulesByStatus(status: ModuleStatus): IBlueprintModule[];

  /**
   * 檢查模組是否已載入
   *
   * @param moduleId - 模組 ID
   * @returns true 如果模組已載入
   */
  hasModule(moduleId: string): boolean;

  /**
   * 檢查容器是否運行中
   *
   * @returns true 如果容器正在運行
   */
  isRunning(): boolean;
}
