import { Injectable } from '@angular/core';

import type { ActivityLog, AttachmentLog, ChangeHistoryEntry, CommentLog, SystemEvent } from './log.model';

@Injectable({ providedIn: 'root' })
export class LogRepository {
  async fetchActivityLogs(blueprintId: string): Promise<ActivityLog[]> {
    const now = new Date();
    return [
      {
        id: 'act-1',
        blueprintId,
        timestamp: now,
        action: '建立任務',
        userId: 'user-1',
        resourceType: 'task'
      },
      {
        id: 'act-2',
        blueprintId,
        timestamp: new Date(now.getTime() - 1000 * 60 * 30),
        action: '更新日誌',
        userId: 'user-2',
        resourceType: 'diary'
      }
    ];
  }

  async fetchSystemEvents(blueprintId: string): Promise<SystemEvent[]> {
    const now = new Date();
    return [
      {
        id: 'evt-1',
        blueprintId,
        timestamp: now,
        eventType: 'deploy',
        severity: 'info'
      },
      {
        id: 'evt-2',
        blueprintId,
        timestamp: new Date(now.getTime() - 1000 * 60 * 10),
        eventType: 'backup',
        severity: 'warning'
      }
    ];
  }

  async fetchComments(blueprintId: string): Promise<CommentLog[]> {
    const now = new Date();
    return [
      {
        id: 'cmt-1',
        blueprintId,
        createdAt: now,
        author: 'Alex',
        content: '請確認最新部署是否成功'
      },
      {
        id: 'cmt-2',
        blueprintId,
        createdAt: new Date(now.getTime() - 1000 * 60 * 5),
        author: 'Jamie',
        content: '資料備份完成'
      }
    ];
  }

  async fetchAttachments(blueprintId: string): Promise<AttachmentLog[]> {
    const now = new Date();
    return [
      {
        id: 'att-1',
        blueprintId,
        fileName: 'audit-report.pdf',
        fileType: 'pdf',
        fileSize: '1.2MB',
        uploadedAt: now
      },
      {
        id: 'att-2',
        blueprintId,
        fileName: 'deployment-log.txt',
        fileType: 'txt',
        fileSize: '240KB',
        uploadedAt: new Date(now.getTime() - 1000 * 60 * 15)
      }
    ];
  }

  async fetchChangeHistory(blueprintId: string): Promise<ChangeHistoryEntry[]> {
    const now = new Date();
    return [
      {
        id: 'chg-1',
        blueprintId,
        timestamp: now,
        changeType: 'update',
        field: 'status',
        userId: 'user-1'
      },
      {
        id: 'chg-2',
        blueprintId,
        timestamp: new Date(now.getTime() - 1000 * 60 * 45),
        changeType: 'create',
        field: 'task',
        userId: 'user-3'
      }
    ];
  }
}
