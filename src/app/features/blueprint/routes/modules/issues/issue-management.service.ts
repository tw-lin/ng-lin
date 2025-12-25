import { Injectable, inject } from '@angular/core';

import { CreateIssueData, Issue, UpdateIssueData } from './issues.model';
import { IssuesRepository } from './issues.repository';

@Injectable({ providedIn: 'root' })
export class IssueManagementService {
  private readonly repository = inject(IssuesRepository);
  async listIssues(blueprintId: string): Promise<Issue[]> {
    return this.repository.listIssues(blueprintId);
  }

  async createIssue(payload: CreateIssueData): Promise<Issue> {
    try {
      return await this.repository.createIssue(payload);
    } catch (error) {
      throw error;
    }
  }

  async updateIssue(id: string, payload: UpdateIssueData): Promise<Issue> {
    try {
      return await this.repository.updateIssue(id, payload);
    } catch (error) {
      throw error;
    }
  }

  async deleteIssue(id: string): Promise<void> {
    try {
      await this.repository.deleteIssue(id);
    } catch (error) {
      throw error;
    }
  }
}
