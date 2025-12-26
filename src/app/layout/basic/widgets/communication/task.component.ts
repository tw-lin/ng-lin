import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, effect, inject } from '@angular/core';
import { NotificationStore } from '@core/account/stores/notification.store';
import { AuthFacade } from '@core/data-access/auth/auth.facade';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';

/**
 * Header Task Component
 *
 * Displays todo-type notifications in a dropdown
 * Shares NotificationStore with notify.component
 *
 * Architecture:
 * - UI Layer: This component (display only)
 * - State Management: NotificationStore (business logic)
 * - Data Access: NotificationRepository (Firestore operations)
 */
@Component({
  selector: 'header-task',
  template: `
    <div
      class="alain-default__nav-item"
      nz-dropdown
      [nzDropdownMenu]="taskMenu"
      nzTrigger="click"
      nzPlacement="bottomRight"
      (nzVisibleChange)="loadData()"
    >
      <nz-badge [nzCount]="notificationStore.unreadTodoCount()">
        <i nz-icon nzType="bell" class="alain-default__nav-item-icon"></i>
      </nz-badge>
    </div>
    <nz-dropdown-menu #taskMenu="nzDropdownMenu">
      <div nz-menu class="wd-lg">
        @if (notificationStore.loading()) {
          <div class="mx-lg p-lg"><nz-spin /></div>
        } @else {
          <nz-card nzTitle="待辦事項" nzBordered="false" class="ant-card__body-nopadding">
            @if (notificationStore.todoNotifications().length === 0) {
              <div class="p-lg text-center">
                <nz-empty nzNotFoundContent="暫無待辦事項" />
              </div>
            } @else {
              @for (task of notificationStore.todoNotifications(); track task.id) {
                <div
                  nz-row
                  [nzJustify]="'center'"
                  [nzAlign]="'middle'"
                  class="py-sm pr-md point bg-grey-lighter-h"
                  (click)="handleTaskClick(task)"
                >
                  <div nz-col [nzSpan]="4" class="text-center">
                    @if (task.avatar) {
                      <nz-avatar [nzSrc]="task.avatar" />
                    } @else {
                      <nz-avatar nzIcon="user" />
                    }
                  </div>
                  <div nz-col [nzSpan]="20">
                    <strong>{{ task.title }}</strong>
                    @if (task.description) {
                      <p class="mb0">{{ task.description }}</p>
                    }
                    @if (task.extra) {
                      <p class="mb0 text-grey">{{ task.extra }}</p>
                    }
                  </div>
                </div>
              }
              <div nz-row>
                <div nz-col [nzSpan]="24" class="pt-md border-top-1 text-center text-grey point">查看全部</div>
              </div>
            }
          </nz-card>
        }
      </div>
    </nz-dropdown-menu>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NzDropDownModule, NzBadgeModule, NzIconModule, NzSpinModule, NzGridModule, NzAvatarModule, NzCardModule, NzEmptyModule]
})
export class HeaderTaskComponent implements OnInit {
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
      // Subscribe to realtime updates (shared with notify.component)
      this.unsubscribeRealtime = this.notificationStore.subscribeToRealtimeUpdates(user.uid, this.destroyRef);
      void this.notificationStore.loadNotifications(user.uid);
    });
  }

  ngOnInit(): void {
    // Initialization handled by effect in constructor
  }

  async loadData(): Promise<void> {
    const userId = this.currentUserId ?? this.firebase.currentUser()?.uid;
    if (userId) {
      await this.notificationStore.loadNotifications(userId);
    }
  }

  async handleTaskClick(task: any): Promise<void> {
    // Mark as read when clicked
    await this.notificationStore.markAsRead(task.id);

    // Navigate to task link if available
    if (task.link) {
      window.location.href = task.link;
    }
  }
}
