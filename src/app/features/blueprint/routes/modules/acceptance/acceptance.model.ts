export enum AcceptanceStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface AcceptanceRecord {
  id: string;
  blueprintId: string;
  title: string;
  description?: string;
  status: AcceptanceStatus;
  reviewerId?: string;
  reviewerName?: string;
  reviewDate?: Date;
  notes?: string;
  attachments?: string[];
  metadata?: Record<string, unknown>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAcceptanceData {
  blueprintId: string;
  title: string;
  description?: string;
  reviewerId?: string;
  createdBy: string;
}

export interface UpdateAcceptanceData {
  title?: string;
  description?: string;
  status?: AcceptanceStatus;
  reviewerId?: string;
  reviewerName?: string;
  reviewDate?: Date;
  notes?: string;
  attachments?: string[];
  metadata?: Record<string, unknown>;
}

export interface AcceptanceQueryOptions {
  status?: AcceptanceStatus;
  reviewerId?: string;
  limit?: number;
}
