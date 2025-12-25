/**
 * Issues Module View Component (Refactored)
 * 問題域視圖元件 (重構版)
 *
 * Purpose: Main orchestrator for issues module with feature-based architecture
 * Features: Delegates to specialized feature components
 *
 * Architecture: Feature-Based (High Cohesion, Low Coupling)
 * - Statistics Feature: Display issue counts by status
 * - Issue List Feature: Table display with actions
 * - Issue Form Feature: Create/edit modal
 * - Issue Details Feature: View details modal
 *
 * ✅ Angular 20 Modern Patterns:
 * - Signals for reactive state
 * - Standalone component
 * - inject() for DI
 * - Feature-based composition
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input, signal, computed, effect } from '@angular/core';
import { ModalHelper } from '@delon/theme';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';

// Feature Components
import { IssueDetailsComponent } from './features/issue-details';
import { IssueFormComponent } from './features/issue-form';
import { IssueListComponent } from './features/issue-list';
import { IssueStatisticsComponent } from './features/issue-statistics';
import { IssueManagementService } from './issue-management.service';
import type { Issue, IssueStatistics } from './issues.model';
import { escapeHtml, formatStatusText, formatSeverityText, formatSourceText } from './shared';

@Component({
  selector: 'app-issues-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, IssueStatisticsComponent, IssueListComponent],
  template: `
    <!-- Statistics Card -->
    <app-issue-statistics [stats]="statistics()" />

    <!-- Action Toolbar -->
    <nz-card class="mb-md">
      <nz-row [nzGutter]="16" nzAlign="middle">
        <nz-col [nzFlex]="'auto'">
          <button nz-button nzType="primary" (click)="createIssue()" class="mr-sm">
            <span nz-icon nzType="plus"></span>
            新增問題
          </button>
          <button nz-button (click)="loadIssues()">
            <span nz-icon nzType="reload"></span>
            重新載入
          </button>
        </nz-col>
        <nz-col [nzFlex]="'none'">
          <nz-input-group [nzPrefix]="searchPrefix" style="width: 240px;">
            <input nz-input placeholder="搜尋問題..." />
          </nz-input-group>
          <ng-template #searchPrefix>
            <span nz-icon nzType="search"></span>
          </ng-template>
        </nz-col>
      </nz-row>
    </nz-card>

    <!-- Issues List -->
    <nz-card nzTitle="問題列表">
      <app-issue-list
        [issues]="issues()"
        [loading]="loading()"
        (issueView)="viewIssue($event)"
        (issueEdit)="editIssue($event)"
        (issueDelete)="deleteIssue($event)"
        (emptyStateCreate)="createIssue()"
      />
    </nz-card>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `
  ]
})
export class IssuesModuleViewComponent implements OnInit {
  private readonly managementService = inject(IssueManagementService);
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);
  private readonly modalHelper = inject(ModalHelper);

  /**
   * Input signal
   */
  blueprintId = input.required<string>();

  /**
   * State signals
   */
  issues = signal<Issue[]>([]);
  loading = signal(false);

  /**
   * Computed statistics from issues
   */
  statistics = computed<IssueStatistics>(() => {
    const issueList = this.issues();
    return {
      total: issueList.length,
      open: issueList.filter(i => i.status === 'open').length,
      inProgress: issueList.filter(i => i.status === 'in_progress').length,
      resolved: issueList.filter(i => i.status === 'resolved').length,
      verified: issueList.filter(i => i.status === 'verified').length,
      closed: issueList.filter(i => i.status === 'closed').length,
      bySeverity: {
        critical: issueList.filter(i => i.severity === 'critical').length,
        major: issueList.filter(i => i.severity === 'major').length,
        minor: issueList.filter(i => i.severity === 'minor').length
      },
      bySource: {
        manual: issueList.filter(i => i.source === 'manual').length,
        acceptance: issueList.filter(i => i.source === 'acceptance').length,
        qc: issueList.filter(i => i.source === 'qc').length,
        warranty: issueList.filter(i => i.source === 'warranty').length,
        safety: issueList.filter(i => i.source === 'safety').length
      }
    };
  });

  constructor() {
    // Effect to reload issues when blueprintId changes
    effect(() => {
      const id = this.blueprintId();
      if (id) {
        this.loadIssues();
      }
    });
  }

  ngOnInit(): void {
    // Initial load is handled by the effect above when blueprintId is set
  }

  /**
   * Load issues from the service
   */
  async loadIssues(): Promise<void> {
    const blueprintId = this.blueprintId();
    if (!blueprintId) return;

    this.loading.set(true);
    try {
      const issueList = await this.managementService.listIssues(blueprintId);
      this.issues.set(issueList);
    } catch (error) {
      this.message.error('載入問題列表失敗');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Create a new issue - open modal form
   */
  createIssue(): void {
    this.modalHelper
      .createStatic(IssueFormComponent, { blueprintId: this.blueprintId() }, { size: 'md', modalOptions: { nzTitle: '新增問題' } })
      .subscribe(result => {
        if (result) {
          this.loadIssues();
        }
      });
  }

  /**
   * View issue details in modal
   */
  viewIssue(issue: Issue): void {
    this.modal.create({
      nzTitle: `問題詳情: ${escapeHtml(issue.issueNumber)}`,
      nzContent: IssueDetailsComponent,
      nzData: { issue },
      nzWidth: 800,
      nzFooter: [
        {
          label: '關閉',
          type: 'default',
          onClick: () => this.modal.closeAll()
        }
      ]
    });
  }

  /**
   * Edit issue - open modal form with existing data
   */
  editIssue(issue: Issue): void {
    this.modalHelper
      .createStatic(
        IssueFormComponent,
        { blueprintId: this.blueprintId(), issue },
        { size: 'md', modalOptions: { nzTitle: `編輯問題: ${issue.issueNumber}` } }
      )
      .subscribe(result => {
        if (result) {
          this.loadIssues();
        }
      });
  }

  /**
   * Delete issue
   */
  async deleteIssue(issue: Issue): Promise<void> {
    try {
      await this.managementService.deleteIssue(issue.id);
      this.message.success(`問題 ${issue.issueNumber} 已刪除`);
      await this.loadIssues();
    } catch (error) {
      this.message.error('刪除問題失敗');
    }
  }
}
