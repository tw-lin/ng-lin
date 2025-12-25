/**
 * Google Generative AI Integration - Service Layer
 *
 * 業務邏輯協調層，負責：
 * 1. 協調 Repository 呼叫
 * 2. 整合 BlueprintEventBus
 * 3. 業務邏輯處理
 */

import { inject, Injectable } from '@angular/core';

import { AIRepository } from '../../data-access/ai/ai.repository';
import {
  AIGenerateTextRequest,
  AIGenerateTextResponse,
  AIChatMessage,
  AIGenerateChatRequest,
  AIGenerateChatResponse
} from '../../data-access/ai/ai.types';

/**
 * AI Service
 *
 * 提供 AI 功能的業務邏輯層
 * 整合事件總線進行操作記錄
 */
@Injectable({ providedIn: 'root' })
export class AIService {
  private aiRepository = inject(AIRepository);

  /**
   * 生成文字
   *
   * @param prompt 提示詞
   * @param options 選項參數
   * @returns AI 生成的文字回應
   *
   * @example
   * ```typescript
   * const response = await this.aiService.generateText(
   *   '幫我寫一段關於施工安全的說明...',
   *   { maxTokens: 500, blueprintId: 'bp-123' }
   * );
   * ```
   */
  async generateText(
    prompt: string,
    options?: {
      maxTokens?: number;
      temperature?: number;
      blueprintId?: string;
    }
  ): Promise<AIGenerateTextResponse> {
    const request: AIGenerateTextRequest = {
      prompt,
      ...options
    };

    try {
      const response = await this.aiRepository.generateText(request);

      // 發送成功事件
      if (options?.blueprintId) {
        this.emitEvent('ai.text.generated', options.blueprintId, {
          tokensUsed: response.tokensUsed,
          model: response.model
        });
      }

      return response;
    } catch (error) {
      // 發送錯誤事件
      if (options?.blueprintId) {
        this.emitEvent('ai.text.failed', options.blueprintId, {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      throw error;
    }
  }

  /**
   * 生成對話回應
   *
   * @param messages 對話訊息陣列
   * @param options 選項參數
   * @returns AI 對話回應
   *
   * @example
   * ```typescript
   * const response = await this.aiService.generateChat(
   *   [
   *     { role: 'user', content: '什麼是施工安全？' },
   *     { role: 'model', content: '施工安全是...' },
   *     { role: 'user', content: '有哪些重要的安全措施？' }
   *   ],
   *   { blueprintId: 'bp-123' }
   * );
   * ```
   */
  async generateChat(
    messages: AIChatMessage[],
    options?: {
      maxTokens?: number;
      temperature?: number;
      blueprintId?: string;
    }
  ): Promise<AIGenerateChatResponse> {
    const request: AIGenerateChatRequest = {
      messages,
      ...options
    };

    try {
      const response = await this.aiRepository.generateChat(request);

      // 發送成功事件
      if (options?.blueprintId) {
        this.emitEvent('ai.chat.generated', options.blueprintId, {
          tokensUsed: response.tokensUsed,
          model: response.model,
          messageCount: messages.length
        });
      }

      return response;
    } catch (error) {
      // 發送錯誤事件
      if (options?.blueprintId) {
        this.emitEvent('ai.chat.failed', options.blueprintId, {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      throw error;
    }
  }

  /**
   * 發送事件到事件總線
   *
   * @param type 事件類型
   * @param blueprintId Blueprint ID
   * @param data 事件資料
   * @private
   */
  private emitEvent(type: string, blueprintId: string, data: Record<string, unknown>): void {
    // TODO: 整合 BlueprintEventBus
    // 當 EventBus 實作完成後，可以在此處發送事件
    console.log(`[AI Event] ${type}`, { blueprintId, data });
  }
}
