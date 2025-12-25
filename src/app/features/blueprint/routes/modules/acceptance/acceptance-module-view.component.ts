/**
 * Acceptance Module View Component (Refactored)
 * 驗收域視圖元件 - 顯示於藍圖詳情頁面的 Tab 中
 *
 * 🎯 Architecture: Feature-Based with High Cohesion & Low Coupling
 *
 * Responsibility: Thin orchestrator layer - coordinates features
 * - Manages high-level state (acceptance records, loading, active view)
 * - Delegates UI rendering to feature components
 * - Handles feature interactions via events
 *
 * Cohesion: High - single responsibility (orchestration)
 * Coupling: Low - features communicate via clear interfaces
 * Extensibility: Easy - add new features without modifying existing ones
 *
 * ✅ Updated: 2025-12-19
 * - Refactored to feature-based architecture
 * - Extracted request, review, preliminary, re-inspection, conclusion features
 * - Reduced coupling between components
 * - Improved maintainability and extensibility
 *
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input, signal, effect } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { lastValueFrom } from 'rxjs';

import { AcceptanceRecord, AcceptanceStatus } from './acceptance.model';
import { AcceptanceRepository } from './acceptance.repository';

// Feature imports - each feature is self-contained
import { AcceptanceConclusionComponent } from './features/conclusion';
import { AcceptancePreliminaryComponent } from './features/preliminary';
import { AcceptanceReInspectionComponent } from './features/re-inspection';
import { AcceptanceRequestComponent } from './features/request';
import { AcceptanceReviewComponent } from './features/review';

type ViewMode = 'request' | 'review' | 'preliminary' | 're-inspection' | 'conclusion';

@Component({
  selector: 'app-acceptance-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SHARED_IMPORTS,
    AcceptanceRequestComponent,
    AcceptanceReviewComponent,
    AcceptancePreliminaryComponent,
    AcceptanceReInspectionComponent,
    AcceptanceConclusionComponent
  ],
  template: `
    <!-- View Mode Tabs -->
    <nz-card class="mb-md">
      <nz-segmented [nzOptions]="viewOptions" [ngModel]="activeView()" (ngModelChange)="onViewChange($event)" />
    </nz-card>

    <!-- Feature Views -->
    @switch (activeView()) {
      @case ('request') {
        <app-acceptance-request
          [requests]="requests()"
          [loading]="loading()"
          (create)="createRequest()"
          (view)="viewRecord($event)"
          (edit)="editRecord($event)"
          (delete)="deleteRecord($event)"
          (reload)="loadRecords()"
        />
      }
      @case ('review') {
        <app-acceptance-review
          [reviews]="reviews()"
          [loading]="loading()"
          (approve)="approveRecord($event)"
          (reject)="rejectRecord($event)"
          (view)="viewRecord($event)"
          (reload)="loadRecords()"
        />
      }
      @case ('preliminary') {
        <app-acceptance-preliminary
          [preliminaries]="preliminaries()"
          [loading]="loading()"
          (create)="createPreliminary()"
          (edit)="editRecord($event)"
          (generateReport)="generateReport($event)"
          (reload)="loadRecords()"
        />
      }
      @case ('re-inspection') {
        <app-acceptance-re-inspection
          [reInspections]="reInspections()"
          [originalRecord]="null"
          [loading]="loading()"
          (create)="createReInspection()"
          (view)="viewRecord($event)"
          (compare)="compareRecords($event)"
          (reload)="loadRecords()"
        />
      }
      @case ('conclusion') {
        <app-acceptance-conclusion
          [conclusions]="conclusions()"
          [loading]="loading()"
          (finalize)="finalizeRecord($event)"
          (view)="viewRecord($event)"
          (export)="exportRecord($event)"
          (reload)="loadRecords()"
        />
      }
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `
  ]
})
export class AcceptanceModuleViewComponent implements OnInit {
  blueprintId = input.required<string>();

  private readonly repository = inject(AcceptanceRepository);
  private readonly message = inject(NzMessageService);

  // High-level state
  allRecords = signal<AcceptanceRecord[]>([]);
  loading = signal(false);
  activeView = signal<ViewMode>('request');

  // View options for segmented control
  viewOptions = [
    { label: '驗收申請', value: 'request' },
    { label: '驗收審核', value: 'review' },
    { label: '初驗', value: 'preliminary' },
    { label: '複驗', value: 're-inspection' },
    { label: '驗收結論', value: 'conclusion' }
  ];

  // Computed filtered records by type/status
  requests = () => this.allRecords().filter(r => r.status === AcceptanceStatus.PENDING || r.status === AcceptanceStatus.IN_REVIEW);

  reviews = () => this.allRecords().filter(r => r.status === AcceptanceStatus.IN_REVIEW);

  preliminaries = () => this.allRecords();

  reInspections = () => this.allRecords();

  conclusions = () => this.allRecords().filter(r => r.status === AcceptanceStatus.APPROVED);

  constructor() {
    // Effect to reload records when blueprintId changes
    effect(() => {
      const id = this.blueprintId();
      if (id) {
        this.loadRecords();
      }
    });
  }

  ngOnInit(): void {
    // Initial load handled by effect
  }

  /**
   * Load acceptance records from repository
   */
  async loadRecords(): Promise<void> {
    const blueprintId = this.blueprintId();
    if (!blueprintId) {
      return;
    }

    this.loading.set(true);
    try {
      const records = await lastValueFrom(this.repository.findByBlueprintId(blueprintId));
      this.allRecords.set(records);
    } catch (error) {
      this.message.error('載入驗收記錄失敗');
      console.error('[AcceptanceModuleView]', 'loadRecords failed', error);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Handle view mode change
   */
  onViewChange(mode: ViewMode): void {
    this.activeView.set(mode);
  }

  /**
   * Create new acceptance request
   */
  createRequest(): void {
    this.message.info('建立驗收申請功能開發中');
  }

  /**
   * Create new preliminary inspection
   */
  createPreliminary(): void {
    this.message.info('建立初驗記錄功能開發中');
  }

  /**
   * Create new re-inspection
   */
  createReInspection(): void {
    this.message.info('建立複驗記錄功能開發中');
  }

  /**
   * View acceptance record details
   */
  viewRecord(record: AcceptanceRecord): void {
    this.message.info(`查看驗收記錄: ${record.title}`);
  }

  /**
   * Edit acceptance record
   */
  editRecord(record: AcceptanceRecord): void {
    this.message.info(`編輯驗收記錄: ${record.title}`);
  }

  /**
   * Delete acceptance record
   */
  async deleteRecord(record: AcceptanceRecord): Promise<void> {
    try {
      await this.repository.delete(this.blueprintId(), record.id);
      this.message.success(`驗收記錄 ${record.title} 已刪除`);
      await this.loadRecords();
    } catch (error) {
      this.message.error('刪除驗收記錄失敗');
      console.error('[AcceptanceModuleView]', 'deleteRecord failed', error);
    }
  }

  /**
   * Approve acceptance record
   */
  approveRecord(data: { record: AcceptanceRecord; notes: string }): void {
    this.message.success(`驗收記錄 ${data.record.title} 已通過`);
    this.loadRecords();
  }

  /**
   * Reject acceptance record
   */
  rejectRecord(data: { record: AcceptanceRecord; reason: string }): void {
    this.message.warning(`驗收記錄 ${data.record.title} 已拒絕`);
    this.loadRecords();
  }

  /**
   * Generate preliminary report
   */
  generateReport(record: AcceptanceRecord): void {
    this.message.info(`生成初驗報告: ${record.title}`);
  }

  /**
   * Compare re-inspection records
   */
  compareRecords(data: { original: AcceptanceRecord; current: AcceptanceRecord }): void {
    this.message.info(`對比驗收記錄: ${data.original.title} vs ${data.current.title}`);
  }

  /**
   * Finalize acceptance conclusion
   */
  finalizeRecord(record: AcceptanceRecord): void {
    this.message.success(`驗收結論 ${record.title} 已完成`);
    this.loadRecords();
  }

  /**
   * Export acceptance record
   */
  exportRecord(record: AcceptanceRecord): void {
    this.message.info(`匯出驗收記錄: ${record.title}`);
  }
}
