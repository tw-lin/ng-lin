import { Injectable, inject, signal } from '@angular/core';

import type { ActivityLog, AttachmentLog, ChangeHistoryEntry, CommentLog, SystemEvent } from './log.model';
import { LogRepository } from './log.repository';

@Injectable({ providedIn: 'root' })
export class LogService {
  private readonly repository = inject(LogRepository);

  readonly activityLogs = signal<ActivityLog[]>([]);
  readonly systemEvents = signal<SystemEvent[]>([]);
  readonly comments = signal<CommentLog[]>([]);
  readonly attachments = signal<AttachmentLog[]>([]);
  readonly changeHistory = signal<ChangeHistoryEntry[]>([]);

  readonly loading = signal(false);
  readonly error = signal<Error | null>(null);

  async loadAll(blueprintId: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const [activity, events, comments, attachments, history] = await Promise.all([
        this.repository.fetchActivityLogs(blueprintId),
        this.repository.fetchSystemEvents(blueprintId),
        this.repository.fetchComments(blueprintId),
        this.repository.fetchAttachments(blueprintId),
        this.repository.fetchChangeHistory(blueprintId)
      ]);

      this.activityLogs.set(activity);
      this.systemEvents.set(events);
      this.comments.set(comments);
      this.attachments.set(attachments);
      this.changeHistory.set(history);
    } catch (err) {
      this.error.set(err as Error);
    } finally {
      this.loading.set(false);
    }
  }

  clear(): void {
    this.activityLogs.set([]);
    this.systemEvents.set([]);
    this.comments.set([]);
    this.attachments.set([]);
    this.changeHistory.set([]);
    this.error.set(null);
  }
}
