/**
 * Google Generative AI Integration - Store Layer (Signals)
 *
 * 使用 Angular Signals 進行狀態管理
 * 提供響應式的 AI 狀態
 */

import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';

import { AIChatMessage, AIGenerateTextResponse, AIGenerateChatResponse } from '../../data-access/ai/ai.types';
import { AIService } from '../../services/ai/ai.service';

/**
 * AI 狀態介面
 */
interface AIState {
  /** 載入狀態 */
  loading: boolean;
  /** 錯誤訊息 */
  error: string | null;
  /** 最後一次回應 */
  lastResponse: string | null;
  /** 對話歷史 */
  chatHistory: AIChatMessage[];
  /** 已使用的總 tokens */
  totalTokensUsed: number;
}

/**
 * AI Store
 *
 * 管理 AI 功能的狀態，使用 Signals 提供響應式更新
 */
@Injectable({ providedIn: 'root' })
export class AIStore {
  private aiService = inject(AIService);
  private destroyRef = inject(DestroyRef);

  // Private state
  private _state = signal<AIState>({
    loading: false,
    error: null,
    lastResponse: null,
    chatHistory: [],
    totalTokensUsed: 0
  });

  // Public readonly state (computed signals)
  readonly loading = computed(() => this._state().loading);
  readonly error = computed(() => this._state().error);
  readonly lastResponse = computed(() => this._state().lastResponse);
  readonly chatHistory = computed(() => this._state().chatHistory);
  readonly totalTokensUsed = computed(() => this._state().totalTokensUsed);
  readonly hasHistory = computed(() => this._state().chatHistory.length > 0);

  /**
   * 生成文字
   *
   * @param prompt 提示詞
   * @param options 選項參數
   *
   * @example
   * ```typescript
   * await this.aiStore.generateText('幫我寫一段關於施工安全的說明...', {
   *   maxTokens: 500
   * });
   * ```
   */
  async generateText(
    prompt: string,
    options?: {
      maxTokens?: number;
      temperature?: number;
      blueprintId?: string;
    }
  ): Promise<void> {
    this._state.update(state => ({
      ...state,
      loading: true,
      error: null
    }));

    try {
      const response: AIGenerateTextResponse = await this.aiService.generateText(prompt, options);

      this._state.update(state => ({
        ...state,
        loading: false,
        lastResponse: response.text,
        totalTokensUsed: state.totalTokensUsed + response.tokensUsed
      }));
    } catch (error) {
      this._state.update(state => ({
        ...state,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      throw error;
    }
  }

  /**
   * 發送對話訊息
   *
   * @param message 使用者訊息
   * @param options 選項參數
   *
   * @example
   * ```typescript
   * await this.aiStore.sendChatMessage('什麼是施工安全？', {
   *   blueprintId: 'bp-123'
   * });
   * ```
   */
  async sendChatMessage(
    message: string,
    options?: {
      maxTokens?: number;
      temperature?: number;
      blueprintId?: string;
    }
  ): Promise<void> {
    // 1. 添加使用者訊息到歷史
    const userMessage: AIChatMessage = {
      role: 'user',
      content: message
    };

    this._state.update(state => ({
      ...state,
      loading: true,
      error: null,
      chatHistory: [...state.chatHistory, userMessage]
    }));

    try {
      // 2. 呼叫 AI Service
      const response: AIGenerateChatResponse = await this.aiService.generateChat(this._state().chatHistory, options);

      // 3. 添加 AI 回應到歷史
      const aiMessage: AIChatMessage = {
        role: 'model',
        content: response.response
      };

      this._state.update(state => ({
        ...state,
        loading: false,
        lastResponse: response.response,
        chatHistory: [...state.chatHistory, aiMessage],
        totalTokensUsed: state.totalTokensUsed + response.tokensUsed
      }));
    } catch (error) {
      this._state.update(state => ({
        ...state,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      throw error;
    }
  }

  /**
   * 清除對話歷史
   */
  clearChatHistory(): void {
    this._state.update(state => ({
      ...state,
      chatHistory: [],
      lastResponse: null,
      error: null
    }));
  }

  /**
   * 清除錯誤
   */
  clearError(): void {
    this._state.update(state => ({
      ...state,
      error: null
    }));
  }

  /**
   * 重置狀態
   */
  reset(): void {
    this._state.set({
      loading: false,
      error: null,
      lastResponse: null,
      chatHistory: [],
      totalTokensUsed: 0
    });
  }
}
