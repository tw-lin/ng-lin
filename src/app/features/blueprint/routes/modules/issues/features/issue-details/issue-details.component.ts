/**
 * Issue Details Component
 * 問題詳情元件
 *
 * Purpose: Display issue details in a modal
 * Features: Read-only view of issue information
 *
 * Architecture: Feature Component (High Cohesion)
 * - Accepts issue data via input signal
 * - Formats and displays issue information
 * - Uses shared formatters for consistent display
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzTagModule } from 'ng-zorro-antd/tag';

import type { Issue } from '../../issues.model';
import { formatStatusText, formatSeverityText, formatSourceText, getStatusConfig, getSeverityConfig, getSourceConfig } from '../../shared';

@Component({
  selector: 'app-issue-details',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzDescriptionsModule, NzTagModule],
  template: `
    @if (issue(); as issueData) {
      <nz-descriptions nzTitle="問題詳情" [nzColumn]="1" nzBordered>
        <nz-descriptions-item nzTitle="編號">{{ issueData.issueNumber }}</nz-descriptions-item>
        <nz-descriptions-item nzTitle="標題">{{ issueData.title }}</nz-descriptions-item>
        <nz-descriptions-item nzTitle="描述">
          <div class="whitespace-pre-wrap">{{ issueData.description }}</div>
        </nz-descriptions-item>
        <nz-descriptions-item nzTitle="位置">{{ issueData.location }}</nz-descriptions-item>
        <nz-descriptions-item nzTitle="狀態">
          <nz-tag [nzColor]="getStatusColor(issueData.status)">
            <span nz-icon [nzType]="getStatusIcon(issueData.status)" class="mr-xs"></span>
            {{ getStatusText(issueData.status) }}
          </nz-tag>
        </nz-descriptions-item>
        <nz-descriptions-item nzTitle="嚴重度">
          <nz-tag [nzColor]="getSeverityColor(issueData.severity)">
            {{ getSeverityText(issueData.severity) }}
          </nz-tag>
        </nz-descriptions-item>
        <nz-descriptions-item nzTitle="來源">
          <nz-tag [nzColor]="getSourceColor(issueData.source)">
            {{ getSourceText(issueData.source) }}
          </nz-tag>
        </nz-descriptions-item>
        <nz-descriptions-item nzTitle="分類">{{ issueData.category }}</nz-descriptions-item>
        <nz-descriptions-item nzTitle="負責方">{{ issueData.responsibleParty }}</nz-descriptions-item>
        @if (issueData.assignedTo) {
          <nz-descriptions-item nzTitle="指派給">{{ issueData.assignedTo }}</nz-descriptions-item>
        }
        <nz-descriptions-item nzTitle="建立時間">
          {{ issueData.createdAt | date: 'yyyy-MM-dd HH:mm' }}
        </nz-descriptions-item>
        <nz-descriptions-item nzTitle="更新時間">
          {{ issueData.updatedAt | date: 'yyyy-MM-dd HH:mm' }}
        </nz-descriptions-item>
      </nz-descriptions>
    } @else {
      <nz-empty nzNotFoundContent="無問題資料" />
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .whitespace-pre-wrap {
        white-space: pre-wrap;
        word-break: break-word;
      }
    `
  ]
})
export class IssueDetailsComponent {
  /**
   * Issue data input
   */
  issue = input<Issue | null>(null);

  /**
   * Get status text using shared formatter
   */
  getStatusText = formatStatusText;

  /**
   * Get severity text using shared formatter
   */
  getSeverityText = formatSeverityText;

  /**
   * Get source text using shared formatter
   */
  getSourceText = formatSourceText;

  /**
   * Get status color from config
   */
  getStatusColor(status: Issue['status']): string {
    return getStatusConfig(status).color;
  }

  /**
   * Get status icon from config
   */
  getStatusIcon(status: Issue['status']): string {
    return getStatusConfig(status).icon;
  }

  /**
   * Get severity color from config
   */
  getSeverityColor(severity: Issue['severity']): string {
    return getSeverityConfig(severity).color;
  }

  /**
   * Get source color from config
   */
  getSourceColor(source: Issue['source']): string {
    return getSourceConfig(source).color;
  }
}
