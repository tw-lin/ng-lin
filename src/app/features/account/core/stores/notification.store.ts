import { DestroyRef, Injectable, signal } from '@angular/core';

import { NotificationPayload } from '../models';

@Injectable({
  providedIn: 'root'
})
export class NotificationStore {
  private readonly _notifications = signal<NotificationPayload[]>([]);
  private readonly _loading = signal(false);

  loading(): boolean {
    return this._loading();
  }

  unreadCount(): number {
    return this._notifications().filter(n => !n.read).length;
  }

  unreadTodoCount(): number {
    return this.unreadCount();
  }

  todoNotifications(): NotificationPayload[] {
    return this._notifications();
  }

  groupedNotifications(): Array<{ title: string; list: NotificationPayload[]; emptyText: string }> {
    return [
      {
        title: '通知',
        list: this._notifications(),
        emptyText: '暫無通知'
      }
    ];
  }

  async loadNotifications(_userId: string): Promise<void> {
    this._loading.set(true);
    try {
      // Placeholder: in real implementation fetch from backend
      this._notifications.set(this._notifications());
    } finally {
      this._loading.set(false);
    }
  }

  async clearByType(_userId: string, type: string): Promise<void> {
    this._notifications.update(list => list.filter(item => item.type !== type));
  }

  async markAsRead(id: string): Promise<void> {
    this._notifications.update(list => list.map(item => (item.id === id ? { ...item, read: true } : item)));
  }

  subscribeToRealtimeUpdates(_userId: string, _destroyRef?: DestroyRef): () => void {
    return () => {
      // no-op
    };
  }
}
