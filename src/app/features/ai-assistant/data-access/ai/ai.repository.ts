/**
 * Google Generative AI Integration - Repository Layer
 *
 * 負責與 Firebase Functions 的 AI Callable Functions 通訊
 * 遵循 GigHub 三層架構：UI → Service → Repository → Infrastructure
 */

import { inject, Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

import { AIGenerateTextRequest, AIGenerateTextResponse, AIGenerateChatRequest, AIGenerateChatResponse } from './ai.types';

/**
 * AI Repository
 *
 * 提供與 Firebase Functions AI 服務的介面
 * 所有方法都是類型安全的，並包含完整的錯誤處理
 */
@Injectable({ providedIn: 'root' })
export class AIRepository {
  private functions = inject(Functions);

  /**
   * 生成文字
   *
   * 呼叫 Firebase Functions 的 ai-generateText
   *
   * @param request 文字生成請求
   * @returns AI 生成的文字回應
   * @throws Error 當 API 呼叫失敗時
   *
   * @example
   * ```typescript
   * const response = await this.aiRepository.generateText({
   *   prompt: '幫我寫一段關於施工安全的說明...'
   * });
   * console.log(response.text);
   * ```
   */
  async generateText(request: AIGenerateTextRequest): Promise<AIGenerateTextResponse> {
    const callable = httpsCallable<AIGenerateTextRequest, AIGenerateTextResponse>(this.functions, 'ai-generateText');

    try {
      const result = await callable(request);
      return result.data;
    } catch (error) {
      console.error('Failed to generate text:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 生成對話回應
   *
   * 呼叫 Firebase Functions 的 ai-generateChat
   * 支援多輪對話，保持上下文
   *
   * @param request 對話生成請求
   * @returns AI 對話回應
   * @throws Error 當 API 呼叫失敗時
   *
   * @example
   * ```typescript
   * const response = await this.aiRepository.generateChat({
   *   messages: [
   *     { role: 'user', content: '什麼是施工安全？' },
   *     { role: 'model', content: '施工安全是...' },
   *     { role: 'user', content: '有哪些重要的安全措施？' }
   *   ]
   * });
   * console.log(response.response);
   * ```
   */
  async generateChat(request: AIGenerateChatRequest): Promise<AIGenerateChatResponse> {
    const callable = httpsCallable<AIGenerateChatRequest, AIGenerateChatResponse>(this.functions, 'ai-generateChat');

    try {
      const result = await callable(request);
      return result.data;
    } catch (error) {
      console.error('Failed to generate chat:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 錯誤處理
   *
   * 將 Firebase Functions 錯誤轉換為友善的錯誤訊息
   *
   * @param error Firebase Functions 錯誤
   * @returns 包含友善訊息的 Error 物件
   * @private
   */
  private handleError(error: unknown): Error {
    if (error && typeof error === 'object' && 'code' in error) {
      const code = (error as { code: string }).code;
      const message = 'message' in error ? (error as { message: string }).message : '';

      switch (code) {
        case 'unauthenticated':
          return new Error('請先登入後再使用 AI 功能');
        case 'permission-denied':
          return new Error('您沒有權限使用此功能');
        case 'invalid-argument':
          return new Error(message || '輸入參數錯誤');
        case 'resource-exhausted':
          return new Error('AI 服務請求過於頻繁，請稍後再試');
        case 'deadline-exceeded':
          return new Error('AI 服務回應超時，請稍後再試');
        default:
          return new Error('AI 服務暫時無法使用，請稍後再試');
      }
    }

    return error instanceof Error ? error : new Error('未知錯誤');
  }
}
