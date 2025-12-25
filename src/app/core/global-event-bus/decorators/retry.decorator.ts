import 'reflect-metadata';
import type { IRetryPolicy } from '../interfaces/retry-policy.interface';

/**
 * Retry 裝飾器
 * 
 * 方法級別的裝飾器，用於為特定方法添加自動重試邏輯。
 * 當方法執行失敗時，會根據指定的重試策略自動重試。
 * 
 * 這個裝飾器與 RetryManagerService 配合使用，提供聲明式的重試配置。
 * 
 * @param policy 重試策略配置
 * 
 * @example
 * ```typescript
 * class TaskService {
 *   @Retry({
 *     maxAttempts: 3,
 *     backoff: 'exponential',
 *     initialDelay: 1000,
 *     maxDelay: 30000
 *   })
 *   async createTask(task: Task): Promise<Task> {
 *     // 這個方法會自動重試最多 3 次
 *     return await this.repository.create(task);
 *   }
 * }
 * ```
 */

/**
 * Retry 方法裝飾器
 * 
 * 攔截方法執行，在失敗時自動重試。
 * 支援三種 backoff 策略：
 * - exponential: 指數退避 (delay = initialDelay * 2^(attempt-1))
 * - linear: 線性退避 (delay = initialDelay * attempt)
 * - fixed: 固定延遲 (delay = initialDelay)
 * 
 * @param policy 重試策略配置
 * @returns 方法裝飾器函數
 */
export function Retry(policy: Partial<IRetryPolicy>): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    // 設定預設重試策略
    const retryPolicy: IRetryPolicy = {
      maxAttempts: policy.maxAttempts ?? 3,
      backoff: policy.backoff ?? 'exponential',
      initialDelay: policy.initialDelay ?? 1000,
      maxDelay: policy.maxDelay ?? 30000,
      shouldRetry: policy.shouldRetry ?? ((error: Error) => {
        // 預設：所有錯誤都重試，除了特定的非重試錯誤
        const nonRetryableErrors = [
          'ValidationError',
          'AuthenticationError',
          'AuthorizationError',
          'NotFoundError',
          'ConflictError'
        ];
        return !nonRetryableErrors.includes(error.name);
      })
    };

    // 替換原方法為包含重試邏輯的版本
    descriptor.value = async function (...args: any[]) {
      let lastError: Error | undefined;
      
      for (let attempt = 1; attempt <= retryPolicy.maxAttempts; attempt++) {
        try {
          // 嘗試執行原方法
          const result = await originalMethod.apply(this, args);
          
          // 成功則直接返回
          return result;
        } catch (error) {
          lastError = error as Error;
          
          // 檢查是否應該重試
          if (!retryPolicy.shouldRetry || !retryPolicy.shouldRetry(lastError)) {
            throw lastError;
          }
          
          // 如果是最後一次嘗試，拋出錯誤
          if (attempt >= retryPolicy.maxAttempts) {
            throw lastError;
          }
          
          // 計算延遲時間
          const delay = calculateDelay(attempt, retryPolicy);
          
          // 記錄重試資訊（僅在開發模式）
          if (typeof console !== 'undefined' && console.warn) {
            console.warn(
              `[@Retry] Method ${String(propertyKey)} failed (attempt ${attempt}/${retryPolicy.maxAttempts}). ` +
              `Retrying in ${delay}ms...`,
              lastError
            );
          }
          
          // 等待延遲後重試
          await sleep(delay);
        }
      }
      
      // 理論上不應該到達這裡，但為了類型安全
      throw lastError;
    };

    // 儲存重試策略元數據
    Reflect.defineMetadata('retry:policy', retryPolicy, target, propertyKey);
    Reflect.defineMetadata('retry:enabled', true, target, propertyKey);

    return descriptor;
  };
}

/**
 * 計算延遲時間
 * 
 * @param attempt 當前嘗試次數（從 1 開始）
 * @param policy 重試策略
 * @returns 延遲毫秒數
 */
function calculateDelay(attempt: number, policy: IRetryPolicy): number {
  let delay: number;
  
  switch (policy.backoff) {
    case 'exponential':
      // 指數退避: delay = initialDelay * 2^(attempt-1)
      delay = policy.initialDelay * Math.pow(2, attempt - 1);
      break;
    
    case 'linear':
      // 線性退避: delay = initialDelay * attempt
      delay = policy.initialDelay * attempt;
      break;
    
    case 'fixed':
    default:
      // 固定延遲
      delay = policy.initialDelay;
      break;
  }
  
  // 應用最大延遲限制
  if (policy.maxDelay) {
    delay = Math.min(delay, policy.maxDelay);
  }
  
  // 添加 jitter（±10%）以避免 thundering herd 問題
  const jitter = delay * 0.1 * (Math.random() * 2 - 1);
  delay = Math.round(delay + jitter);
  
  return delay;
}

/**
 * 延遲執行
 * 
 * @param ms 延遲毫秒數
 * @returns Promise
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 檢查方法是否啟用重試
 * 
 * @param target 目標物件
 * @param propertyKey 方法名稱
 * @returns 如果啟用重試則返回 true
 */
export function hasRetry(target: any, propertyKey: string | symbol): boolean {
  return Reflect.getMetadata('retry:enabled', target, propertyKey) === true;
}

/**
 * 取得方法的重試策略
 * 
 * @param target 目標物件
 * @param propertyKey 方法名稱
 * @returns 重試策略，如果未設定則返回 undefined
 */
export function getRetryPolicy(target: any, propertyKey: string | symbol): IRetryPolicy | undefined {
  if (!hasRetry(target, propertyKey)) {
    return undefined;
  }
  return Reflect.getMetadata('retry:policy', target, propertyKey);
}
