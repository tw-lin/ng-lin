export interface ActivityLog {
  id: string;
  blueprintId: string;
  timestamp: Date;
  action: string;
  userId: string;
  resourceType: string;
}

export interface SystemEvent {
  id: string;
  blueprintId: string;
  timestamp: Date;
  eventType: string;
  severity: 'info' | 'warning' | 'error';
}

export interface CommentLog {
  id: string;
  blueprintId: string;
  createdAt: Date;
  author: string;
  content: string;
}

export interface AttachmentLog {
  id: string;
  blueprintId: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  uploadedAt: Date;
}

export interface ChangeHistoryEntry {
  id: string;
  blueprintId: string;
  timestamp: Date;
  changeType: string;
  field: string;
  userId: string;
}
