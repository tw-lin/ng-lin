import { Component, inject, signal, computed, ChangeDetectionStrategy, ViewChild, ElementRef } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

import { AIStore } from '../features/ai';

/**
 * AI Assistant Component
 *
 * Provides an AI-powered chat assistant interface integrated with the GigHub system.
 * Supports context-aware conversations based on user/organization/team/blueprint context.
 *
 * @architecture
 * - Uses AIStore for state management (Signals)
 * - Integrates with existing AI Service/Repository layers
 * - Supports multi-turn conversations with context
 *
 * @features
 * - Real-time chat with Google Gemini AI
 * - Context-aware responses
 * - Conversation history
 * - Token usage tracking
 * - Error handling with user-friendly messages
 */
@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS],
  template: `
    <div style="height: 100%; display: flex; flex-direction: column;">
      <!-- Page Header -->
      <page-header title="AI 助理" subtitle="由 Google Gemini 驅動的智能對話助手">
        <ng-template #extra>
          <nz-space>
            @if (totalTokensUsed() > 0) {
              <nz-statistic *nzSpaceItem [nzValue]="totalTokensUsed()" nzTitle="Token 使用量" [nzValueStyle]="{ fontSize: '16px' }" />
            }
            @if (hasHistory()) {
              <button *nzSpaceItem nz-button nzType="default" nzDanger (click)="clearHistory()" [disabled]="loading()">
                <span nz-icon nzType="delete" nzTheme="outline"></span>
                清除對話
              </button>
            }
          </nz-space>
        </ng-template>
      </page-header>

      <!-- Error Alert -->
      @if (error()) {
        <nz-alert nzType="error" [nzMessage]="error()!" nzCloseable (nzOnClose)="clearError()" nzShowIcon style="margin-bottom: 16px;" />
      }

      <!-- Chat Container -->
      <div
        style="flex: 1; display: flex; flex-direction: column; background: var(--component-background); border-radius: 8px; overflow: hidden; margin: 0 16px 16px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);"
      >
        <!-- Chat Messages -->
        <div
          id="chatMessages"
          #chatMessages
          style="flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 16px;"
        >
          @if (!hasHistory()) {
            <!-- Welcome Message -->
            <nz-empty nzNotFoundImage="simple" [nzNotFoundContent]="welcomeTemplate" />
            <ng-template #welcomeTemplate>
              <div style="text-align: center; padding: 40px 20px;">
                <h3 style="font-size: 24px; margin-bottom: 16px; color: var(--primary-color);">👋 歡迎使用 AI 助理</h3>
                <p style="font-size: 16px; margin-bottom: 12px;">我可以幫助您：</p>
                <ul style="text-align: left; display: inline-block; margin: 16px auto;">
                  <li style="font-size: 14px; margin: 8px 0;">📝 解答工程管理相關問題</li>
                  <li style="font-size: 14px; margin: 8px 0;">🔍 分析施工進度數據</li>
                  <li style="font-size: 14px; margin: 8px 0;">💡 提供專業建議與最佳實踐</li>
                  <li style="font-size: 14px; margin: 8px 0;">📊 生成報告與摘要</li>
                </ul>
                <p style="margin-top: 24px; font-size: 14px; color: var(--disabled-color);">在下方輸入您的問題開始對話...</p>
              </div>
            </ng-template>
          } @else {
            <!-- Message List -->
            @for (message of chatHistory(); track $index) {
              <div
                style="display: flex; gap: 12px; animation: fadeIn 0.3s ease-in;"
                [style.flex-direction]="message.role === 'user' ? 'row-reverse' : 'row'"
              >
                <div style="flex-shrink: 0;">
                  @if (message.role === 'user') {
                    <nz-avatar nzIcon="user" [nzSize]="32" />
                  } @else {
                    <nz-avatar nzIcon="robot" [nzSize]="32" />
                  }
                </div>
                <div
                  style="max-width: 70%; padding: 12px 16px;"
                  [style.background]="message.role === 'user' ? 'var(--primary-color)' : 'var(--item-hover-bg)'"
                  [style.color]="message.role === 'user' ? 'white' : 'var(--text-color)'"
                  [style.border-radius]="message.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px'"
                >
                  <div style="margin-bottom: 4px;">
                    <span style="font-size: 12px; font-weight: 500; opacity: 0.8;">
                      {{ message.role === 'user' ? '您' : 'AI 助理' }}
                    </span>
                  </div>
                  <div style="font-size: 14px; line-height: 1.6; white-space: pre-wrap; word-break: break-word;">{{ message.content }}</div>
                </div>
              </div>
            }

            <!-- Loading Indicator -->
            @if (loading()) {
              <div style="display: flex; gap: 12px; opacity: 0.8;">
                <div style="flex-shrink: 0;">
                  <nz-avatar nzIcon="robot" [nzSize]="32" />
                </div>
                <div style="padding: 12px 16px; background: var(--item-hover-bg); border-radius: 16px 16px 16px 4px;">
                  <div style="margin-bottom: 4px;">
                    <span style="font-size: 12px; font-weight: 500; opacity: 0.8;">AI 助理</span>
                  </div>
                  <div style="font-size: 14px;">
                    <nz-spin nzSimple [nzSize]="'small'" />
                    <span style="margin-left: 8px;">正在思考中...</span>
                  </div>
                </div>
              </div>
            }
          }
        </div>

        <!-- Chat Input -->
        <div style="border-top: 1px solid var(--border-color-base); padding: 16px 24px; background: var(--layout-body-background);">
          <nz-input-group [nzSuffix]="sendButton" nzSize="large">
            <textarea
              nz-input
              placeholder="輸入您的問題... (按 Enter 發送，Shift + Enter 換行)"
              [nzAutosize]="{ minRows: 1, maxRows: 4 }"
              [ngModel]="userMessage()"
              (ngModelChange)="userMessage.set($event)"
              (keydown)="handleKeyPress($event)"
              (compositionstart)="onCompositionStart()"
              (compositionend)="onCompositionEnd()"
              [disabled]="loading()"
              style="resize: none; font-size: 14px; line-height: 1.6;"
            ></textarea>
          </nz-input-group>
          <ng-template #sendButton>
            <button nz-button nzType="primary" nzSize="large" [disabled]="!canSend()" (click)="sendMessage()" style="margin-left: 8px;">
              <span nz-icon nzType="send" nzTheme="outline"></span>
              發送
            </button>
          </ng-template>
        </div>
      </div>

      <!-- Info Footer -->
      <div style="margin: 0 16px 16px;">
        <nz-alert
          nzType="info"
          nzMessage="AI 助理使用 Google Gemini 2.0 Flash 模型提供服務"
          [nzDescription]="infoTemplate"
          nzShowIcon
          nzCloseable
        />
        <ng-template #infoTemplate>
          <ul style="margin: 0; padding-left: 20px;">
            <li>AI 回應僅供參考，重要決策請諮詢專業人士</li>
            <li>對話內容將用於改善服務品質</li>
            <li>請勿分享敏感或機密資訊</li>
          </ul>
        </ng-template>
      </div>
    </div>

    <style>
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Scrollbar styles */
      #chatMessages::-webkit-scrollbar {
        width: 6px;
      }

      #chatMessages::-webkit-scrollbar-track {
        background: rgba(31, 41, 55, 0.5);
        border-radius: 3px;
      }

      #chatMessages::-webkit-scrollbar-thumb {
        background: #6b7280;
        border-radius: 3px;
      }

      #chatMessages::-webkit-scrollbar-thumb:hover {
        background: #9ca3af;
      }

      /* Responsive styles */
      @media (max-width: 768px) {
        [style*='max-width: 70%'] {
          max-width: 85% !important;
        }
      }
    </style>
  `,
  styles: []
})
export class AIAssistantComponent {
  private aiStore = inject(AIStore);

  @ViewChild('chatMessages', { read: ElementRef })
  private chatMessages?: ElementRef;

  // State signals from store
  loading = this.aiStore.loading;
  error = this.aiStore.error;
  chatHistory = this.aiStore.chatHistory;
  totalTokensUsed = this.aiStore.totalTokensUsed;
  hasHistory = this.aiStore.hasHistory;

  // Local UI state
  userMessage = signal('');
  isComposing = signal(false);

  // Computed signals
  canSend = computed(() => this.userMessage().trim().length > 0 && !this.loading() && !this.isComposing());

  /**
   * Send a message to the AI assistant
   */
  async sendMessage(): Promise<void> {
    const message = this.userMessage().trim();
    if (!message || this.loading()) {
      return;
    }

    try {
      // Clear input immediately for better UX
      this.userMessage.set('');

      // Send message through store
      await this.aiStore.sendChatMessage(message);

      // Scroll to bottom after message is sent
      this.scrollToBottom();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }

  /**
   * Handle Enter key press in input
   */
  handleKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey && !this.isComposing()) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * Handle composition events for IME input
   */
  onCompositionStart(): void {
    this.isComposing.set(true);
  }

  onCompositionEnd(): void {
    this.isComposing.set(false);
  }

  /**
   * Clear chat history
   */
  clearHistory(): void {
    this.aiStore.clearChatHistory();
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.aiStore.clearError();
  }

  /**
   * Scroll chat to bottom
   */
  private scrollToBottom(): void {
    requestAnimationFrame(() => {
      if (this.chatMessages?.nativeElement) {
        this.chatMessages.nativeElement.scrollTop = this.chatMessages.nativeElement.scrollHeight;
      }
    });
  }
}
