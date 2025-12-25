/**
 * QA Module View Component
 * 品質控管模組檢視元件 - 主要協調器
 *
 * Architecture:
 * - Main orchestrator for QA module
 * - Delegates to feature components
 * - Maintains clear separation of concerns
 *
 * Feature-Based Architecture:
 * ✅ High Cohesion (高內聚性): All QA functionality in one module
 * ✅ Low Coupling (低耦合性): Clear interfaces via barrel exports
 * ✅ Extensibility (可擴展性): Easy to add features (e.g., defect management, reports)
 *
 * Design Principle: 問題透過問題模組處理，因此設計不用過度
 *
 * Future Extension Points:
 * - QA defect management feature
 * - QA report generation feature
 * - QA checklist templates
 * - QA performance analytics
 *
 * @module QaModuleViewComponent
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzAlertModule } from 'ng-zorro-antd/alert';

import { QaInspectionsComponent } from './features/qa-inspections';
import { QaStandardsComponent } from './features/qa-standards';
import { QaStatsComponent } from './features/qa-stats';

@Component({
  selector: 'app-qa-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzAlertModule, QaStatsComponent, QaInspectionsComponent, QaStandardsComponent],
  template: `
    <!-- Statistics Dashboard -->
    <app-qa-stats [blueprintId]="blueprintId()" />

    <!-- Main Content -->
    <nz-card>
      <nz-alert
        nzType="info"
        nzMessage="品質控管模組簡化版"
        nzDescription="NCR (不符合報告) 功能已遷移至「問題」模組，提供更完整的問題追蹤與管理功能。"
        nzShowIcon
        class="mb-md"
      >
      </nz-alert>

      <nz-tabset>
        <!-- Inspections Tab -->
        <nz-tab nzTitle="品質檢驗">
          <ng-template nz-tab>
            <app-qa-inspections [blueprintId]="blueprintId()" />
          </ng-template>
        </nz-tab>

        <!-- Standards Tab -->
        <nz-tab nzTitle="品質標準">
          <ng-template nz-tab>
            <app-qa-standards [blueprintId]="blueprintId()" />
          </ng-template>
        </nz-tab>
      </nz-tabset>

      <nz-divider></nz-divider>

      <!-- Navigation to Issues Module -->
      <div style="text-align: center; padding: 16px;">
        <p style="color: #666; margin-bottom: 12px;">
          <span nz-icon nzType="arrow-right"></span>
          NCR 相關功能請使用「問題」模組
        </p>
        <p style="color: #999; font-size: 12px;"> 未來品質管理進階功能將在此模組重新設計 </p>
      </div>
    </nz-card>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .mb-md {
        margin-bottom: 16px;
      }
    `
  ]
})
export class QaModuleViewComponent {
  // Input: blueprint context
  blueprintId = input.required<string>();
}
