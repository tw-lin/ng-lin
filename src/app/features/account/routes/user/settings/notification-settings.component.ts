/**
 * Notification Settings Component
 *
 * Allows users to configure notification preferences.
 *
 * @architecture
 * - UI Layer: Presentation and user interaction
 * - Uses NotificationStore for state management (proper separation of concerns)
 * - Uses NotificationRepository for data access (via Store)
 * - Follows Angular 20 modern patterns (Signals, Standalone, OnPush)
 *
 * @features
 * - View notification preferences
 * - Manage notification settings
 * - Display notification status and counts
 *
 * @usage
 * Add to routing configuration:
 * ```typescript
 * {
 *   path: 'notification-settings',
 *   component: NotificationSettingsComponent
 * }
 * ```
 */
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NotificationStore } from '@core/account/stores/notification.store';
import { LoggerService } from '@core/services/logger/logger.service';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-notification-settings',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-card nzTitle="通知設定">
      <!-- Notification Statistics -->
      <nz-descriptions nzBordered [nzColumn]="2">
        <nz-descriptions-item nzTitle="未讀通知">
          <nz-badge [nzCount]="unreadCount()" [nzShowZero]="true"></nz-badge>
        </nz-descriptions-item>

        <nz-descriptions-item nzTitle="載入狀態">
          <nz-tag [nzColor]="loading() ? 'processing' : 'success'">
            {{ loading() ? '載入中' : '已載入' }}
          </nz-tag>
        </nz-descriptions-item>
      </nz-descriptions>

      <!-- Notification List -->
      <nz-divider />
      <h4>最近通知</h4>

      @if (notifications().length > 0) {
        <nz-list [nzDataSource]="notifications()" nzBordered>
          <nz-list-item *ngFor="let item of notifications()">
            <nz-list-item-meta [nzTitle]="item.title" [nzDescription]="item.description ?? ''">
              <nz-list-item-meta-avatar>
                @if (item.avatar) {
                  <nz-avatar [nzSrc]="item.avatar"></nz-avatar>
                } @else {
                  <nz-avatar nzIcon="bell"></nz-avatar>
                }
              </nz-list-item-meta-avatar>
            </nz-list-item-meta>

            <ul nz-list-item-actions>
              <nz-list-item-action>
                <nz-tag [nzColor]="item.read ? 'default' : 'blue'">
                  {{ item.read ? '已讀' : '未讀' }}
                </nz-tag>
              </nz-list-item-action>
              <nz-list-item-action>
                <small class="text-muted">{{ formatDate(item.datetime) }}</small>
              </nz-list-item-action>
            </ul>
          </nz-list-item>
        </nz-list>
      } @else {
        <nz-empty nzNotFoundContent="目前沒有通知"></nz-empty>
      }

      <!-- Actions -->
      <nz-divider />
      <nz-space>
        <button *nzSpaceItem nz-button nzType="primary" (click)="refreshNotifications()" [nzLoading]="loading()">
          <span nz-icon nzType="reload"></span>
          重新載入
        </button>

        @if (notifications().length > 0) {
          <button *nzSpaceItem nz-button nzType="default" (click)="clearAllNotifications()">
            <span nz-icon nzType="delete"></span>
            清除全部
          </button>
        }
      </nz-space>

      <!-- Help Information -->
      <nz-divider />
      <nz-alert nzType="info" nzMessage="關於通知" nzDescription="此頁面顯示您的系統通知。通知會在您有新活動時自動推送。" nzShowIcon />
    </nz-card>
  `,
  styles: [
    `
      :host {
        display: block;
        padding: 24px;
      }

      .text-muted {
        color: rgba(0, 0, 0, 0.45);
      }

      .mt-2 {
        margin-top: 8px;
      }

      .mt-3 {
        margin-top: 16px;
      }

      .mt-4 {
        margin-top: 24px;
      }
    `
  ]
})
export class NotificationSettingsComponent {
  // Properly inject services following separation of concerns
  private readonly notificationStore = inject(NotificationStore);
  private readonly logger = inject(LoggerService);

  // UI state
  private readonly _userId = signal<string>('current-user'); // TODO: Get from auth service

  // State from NotificationStore (proper separation)
  readonly loading = computed(() => this.notificationStore.loading());
  readonly unreadCount = computed(() => this.notificationStore.unreadCount());
  readonly notifications = computed(() => this.notificationStore.todoNotifications());

  constructor() {
    // Auto-load notifications on component init
    this.loadNotifications();
  }

  /**
   * Load notifications for current user
   */
  async loadNotifications(): Promise<void> {
    try {
      const userId = this._userId();
      this.logger.info('[NotificationSettingsComponent]', 'Loading notifications for user', userId);
      await this.notificationStore.loadNotifications(userId);
    } catch (error) {
      this.logger.error('[NotificationSettingsComponent]', 'Failed to load notifications', error as Error);
    }
  }

  /**
   * Refresh notifications
   */
  async refreshNotifications(): Promise<void> {
    await this.loadNotifications();
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    try {
      const userId = this._userId();
      // Clear all notification types - adjust based on your notification types
      await this.notificationStore.clearByType(userId, 'all');
      this.logger.info('[NotificationSettingsComponent]', 'Cleared all notifications');
    } catch (error) {
      this.logger.error('[NotificationSettingsComponent]', 'Failed to clear notifications', error as Error);
    }
  }

  /**
   * Format date for display
   */
  formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('zh-TW');
  }
}
