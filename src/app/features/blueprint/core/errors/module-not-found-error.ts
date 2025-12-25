import { BlueprintError } from './blueprint-error';

/**
 * Module not found error
 * 模組未找到錯誤
 */
export class ModuleNotFoundError extends BlueprintError {
  constructor(moduleType: string) {
    super(`Module ${moduleType} not found or not enabled`, 'MODULE_NOT_FOUND', 'medium', true, { moduleType });
    Object.setPrototypeOf(this, ModuleNotFoundError.prototype);
  }
}
