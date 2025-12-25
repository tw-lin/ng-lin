import { Injectable, inject } from '@angular/core';

import { ModuleConnection } from '../models/module-connection.interface';

/**
 * 依賴驗證結果介面
 */
export interface DependencyValidationResult {
  /** 是否有效 */
  isValid: boolean;
  /** 錯誤列表 */
  errors: ValidationError[];
  /** 警告列表 */
  warnings: ValidationWarning[];
}

/**
 * 驗證錯誤介面
 */
export interface ValidationError {
  /** 錯誤類型 */
  type: 'circular_dependency' | 'missing_module' | 'invalid_connection';
  /** 錯誤訊息 */
  message: string;
  /** 相關模組 ID */
  moduleIds?: string[];
  /** 循環路徑 (用於循環依賴) */
  cyclePath?: string[];
}

/**
 * 驗證警告介面
 */
export interface ValidationWarning {
  /** 警告類型 */
  type: 'unused_module' | 'redundant_connection';
  /** 警告訊息 */
  message: string;
  /** 相關模組 ID */
  moduleIds?: string[];
}

/**
 * 依賴驗證服務
 *
 * 使用 DFS 演算法檢測循環依賴,檢查缺失模組等驗證功能
 */
@Injectable({ providedIn: 'root' })
export class DependencyValidatorService {
  /**
   * 驗證藍圖配置
   *
   * @param moduleIds - 所有模組 ID 列表
   * @param connections - 連接列表
   * @returns 驗證結果
   */
  validate(moduleIds: string[], connections: ModuleConnection[]): DependencyValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 檢測循環依賴
    const cycles = this.detectCircularDependencies(moduleIds, connections);
    if (cycles.length > 0) {
      for (const cycle of cycles) {
        errors.push({
          type: 'circular_dependency',
          message: `偵測到循環依賴: ${cycle.join(' → ')} → ${cycle[0]}`,
          moduleIds: cycle,
          cyclePath: cycle
        });
      }
    }

    // 檢查缺失模組
    const missingModules = this.checkMissingModules(moduleIds, connections);
    for (const moduleId of missingModules) {
      errors.push({
        type: 'missing_module',
        message: `模組 ${moduleId} 不存在`,
        moduleIds: [moduleId]
      });
    }

    // 檢查無效連接
    const invalidConnections = this.checkInvalidConnections(connections);
    for (const conn of invalidConnections) {
      errors.push({
        type: 'invalid_connection',
        message: `無效連接: ${conn.source.moduleId} → ${conn.target.moduleId}`,
        moduleIds: [conn.source.moduleId, conn.target.moduleId]
      });
    }

    // 檢查未使用的模組
    const unusedModules = this.findUnusedModules(moduleIds, connections);
    for (const moduleId of unusedModules) {
      warnings.push({
        type: 'unused_module',
        message: `模組 ${moduleId} 未被使用`,
        moduleIds: [moduleId]
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 檢測循環依賴 (使用 DFS 演算法)
   *
   * @param moduleIds - 所有模組 ID
   * @param connections - 連接列表
   * @returns 循環路徑列表
   */
  private detectCircularDependencies(moduleIds: string[], connections: ModuleConnection[]): string[][] {
    const cycles: string[][] = [];
    const adjList = this.buildAdjacencyList(moduleIds, connections);
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const path: string[] = [];

    for (const moduleId of moduleIds) {
      if (!visited.has(moduleId)) {
        this.dfsDetectCycle(moduleId, adjList, visited, recStack, path, cycles);
      }
    }

    return cycles;
  }

  /**
   * DFS 檢測循環
   */
  private dfsDetectCycle(
    node: string,
    adjList: Map<string, string[]>,
    visited: Set<string>,
    recStack: Set<string>,
    path: string[],
    cycles: string[][]
  ): void {
    visited.add(node);
    recStack.add(node);
    path.push(node);

    const neighbors = adjList.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        this.dfsDetectCycle(neighbor, adjList, visited, recStack, path, cycles);
      } else if (recStack.has(neighbor)) {
        // 找到循環
        const cycleStart = path.indexOf(neighbor);
        if (cycleStart !== -1) {
          const cycle = path.slice(cycleStart);
          cycles.push(cycle);
        }
      }
    }

    path.pop();
    recStack.delete(node);
  }

  /**
   * 建立鄰接表 (Adjacency List)
   */
  private buildAdjacencyList(moduleIds: string[], connections: ModuleConnection[]): Map<string, string[]> {
    const adjList = new Map<string, string[]>();

    // 初始化所有模組
    for (const moduleId of moduleIds) {
      adjList.set(moduleId, []);
    }

    // 建立連接關係
    for (const conn of connections) {
      const sourceList = adjList.get(conn.source.moduleId) || [];
      sourceList.push(conn.target.moduleId);
      adjList.set(conn.source.moduleId, sourceList);
    }

    return adjList;
  }

  /**
   * 檢查缺失模組
   */
  private checkMissingModules(moduleIds: string[], connections: ModuleConnection[]): string[] {
    const existingModules = new Set(moduleIds);
    const missingModules = new Set<string>();

    for (const conn of connections) {
      if (!existingModules.has(conn.source.moduleId)) {
        missingModules.add(conn.source.moduleId);
      }
      if (!existingModules.has(conn.target.moduleId)) {
        missingModules.add(conn.target.moduleId);
      }
    }

    return Array.from(missingModules);
  }

  /**
   * 檢查無效連接 (例如自連接)
   */
  private checkInvalidConnections(connections: ModuleConnection[]): ModuleConnection[] {
    return connections.filter(conn => conn.source.moduleId === conn.target.moduleId);
  }

  /**
   * 尋找未使用的模組
   */
  private findUnusedModules(moduleIds: string[], connections: ModuleConnection[]): string[] {
    const usedModules = new Set<string>();

    for (const conn of connections) {
      usedModules.add(conn.source.moduleId);
      usedModules.add(conn.target.moduleId);
    }

    return moduleIds.filter(id => !usedModules.has(id));
  }
}
