/**
 * Lifecycle Manager Implementation
 * 生命週期管理器實作
 *
 * @packageDocumentation
 * @module BlueprintCore
 */

import { Injectable, inject, signal } from '@angular/core';

import { ILifecycleManager, LIFECYCLE_TRANSITIONS } from './lifecycle-manager.interface';
import { IExecutionContext } from '../context/execution-context.interface';
import { IEventBus } from '../events/event-bus.interface';
import { BlueprintEventType } from '../events/event-types';
import { ModuleStatus } from '../modules/module-status.enum';
import { IBlueprintModule } from '../modules/module.interface';

/**
 * 模組生命週期狀態
 */
interface ModuleLifecycleState {
  module: IBlueprintModule;
  context: IExecutionContext;
  currentStatus: ModuleStatus;
  previousStatus: ModuleStatus | null;
  errorCount: number;
}

/**
 * 生命週期管理器
 *
 * 負責管理所有模組的生命週期狀態轉換。
 *
 * @example
 * ```typescript
 * const lifecycleManager = inject(LifecycleManager);
 *
 * // Initialize module
 * await lifecycleManager.initialize(tasksModule, context);
 *
 * // Start and ready
 * await lifecycleManager.start('tasks-module');
 * await lifecycleManager.ready('tasks-module');
 * ```
 */
@Injectable({ providedIn: 'root' })
export class LifecycleManager implements ILifecycleManager {
  private eventBus: any; // Avoid circular dependency with IEventBus
  private modules = new Map<string, ModuleLifecycleState>();

  /**
   * 模組總數 (Signal)
   */
  moduleCount = signal(0);

  /**
   * 初始化模組
   */
  async initialize(module: IBlueprintModule, context: IExecutionContext): Promise<void> {
    if (this.modules.has(module.id)) {
      throw new Error(`Module '${module.id}' is already initialized`);
    }

    // Store event bus reference
    this.eventBus = context.eventBus;

    const state: ModuleLifecycleState = {
      module,
      context,
      currentStatus: ModuleStatus.UNINITIALIZED,
      previousStatus: null,
      errorCount: 0
    };

    this.modules.set(module.id, state);
    this.moduleCount.set(this.modules.size);

    try {
      // Transition to initialized
      await this.transitionTo(module.id, ModuleStatus.INITIALIZED);

      // Call module init
      await module.init(context);

      // Emit event
      this.eventBus?.emit(
        BlueprintEventType.MODULE_INITIALIZED,
        {
          moduleId: module.id,
          moduleName: module.name,
          status: ModuleStatus.INITIALIZED
        },
        module.id
      );
    } catch (error) {
      await this.handleError(module.id, error);
      throw error;
    }
  }

  /**
   * 啟動模組
   */
  async start(moduleId: string): Promise<void> {
    const state = this.getModuleState(moduleId);

    try {
      // Transition: initialized → starting
      await this.transitionTo(moduleId, ModuleStatus.STARTING);

      this.eventBus?.emit(
        BlueprintEventType.MODULE_STARTING,
        {
          moduleId,
          moduleName: state.module.name
        },
        moduleId
      );

      // Call module start
      await state.module.start();

      // Transition: starting → started
      await this.transitionTo(moduleId, ModuleStatus.STARTED);

      this.eventBus?.emit(
        BlueprintEventType.MODULE_STARTED,
        {
          moduleId,
          moduleName: state.module.name,
          status: ModuleStatus.STARTED
        },
        moduleId
      );
    } catch (error) {
      await this.handleError(moduleId, error);
      throw error;
    }
  }

  /**
   * 標記模組為就緒
   */
  async ready(moduleId: string): Promise<void> {
    const state = this.getModuleState(moduleId);

    try {
      // Call module ready
      await state.module.ready();

      // Transition: started → ready
      await this.transitionTo(moduleId, ModuleStatus.READY);

      this.eventBus?.emit(
        BlueprintEventType.MODULE_READY,
        {
          moduleId,
          moduleName: state.module.name,
          status: ModuleStatus.READY
        },
        moduleId
      );
    } catch (error) {
      await this.handleError(moduleId, error);
      throw error;
    }
  }

  /**
   * 停止模組
   */
  async stop(moduleId: string): Promise<void> {
    const state = this.getModuleState(moduleId);

    try {
      // Transition: ready → stopping
      await this.transitionTo(moduleId, ModuleStatus.STOPPING);

      this.eventBus?.emit(
        BlueprintEventType.MODULE_STOPPING,
        {
          moduleId,
          moduleName: state.module.name
        },
        moduleId
      );

      // Call module stop
      await state.module.stop();

      // Transition: stopping → stopped
      await this.transitionTo(moduleId, ModuleStatus.STOPPED);

      this.eventBus?.emit(
        BlueprintEventType.MODULE_STOPPED,
        {
          moduleId,
          moduleName: state.module.name,
          status: ModuleStatus.STOPPED
        },
        moduleId
      );
    } catch (error) {
      await this.handleError(moduleId, error);
      throw error;
    }
  }

  /**
   * 銷毀模組
   */
  async dispose(moduleId: string): Promise<void> {
    const state = this.getModuleState(moduleId);

    try {
      // Call module dispose
      await state.module.dispose();

      // Transition: stopped → disposed
      await this.transitionTo(moduleId, ModuleStatus.DISPOSED);

      this.eventBus?.emit(
        BlueprintEventType.MODULE_DISPOSED,
        {
          moduleId,
          moduleName: state.module.name,
          status: ModuleStatus.DISPOSED
        },
        moduleId
      );

      // Remove from registry
      this.modules.delete(moduleId);
      this.moduleCount.set(this.modules.size);
    } catch (error) {
      await this.handleError(moduleId, error);
      throw error;
    }
  }

  /**
   * 獲取模組狀態
   */
  getState(moduleId: string): ModuleStatus {
    const state = this.modules.get(moduleId);
    if (!state) {
      throw new Error(`Module '${moduleId}' not found`);
    }
    return state.currentStatus;
  }

  /**
   * 檢查模組是否就緒
   */
  isModuleReady(moduleId: string): boolean {
    try {
      return this.getState(moduleId) === ModuleStatus.READY;
    } catch {
      return false;
    }
  }

  /**
   * 獲取所有處於指定狀態的模組
   */
  getModulesByState(status: ModuleStatus): string[] {
    const result: string[] = [];
    for (const [moduleId, state] of this.modules.entries()) {
      if (state.currentStatus === status) {
        result.push(moduleId);
      }
    }
    return result;
  }

  /**
   * 狀態轉換
   *
   * @private
   */
  private async transitionTo(moduleId: string, newStatus: ModuleStatus): Promise<void> {
    const state = this.getModuleState(moduleId);
    const currentStatus = state.currentStatus;

    // Validate transition
    const allowedTransitions = LIFECYCLE_TRANSITIONS[currentStatus];
    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(`Invalid state transition for module '${moduleId}': ${currentStatus} → ${newStatus}`);
    }

    // Update state
    state.previousStatus = currentStatus;
    state.currentStatus = newStatus;
  }

  /**
   * 錯誤處理與回滾
   *
   * @private
   */
  private async handleError(moduleId: string, error: unknown): Promise<void> {
    const state = this.modules.get(moduleId);
    if (!state) return;

    state.errorCount++;
    const previousStatus = state.currentStatus;
    state.currentStatus = ModuleStatus.ERROR;

    this.eventBus?.emit(
      BlueprintEventType.MODULE_ERROR,
      {
        moduleId,
        moduleName: state.module.name,
        error: error instanceof Error ? error.message : String(error),
        previousStatus,
        errorCount: state.errorCount
      },
      moduleId
    );

    // Attempt rollback to previous stable state
    if (state.previousStatus && state.errorCount < 3) {
      try {
        state.currentStatus = state.previousStatus;
        state.previousStatus = null;
      } catch (rollbackError) {
        // Rollback failed, remain in error state
        console.error(`Rollback failed for module '${moduleId}':`, rollbackError);
      }
    }
  }

  /**
   * 獲取模組狀態（內部）
   *
   * @private
   */
  private getModuleState(moduleId: string): ModuleLifecycleState {
    const state = this.modules.get(moduleId);
    if (!state) {
      throw new Error(`Module '${moduleId}' not found in lifecycle manager`);
    }
    return state;
  }
}
