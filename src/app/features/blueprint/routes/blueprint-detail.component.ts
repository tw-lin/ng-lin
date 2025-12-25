import { DatePipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Blueprint, LoggerService } from '@core';
import { SHARED_IMPORTS, createAsyncState } from '@shared';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { firstValueFrom } from 'rxjs';

import { BlueprintFeatureService } from '../services/blueprint.service';
import { AcceptanceModuleViewComponent } from './modules/acceptance';
import { AgreementModuleViewComponent } from './modules/agreement';
import { AuditLogsComponent } from './modules/audit-logs';
import { CloudModuleViewComponent } from './modules/cloud';
import { ContractModuleViewComponent } from './modules/contract';
import { DiaryModuleViewComponent } from './modules/diary';
import { FinanceModuleViewComponent } from './modules/finance';
import { IssuesModuleViewComponent } from './modules/issues';
import { LogModuleViewComponent } from './modules/log';
import { MembersModuleViewComponent } from './modules/members';
import { QaModuleViewComponent } from './modules/quality';
import { TasksModuleViewComponent } from './modules/tasks';
import { WeatherModuleViewComponent } from './modules/weather';

/**
 * Blueprint Detail Component
 * 藍圖詳情元件 - 顯示單一藍圖的完整資訊
 *
 * Features:
 * - Display blueprint information
 * - Show enabled modules
 * - Navigate to module pages
 * - Integrated diary module (工地施工日誌)
 * - Integrated tasks (任務管理)
 * - Integrated audit logs (審計記錄) in overview sidebar
 * - Cloud module (雲端模組) for storage and backup
 *
 * ✅ Modernized with AsyncState pattern
 * ✅ Updated: 2025-12-11 - Added Construction Log & Task modules
 * ✅ Updated: 2025-12-12 - Simplified design, added audit logs to overview
 * ✅ Updated: 2025-12-13 - Added Cloud module tab
 * ✅ Updated: 2025-12-23 - Removed workflow, safety, warranty, manager modules and container monitoring
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-blueprint-detail',
  standalone: true,
  imports: [
    SHARED_IMPORTS,
    NzStatisticModule,
    NzResultModule,
    NzDescriptionsModule,
    NzEmptyModule,
    NzSpaceModule,
    NzTabsModule,
    NzTagModule,
    NzFormModule,
    DatePipe,
    AuditLogsComponent,
    MembersModuleViewComponent,
    DiaryModuleViewComponent,
    LogModuleViewComponent,
    QaModuleViewComponent,
    AcceptanceModuleViewComponent,
    FinanceModuleViewComponent,
    CloudModuleViewComponent,
    IssuesModuleViewComponent,
    AgreementModuleViewComponent,
    ContractModuleViewComponent,
    TasksModuleViewComponent,
    WeatherModuleViewComponent
  ],
  template: `
    <page-header [title]="blueprint()?.name || '藍圖詳情'" [action]="action" [breadcrumb]="breadcrumb">
      <ng-template #action>
        <nz-space>
          <button *nzSpaceItem nz-button (click)="refresh()">
            <span nz-icon nzType="reload"></span>
            同步
          </button>
          <button *nzSpaceItem nz-button (click)="edit()">
            <span nz-icon nzType="edit"></span>
            編輯
          </button>
          <button *nzSpaceItem nz-button nzDanger (click)="delete()">
            <span nz-icon nzType="delete"></span>
            刪除
          </button>
        </nz-space>
      </ng-template>

      <ng-template #breadcrumb>
        <nz-breadcrumb>
          <nz-breadcrumb-item>
            <a [routerLink]="['..']" [relativeTo]="route">藍圖列表</a>
          </nz-breadcrumb-item>
          <nz-breadcrumb-item>{{ blueprint()?.name || '詳情' }}</nz-breadcrumb-item>
        </nz-breadcrumb>
      </ng-template>
    </page-header>

    @if (loading()) {
      <nz-card [nzLoading]="true" style="min-height: 400px;"></nz-card>
    } @else if (blueprint()) {
      <!-- Blueprint Header Info -->
      <nz-card class="mb-md">
        <nz-descriptions [nzColumn]="3">
          <nz-descriptions-item nzTitle="負責人">
            <span nz-icon nzType="user"></span>
            {{ blueprint()!.ownerType === 'user' ? '個人' : blueprint()!.ownerType === 'organization' ? '組織' : '團隊' }}
          </nz-descriptions-item>
          <nz-descriptions-item nzTitle="狀態">
            <nz-badge [nzStatus]="getStatusBadge(blueprint()!.status)" [nzText]="getStatusText(blueprint()!.status)" />
          </nz-descriptions-item>
          <nz-descriptions-item nzTitle="建立時間">
            {{ blueprint()!.createdAt | date: 'yyyy-MM-dd HH:mm' }}
          </nz-descriptions-item>
        </nz-descriptions>
        @if (blueprint()!.description) {
          <p class="mt-sm text-grey">
            <span nz-icon nzType="file-text"></span>
            {{ blueprint()!.description }}
          </p>
        }
      </nz-card>

      <!-- Tab Navigation -->
      <nz-card [nzBordered]="false">
        <nz-tabset [(nzSelectedIndex)]="activeTabIndex" (nzSelectedIndexChange)="onTabChange($event)">
          <!-- Overview Tab -->
          <nz-tab nzTitle="概覽">
            <ng-template nz-tab>
              <div nz-row [nzGutter]="16">
                <div nz-col [nzXs]="24" [nzMd]="16">
                  <!-- Statistics -->
                  <nz-card nzTitle="專案統計" class="mb-md">
                    <nz-row [nzGutter]="16">
                      <nz-col [nzSpan]="8">
                        <nz-statistic [nzValue]="blueprint()!.enabledModules.length" nzTitle="啟用模組" [nzPrefix]="moduleIconTpl" />
                        <ng-template #moduleIconTpl>
                          <span nz-icon nzType="appstore"></span>
                        </ng-template>
                      </nz-col>
                      <nz-col [nzSpan]="8">
                        <nz-statistic [nzValue]="0" nzTitle="總任務" [nzPrefix]="taskIconTpl" />
                        <ng-template #taskIconTpl>
                          <span nz-icon nzType="check-square"></span>
                        </ng-template>
                      </nz-col>
                      <nz-col [nzSpan]="8">
                        <nz-statistic [nzValue]="0" nzTitle="日誌數" [nzPrefix]="logIconTpl" />
                        <ng-template #logIconTpl>
                          <span nz-icon nzType="file-text"></span>
                        </ng-template>
                      </nz-col>
                    </nz-row>
                  </nz-card>

                  <!-- Enabled Modules -->
                  <nz-card nzTitle="啟用模組">
                    @if (blueprint()!.enabledModules.length > 0) {
                      <nz-row [nzGutter]="[16, 16]">
                        @for (module of blueprint()!.enabledModules; track module) {
                          <nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
                            <nz-card [nzHoverable]="true" class="module-card" (click)="openModule(module)">
                              <div style="text-align: center;">
                                <span nz-icon [nzType]="getModuleIcon(module)" style="font-size: 32px;"></span>
                                <h4 style="margin-top: 12px;">{{ getModuleName(module) }}</h4>
                                <p class="text-grey" style="font-size: 12px;">{{ getModuleDescription(module) }}</p>
                              </div>
                            </nz-card>
                          </nz-col>
                        }
                      </nz-row>
                    } @else {
                      <nz-empty nzNotFoundContent="尚未啟用任何模組">
                        <ng-template nz-empty-footer>
                          <button nz-button nzType="primary" (click)="configureModules()">
                            <span nz-icon nzType="setting"></span>
                            配置模組
                          </button>
                        </ng-template>
                      </nz-empty>
                    }
                  </nz-card>
                </div>

                <div nz-col [nzXs]="24" [nzMd]="8">
                  <!-- Audit Logs (Simplified - Direct Display) -->
                  <nz-card nzTitle="審計記錄" class="mb-md">
                    @if (blueprint()?.id) {
                      <app-audit-logs [blueprintId]="blueprint()!.id" />
                    }
                  </nz-card>

                  <!-- Basic Info -->
                  <nz-card nzTitle="基本資訊">
                    <nz-descriptions [nzColumn]="1" [nzColon]="false">
                      <nz-descriptions-item nzTitle="藍圖 ID">
                        <nz-tag nzColor="blue">{{ blueprint()!.id }}</nz-tag>
                      </nz-descriptions-item>
                      <nz-descriptions-item nzTitle="Slug">
                        <nz-tag>{{ blueprint()!.slug }}</nz-tag>
                      </nz-descriptions-item>
                      <nz-descriptions-item nzTitle="名稱">
                        <strong>{{ blueprint()!.name }}</strong>
                      </nz-descriptions-item>
                      <nz-descriptions-item nzTitle="描述">
                        {{ blueprint()!.description || '無描述' }}
                      </nz-descriptions-item>
                      <nz-descriptions-item nzTitle="擁有者類型">
                        <nz-tag [nzColor]="getOwnerTypeColor(blueprint()!.ownerType)">
                          <span nz-icon [nzType]="getOwnerTypeIcon(blueprint()!.ownerType)"></span>
                          {{ getOwnerTypeName(blueprint()!.ownerType) }}
                        </nz-tag>
                      </nz-descriptions-item>
                      <nz-descriptions-item nzTitle="擁有者 ID">
                        <code>{{ blueprint()!.ownerId }}</code>
                      </nz-descriptions-item>
                      <nz-descriptions-item nzTitle="可見性">
                        @if (blueprint()!.isPublic) {
                          <nz-tag nzColor="green">
                            <span nz-icon nzType="eye"></span>
                            公開
                          </nz-tag>
                        } @else {
                          <nz-tag nzColor="default">
                            <span nz-icon nzType="eye-invisible"></span>
                            私人
                          </nz-tag>
                        }
                      </nz-descriptions-item>
                      <nz-descriptions-item nzTitle="啟用模組">
                        @if (blueprint()!.enabledModules && blueprint()!.enabledModules.length > 0) {
                          @for (module of blueprint()!.enabledModules; track module) {
                            <nz-tag class="mr-xs">{{ module }}</nz-tag>
                          }
                        } @else {
                          <span class="text-muted">無啟用模組</span>
                        }
                      </nz-descriptions-item>
                      <nz-descriptions-item nzTitle="建立時間">
                        {{ blueprint()!.createdAt | date: 'yyyy-MM-dd HH:mm:ss' }}
                      </nz-descriptions-item>
                      <nz-descriptions-item nzTitle="更新時間">
                        {{ blueprint()!.updatedAt | date: 'yyyy-MM-dd HH:mm:ss' }}
                      </nz-descriptions-item>
                    </nz-descriptions>
                  </nz-card>
                </div>
              </div>
            </ng-template>
          </nz-tab>

          <!-- Tasks Tab -->
          <nz-tab nzTitle="任務">
            <ng-template nz-tab>
              @if (blueprint()?.id) {
                <app-tasks-module-view [blueprintId]="blueprint()!.id" />
              }
            </ng-template>
          </nz-tab>

          <!-- Diary Tab -->
          <nz-tab nzTitle="施工日誌">
            <ng-template nz-tab>
              @if (blueprint()?.id) {
                <app-diary-module-view [blueprintId]="blueprint()!.id" />
              }
            </ng-template>
          </nz-tab>

          <!-- Members Tab -->
          <nz-tab nzTitle="成員">
            <ng-template nz-tab>
              @if (blueprint()?.id) {
                <app-members-module-view [blueprintId]="blueprint()!.id" [blueprintOwnerType]="blueprint()!.ownerType" />
              }
            </ng-template>
          </nz-tab>

          <!-- Log Domain Tab -->
          <nz-tab nzTitle="活動日誌">
            <ng-template nz-tab>
              @if (blueprint()?.id) {
                <app-log-module-view [blueprintId]="blueprint()!.id" />
              }
            </ng-template>
          </nz-tab>

          <!-- QA Domain Tab -->
          <nz-tab nzTitle="品質">
            <ng-template nz-tab>
              @if (blueprint()?.id) {
                <app-qa-module-view [blueprintId]="blueprint()!.id" />
              }
            </ng-template>
          </nz-tab>

          <!-- Acceptance Domain Tab -->
          <nz-tab nzTitle="驗收">
            <ng-template nz-tab>
              @if (blueprint()?.id) {
                <app-acceptance-module-view [blueprintId]="blueprint()!.id" />
              }
            </ng-template>
          </nz-tab>

          <!-- Finance Domain Tab -->
          <nz-tab nzTitle="財務">
            <ng-template nz-tab>
              @if (blueprint()?.id) {
                <app-finance-module-view [blueprintId]="blueprint()!.id" />
              }
            </ng-template>
          </nz-tab>

          <!-- Cloud Domain Tab -->
          <nz-tab nzTitle="雲端">
            <ng-template nz-tab>
              @if (blueprint()?.id) {
                <app-cloud-module-view [blueprintId]="blueprint()!.id" />
              }
            </ng-template>
          </nz-tab>

          <!-- Issues Domain Tab -->
          <nz-tab nzTitle="問題">
            <ng-template nz-tab>
              @if (blueprint()?.id) {
                <app-issues-module-view [blueprintId]="blueprint()!.id" />
              }
            </ng-template>
          </nz-tab>

          <!-- Agreement Domain Tab -->
          <nz-tab nzTitle="協議">
            <ng-template nz-tab>
              @if (blueprint()?.id) {
                <app-agreement-module-view [blueprintId]="blueprint()!.id" />
              }
            </ng-template>
          </nz-tab>

          <!-- Contract Domain Tab -->
          <nz-tab nzTitle="合約">
            <ng-template nz-tab>
              @if (blueprint()?.id) {
                <app-contract-module-view [blueprintId]="blueprint()!.id" />
              }
            </ng-template>
          </nz-tab>

          <!-- Weather Tab -->
          <nz-tab nzTitle="氣象">
            <ng-template nz-tab>
              @if (blueprint()?.id) {
                <app-weather-module-view />
              }
            </ng-template>
          </nz-tab>

          <!-- Settings Tab -->
          <nz-tab nzTitle="設定">
            <ng-template nz-tab>
              <!-- 基本資訊設定 -->
              <nz-card nzTitle="基本資訊" class="mb-md">
                <nz-descriptions [nzColumn]="2" nzBordered>
                  <nz-descriptions-item nzTitle="藍圖名稱">{{ blueprint()?.name }}</nz-descriptions-item>
                  <nz-descriptions-item nzTitle="藍圖代碼">{{ blueprint()?.slug || '-' }}</nz-descriptions-item>
                  <nz-descriptions-item nzTitle="狀態">
                    <nz-tag [nzColor]="getStatusColor(blueprint()?.status ?? '')">{{ getStatusText(blueprint()?.status ?? '') }}</nz-tag>
                  </nz-descriptions-item>
                  <nz-descriptions-item nzTitle="創建日期">{{ blueprint()?.createdAt | date: 'yyyy-MM-dd' }}</nz-descriptions-item>
                  <nz-descriptions-item nzTitle="描述" [nzSpan]="2">{{ blueprint()?.description || '無描述' }}</nz-descriptions-item>
                </nz-descriptions>
                <div style="margin-top: 16px;">
                  <button nz-button nzType="primary" (click)="edit()">
                    <span nz-icon nzType="edit"></span>
                    編輯基本資訊
                  </button>
                </div>
              </nz-card>

              <!-- 模組配置 -->
              <nz-card nzTitle="模組配置" class="mb-md">
                <p style="color: #666; margin-bottom: 16px;">啟用或停用各功能模組</p>
                <nz-row [nzGutter]="[16, 16]">
                  @for (module of moduleList; track module.key) {
                    <nz-col [nzSpan]="8">
                      <nz-card nzSize="small" [nzHoverable]="true">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                          <div>
                            <span nz-icon [nzType]="module.icon" style="margin-right: 8px;"></span>
                            <span>{{ module.name }}</span>
                          </div>
                          <nz-switch
                            [ngModel]="isModuleEnabled(module.key)"
                            (ngModelChange)="toggleModule(module.key, $event)"
                            nzSize="small"
                          ></nz-switch>
                        </div>
                      </nz-card>
                    </nz-col>
                  }
                </nz-row>
                <div style="margin-top: 16px;">
                  <button nz-button (click)="configureModules()">
                    <span nz-icon nzType="setting"></span>
                    進階模組設定
                  </button>
                </div>
              </nz-card>

              <!-- 通知設定 -->
              <nz-card nzTitle="通知設定" class="mb-md">
                <form nz-form nzLayout="vertical">
                  <nz-form-item>
                    <nz-form-label>電子郵件通知</nz-form-label>
                    <nz-form-control>
                      <nz-switch
                        [ngModel]="true"
                        (ngModelChange)="onNotificationChange('email', $event)"
                        [ngModelOptions]="{ standalone: true }"
                      ></nz-switch>
                      <span style="margin-left: 8px; color: #666;">接收藍圖相關的電子郵件通知</span>
                    </nz-form-control>
                  </nz-form-item>
                  <nz-form-item>
                    <nz-form-label>即將到期提醒</nz-form-label>
                    <nz-form-control>
                      <nz-switch
                        [ngModel]="true"
                        (ngModelChange)="onNotificationChange('deadline', $event)"
                        [ngModelOptions]="{ standalone: true }"
                      ></nz-switch>
                      <span style="margin-left: 8px; color: #666;">接收任務和保固到期提醒</span>
                    </nz-form-control>
                  </nz-form-item>
                </form>
              </nz-card>

              <!-- 危險操作區 -->
              <nz-card nzTitle="危險區域">
                <nz-alert nzType="warning" nzMessage="以下操作不可逆，請謹慎操作" nzShowIcon class="mb-md"> </nz-alert>
                <nz-space>
                  <button *nzSpaceItem nz-button nzDanger (click)="archiveBlueprint()">
                    <span nz-icon nzType="inbox"></span>
                    封存藍圖
                  </button>
                  <button *nzSpaceItem nz-button nzDanger nzType="primary" (click)="deleteBlueprint()">
                    <span nz-icon nzType="delete"></span>
                    刪除藍圖
                  </button>
                </nz-space>
              </nz-card>
            </ng-template>
          </nz-tab>
        </nz-tabset>
      </nz-card>
    } @else {
      <nz-card>
        <nz-result nzStatus="404" nzTitle="藍圖不存在" nzSubTitle="找不到指定的藍圖">
          <div nz-result-extra>
            <button nz-button nzType="primary" [routerLink]="['..']" [relativeTo]="route"> 返回列表 </button>
          </div>
        </nz-result>
      </nz-card>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .module-card {
        cursor: pointer;
        transition: all 0.3s;
      }

      .module-card:hover {
        transform: translateY(-4px);
      }

      .text-grey {
      }
    `
  ]
})
export class BlueprintDetailComponent implements OnInit {
  protected readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly message = inject(NzMessageService);
  private readonly logger = inject(LoggerService);
  private readonly blueprintService = inject(BlueprintFeatureService);

  // ✅ Modern Pattern: Use AsyncState
  readonly blueprintState = createAsyncState<Blueprint | null>(null);

  // Convenience accessor
  readonly blueprint = this.blueprintState.data;
  readonly loading = this.blueprintState.loading;

  // Tab state
  activeTabIndex = 0;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBlueprint(id);
    } else {
      this.message.error('缺少藍圖 ID');
      // Navigate back to list using relative path
      this.router.navigate(['..'], { relativeTo: this.route });
    }
  }

  /**
   * Load blueprint details
   * 載入藍圖詳情
   * ✅ Using AsyncState for automatic state management
   * ✅ Fixed: Use load() method to prevent flash of "Blueprint not found"
   */
  private async loadBlueprint(id: string): Promise<void> {
    try {
      // Use AsyncState.load() to automatically manage loading state
      await this.blueprintState.load(firstValueFrom(this.blueprintService.getById(id)));

      const data = this.blueprintState.data();
      if (data) {
        this.logger.info('[BlueprintDetailComponent]', `Loaded blueprint: ${data.name}`);
      } else {
        this.logger.warn('[BlueprintDetailComponent]', `Blueprint not found: ${id}`);
      }
    } catch (error) {
      this.message.error('載入藍圖失敗');
      this.logger.error('[BlueprintDetailComponent]', 'Failed to load blueprint', error as Error);
    }
  }

  /**
   * Get status badge type
   * 取得狀態徽章類型
   */
  getStatusBadge(status: string): 'success' | 'processing' | 'default' | 'error' | 'warning' {
    const statusMap = {
      draft: 'default' as const,
      active: 'success' as const,
      archived: 'default' as const
    };
    return statusMap[status as keyof typeof statusMap] || 'default';
  }

  /**
   * Get status text
   * 取得狀態文字
   */
  getStatusText(status: string): string {
    const textMap = {
      draft: '草稿',
      active: '啟用',
      archived: '封存'
    };
    return textMap[status as keyof typeof textMap] || status;
  }

  /**
   * Get module display name
   * 取得模組顯示名稱
   */
  getModuleName(module: string): string {
    const nameMap: Record<string, string> = {
      tasks: '任務管理',
      logs: '日誌記錄',
      quality: '品質驗收',
      diary: '施工日誌',
      dashboard: '儀表板',
      files: '文件管理',
      todos: '待辦事項',
      checklists: '檢查清單',
      issues: '問題追蹤',
      bot_workflow: '自動化流程',
      // New Blueprint Domains
      log: '日誌域',
      workflow: '流程域',
      qa: '品質控管域',
      acceptance: '驗收域',
      agreement: '協議',
      finance: '財務域',
      material: '材料域',
      safety: '安全域',
      communication: '通訊域',
      cloud: '雲端域'
    };
    return nameMap[module] || module;
  }

  /**
   * Get module description
   * 取得模組描述
   */
  getModuleDescription(module: string): string {
    const descMap: Record<string, string> = {
      tasks: '管理專案任務與進度',
      logs: '記錄施工日誌與記錄',
      quality: '品質檢驗與驗收',
      diary: '每日施工日誌',
      dashboard: '數據統計與視覺化',
      files: '文件與圖片管理',
      todos: '待辦事項管理',
      checklists: '檢查清單管理',
      issues: '問題與缺陷追蹤',
      bot_workflow: '自動化工作流程',
      // New Blueprint Domains
      log: '活動記錄、系統事件、評論、附件',
      workflow: '自訂流程、狀態機、自動化',
      qa: '檢查表、缺失管理、品質報告',
      acceptance: '驗收申請、審核、初驗、複驗',
      agreement: '協議管理、簽署、到期追蹤',
      finance: '成本、請款、付款、預算管理',
      material: '材料管理、出入庫、資產追蹤',
      safety: '安全巡檢、風險評估、事故通報',
      communication: '系統通知、訊息、提醒',
      cloud: '雲端儲存、檔案同步、備份管理'
    };
    return descMap[module] || '模組功能';
  }

  /**
   * Get module icon
   * 取得模組圖示
   */
  getModuleIcon(module: string): string {
    const iconMap: Record<string, string> = {
      tasks: 'check-square',
      logs: 'file-text',
      quality: 'safety-certificate',
      diary: 'book',
      dashboard: 'dashboard',
      files: 'folder',
      todos: 'ordered-list',
      checklists: 'check-circle',
      issues: 'warning',
      bot_workflow: 'robot',
      // New Blueprint Domains
      log: 'file-text',
      workflow: 'apartment',
      qa: 'safety-certificate',
      acceptance: 'check-circle',
      agreement: 'file-protect',
      finance: 'dollar',
      material: 'inbox',
      safety: 'safety',
      communication: 'message',
      cloud: 'cloud'
    };
    return iconMap[module] || 'appstore';
  }

  /**
   * Open module page
   * 開啟模組頁面
   * ✅ Fixed: Use relative navigation to respect workspace context
   */
  openModule(module: string): void {
    const blueprintId = this.blueprint()?.id;
    if (blueprintId) {
      // Navigate relative to current detail page
      this.router.navigate([module], { relativeTo: this.route });
    }
  }

  /**
   * Edit blueprint
   * 編輯藍圖
   */
  edit(): void {
    this.message.info('編輯功能待實作');
  }

  /**
   * Delete blueprint
   * 刪除藍圖
   */
  delete(): void {
    this.message.info('刪除功能待實作');
  }

  /**
   * Refresh blueprint data
   * 重新整理藍圖資料
   */
  refresh(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBlueprint(id);
    }
  }

  /**
   * Configure modules
   * 配置模組
   */
  configureModules(): void {
    this.message.info('模組配置功能待實作');
  }

  /**
   * Get owner type display name
   * 取得擁有者類型顯示名稱
   */
  getOwnerTypeName(type: string): string {
    const typeMap: Record<string, string> = {
      user: '個人',
      organization: '組織',
      team: '團隊'
    };
    return typeMap[type] || type;
  }

  /**
   * Get owner type icon
   * 取得擁有者類型圖示
   */
  getOwnerTypeIcon(type: string): string {
    const iconMap: Record<string, string> = {
      user: 'user',
      organization: 'team',
      team: 'usergroup-add'
    };
    return iconMap[type] || 'question-circle';
  }

  /**
   * Get owner type color
   * 取得擁有者類型顏色
   */
  getOwnerTypeColor(type: string): string {
    const colorMap: Record<string, string> = {
      user: 'blue',
      organization: 'green',
      team: 'orange'
    };
    return colorMap[type] || 'default';
  }

  /**
   * Handle tab change
   * 處理 Tab 切換
   */
  onTabChange(index: number): void {
    this.logger.debug('[BlueprintDetailComponent]', `Tab changed to index: ${index}`);
  }

  /**
   * Get status color for tag
   * 取得狀態標籤顏色
   */
  getStatusColor(status: string | undefined): string {
    if (!status) return 'default';
    const colorMap: Record<string, string> = {
      draft: 'default',
      active: 'success',
      archived: 'warning',
      completed: 'processing'
    };
    return colorMap[status] || 'default';
  }

  /**
   * Module list for settings
   * 設定頁面的模組列表
   */
  moduleList = [
    { key: 'tasks', name: '任務管理', icon: 'check-square' },
    { key: 'log', name: '日誌域', icon: 'file-text' },
    { key: 'workflow', name: '流程域', icon: 'apartment' },
    { key: 'qa', name: '品質控管', icon: 'safety-certificate' },
    { key: 'acceptance', name: '驗收域', icon: 'check-circle' },
    { key: 'agreement', name: '協議', icon: 'file-protect' },
    { key: 'finance', name: '財務域', icon: 'dollar' },
    { key: 'material', name: '材料域', icon: 'inbox' },
    { key: 'safety', name: '安全域', icon: 'safety' },
    { key: 'communication', name: '通訊域', icon: 'message' },
    { key: 'cloud', name: '雲端域', icon: 'cloud' },
    { key: 'warranty', name: '保固域', icon: 'safety-certificate' },
    { key: 'issues', name: '問題追蹤', icon: 'warning' }
  ];

  /**
   * Check if module is enabled
   * 檢查模組是否啟用
   */
  isModuleEnabled(moduleKey: string): boolean {
    const bp = this.blueprint();
    if (!bp?.enabledModules) return false;
    // Check if the string value exists in the enabled modules
    return bp.enabledModules.some(m => m === moduleKey);
  }

  /**
   * Toggle module enabled state
   * 切換模組啟用狀態
   */
  toggleModule(moduleKey: string, enabled: boolean): void {
    this.message.info(`${enabled ? '啟用' : '停用'}模組：${moduleKey}`);
    // TODO: Update blueprint enabled modules
  }

  /**
   * Handle notification setting change
   * 處理通知設定變更
   */
  onNotificationChange(type: string, enabled: boolean): void {
    this.message.info(`${enabled ? '啟用' : '停用'}${type === 'email' ? '電子郵件' : '到期提醒'}通知`);
    // TODO: Save notification settings
  }

  /**
   * Archive blueprint
   * 封存藍圖
   */
  archiveBlueprint(): void {
    this.message.info('封存功能待實作');
  }

  /**
   * Delete blueprint
   * 刪除藍圖
   */
  deleteBlueprint(): void {
    this.message.info('刪除功能待實作');
  }
}
