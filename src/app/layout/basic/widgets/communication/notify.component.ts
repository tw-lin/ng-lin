import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, effect, inject } from '@angular/core';
import { NotificationStore } from '@core/account/stores/notification.store';
import { AuthFacade } from '@core/data-access/auth/auth.facade';
import { NoticeIconModule, NoticeIconSelect } from '@delon/abc/notice-icon';
import { NzMessageService } from 'ng-zorro-antd/message';

/**
 * Header Notify Component
 *
 * Displays notifications using ng-alain notice-icon component
 * Connected to real Firebase data via NotificationStore
 *
 * Architecture:
 * - UI Layer: This component (display only)
 * - State Management: NotificationStore (business logic)
 * - Data Access: NotificationRepository (Firestore operations)
 */
@Component({
  selector: 'header-notify',
  template: `
    <notice-icon
      [data]="notificationStore.groupedNotifications()"
      [count]="notificationStore.unreadCount()"
      [loading]="notificationStore.loading()"
      btnClass="alain-default__nav-item"
      btnIconClass="alain-default__nav-item-icon"
      (select)="select($event)"
      (clear)="clear($event)"
      (popoverVisibleChange)="loadData()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NoticeIconModule]
})
export class HeaderNotifyComponent implements OnInit {
  private readonly msg = inject(NzMessageService);
  private readonly auth = inject(AuthFacade);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly notificationStore = inject(NotificationStore);
  private currentUserId?: string;
  private unsubscribeRealtime?: () => void;

  constructor() {
    // Move effect() to constructor to ensure it's within injection context
    effect(() => {
      const user = this.auth.currentUserSignal();
      if (!user) {
        this.currentUserId = undefined;
        this.unsubscribeRealtime?.();
        this.unsubscribeRealtime = undefined;
        return;
      }

      if (this.currentUserId === user.uid) {
        return;
      }

      this.unsubscribeRealtime?.();
      this.currentUserId = user.uid;
      this.unsubscribeRealtime = this.notificationStore.subscribeToRealtimeUpdates(user.uid, this.destroyRef);
      void this.notificationStore.loadNotifications(user.uid);
    });
  }

  ngOnInit(): void {
    // Initialization handled by effect in constructor
  }

  async loadData(): Promise<void> {
    const userId = this.currentUserId ?? this.auth.currentUserSignal()?.uid;
    if (userId) {
      await this.notificationStore.loadNotifications(userId);
    }
  }

  async clear(type: string): Promise<void> {
    const userId = this.currentUserId ?? this.auth.currentUserSignal()?.uid;
    if (userId) {
      await this.notificationStore.clearByType(userId, type);
      this.msg.success(`清空了 ${type}`);
    }
  }

  async select(res: NoticeIconSelect): Promise<void> {
    const itemId = (res.item as { id?: string } | undefined)?.id;
    if (itemId) {
      await this.notificationStore.markAsRead(itemId);
    }
    this.msg.success(`點擊了 ${res.title} 的 ${res.item.title}`);
  }
}
