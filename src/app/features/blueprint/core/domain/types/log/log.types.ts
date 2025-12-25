export interface Log {
  id: string;
  blueprintId: string;
  title: string;
  content?: string;
  createdAt: Date | string;
  createdBy: string;
}

export interface CreateLogRequest {
  blueprintId: string;
  title: string;
  content?: string;
}

export interface UpdateLogRequest {
  title?: string;
  content?: string;
}
