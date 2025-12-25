import { Timestamp } from '@angular/fire/firestore';

export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'verified' | 'closed';
export type IssueSeverity = 'critical' | 'major' | 'minor';
export type IssueSource = 'manual' | 'acceptance' | 'qc' | 'warranty' | 'safety';
export type IssueCategory = 'quality' | 'safety' | 'warranty' | 'other';

export interface IssueStatistics {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  verified: number;
  closed: number;
  bySeverity: Record<IssueSeverity, number>;
  bySource: Record<IssueSource, number>;
}

export interface Issue {
  id: string;
  blueprintId: string;
  issueNumber: string;
  title: string;
  description: string;
  location: string;
  severity: IssueSeverity;
  category: IssueCategory;
  responsibleParty: string;
  assignedTo?: string;
  status: IssueStatus;
  source: IssueSource;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IssueDocument = Omit<Issue, 'id' | 'createdAt' | 'updatedAt'> & {
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
};

export interface CreateIssueData {
  blueprintId: string;
  title: string;
  description: string;
  location: string;
  severity: IssueSeverity;
  category: IssueCategory;
  responsibleParty: string;
  assignedTo?: string;
  createdBy: string;
  source?: IssueSource;
}

export type UpdateIssueData = Partial<Omit<Issue, 'id' | 'blueprintId' | 'issueNumber' | 'createdBy' | 'createdAt'>> & {
  status?: IssueStatus;
};
