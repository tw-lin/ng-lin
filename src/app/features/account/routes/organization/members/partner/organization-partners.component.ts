import { ChangeDetectionStrategy, Component, computed, inject, OnInit, effect } from '@angular/core';
import { Router } from '@angular/router';
import { ContextType, Partner, PartnerStore, PartnerType } from '@core';
import { SHARED_IMPORTS, WorkspaceContextService } from '@shared';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { CreatePartnerModalComponent } from './create-partner-modal.component';
import { EditPartnerModalComponent } from './edit-partner-modal.component';

/**
 * Organization Partners Component
 * 組織夥伴管理元件
 *
 * Displays and manages external partners for the organization.
 * Follows modern Angular 20 patterns with Signals and new control flow.
 *
 * @module routes/organization/partners
 */
@Component({
  selector: 'app-organization-partners',
  standalone: true,
  imports: [SHARED_IMPORTS, NzAlertModule, NzEmptyModule, NzTableModule, NzTagModule, NzSpaceModule, NzCardModule, NzPageHeaderModule],
  template: `
    <div class="page-container">
      <nz-page-header nzTitle="夥伴管理" nzSubtitle="瀏覽並管理組織的外部夥伴">
        <nz-page-header-extra>
          <nz-space>
            <button *nzSpaceItem nz-button nzType="primary" (click)="openCreatePartnerModal()" [disabled]="!isOrganizationContext()">
              <span nz-icon nzType="plus"></span>
              新增夥伴
            </button>
            <button *nzSpaceItem nz-button nzType="default" (click)="refreshPartners()" [disabled]="!isOrganizationContext()">
              <span nz-icon nzType="reload"></span>
              重新整理
            </button>
          </nz-space>
        </nz-page-header-extra>
      </nz-page-header>

      <nz-card class="mt-md">
        @if (!isOrganizationContext()) {
          <nz-alert
            nzType="info"
            nzShowIcon
            nzMessage="請先選擇組織"
            nzDescription="請從側邊欄選擇一個組織以查看夥伴列表。"
            class="mb-md"
          />
        }

        @if (isOrganizationContext() && loading()) {
          <div class="text-center py-lg">
            <span nz-icon nzType="loading" nzSpin class="text-2xl"></span>
            <p class="mt-md text-gray-500">載入中...</p>
          </div>
        }

        @if (isOrganizationContext() && !loading() && partners().length > 0) {
          <nz-table #table [nzData]="partners()" [nzShowPagination]="false" nzSize="middle">
            <thead>
              <tr>
                <th nzWidth="220px">夥伴名稱</th>
                <th nzWidth="120px">類型</th>
                <th nzWidth="160px">公司名稱</th>
                <th>聯絡資訊</th>
                <th nzWidth="140px">建立時間</th>
                <th nzWidth="280px">操作</th>
              </tr>
            </thead>
            <tbody>
              @for (partner of table.data; track partner.id) {
                <tr>
                  <td>
                    <strong>{{ partner.name }}</strong>
                    <nz-tag class="ml-sm" nzColor="blue">
                      <span nz-icon nzType="user"></span>
                      {{ getMemberCount(partner.id) }} 名成員
                    </nz-tag>
                  </td>
                  <td>
                    <nz-tag [nzColor]="getPartnerTypeColor(partner.type)">
                      {{ getPartnerTypeLabel(partner.type) }}
                    </nz-tag>
                  </td>
                  <td>{{ partner.company_name || '-' }}</td>
                  <td>
                    @if (partner.contact_email) {
                      <div>
                        <span nz-icon nzType="mail"></span>
                        {{ partner.contact_email }}
                      </div>
                    }
                    @if (partner.contact_phone) {
                      <div>
                        <span nz-icon nzType="phone"></span>
                        {{ partner.contact_phone }}
                      </div>
                    }
                    @if (!partner.contact_email && !partner.contact_phone) {
                      <span class="text-gray-500">無聯絡資訊</span>
                    }
                  </td>
                  <td>{{ formatDate(partner.created_at) }}</td>
                  <td>
                    <nz-space>
                      <button *nzSpaceItem nz-button nzType="link" nzSize="small" (click)="manageMembers(partner)">
                        <span nz-icon nzType="user"></span>
                        管理成員
                      </button>
                      <button *nzSpaceItem nz-button nzType="link" nzSize="small" (click)="openEditPartnerModal(partner)">
                        <span nz-icon nzType="edit"></span>
                        編輯
                      </button>
                      <button
                        *nzSpaceItem
                        nz-button
                        nzType="link"
                        nzSize="small"
                        nzDanger
                        nz-popconfirm
                        nzPopconfirmTitle="確定刪除此夥伴？此操作無法復原。"
                        (nzOnConfirm)="deletePartner(partner)"
                      >
                        <span nz-icon nzType="delete"></span>
                        刪除
                      </button>
                    </nz-space>
                  </td>
                </tr>
              }
            </tbody>
          </nz-table>
        }

        @if (isOrganizationContext() && !loading() && partners().length === 0) {
          <nz-empty nzNotFoundContent="暫無夥伴，請點擊上方按鈕新增夥伴"></nz-empty>
        }
      </nz-card>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .page-container {
        padding: 24px;
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      .mt-md {
        margin-top: 16px;
      }
      .mb-md {
        margin-bottom: 16px;
      }
      .ml-sm {
        margin-left: 8px;
      }
      .py-lg {
        padding: 48px 0;
      }
      .text-center {
        text-align: center;
      }
      .text-2xl {
        font-size: 24px;
      }
      .text-gray-500 {
        color: #8c8c8c;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrganizationPartnersComponent implements OnInit {
  readonly workspaceContext = inject(WorkspaceContextService);
  readonly partnerStore = inject(PartnerStore);
  private readonly modal = inject(NzModalService);
  private readonly message = inject(NzMessageService);
  private readonly router = inject(Router);

  constructor() {
    // Auto-reload partners when organization context changes
    effect(() => {
      const orgId = this.currentOrgId();
      if (orgId) {
        this.partnerStore.loadPartners(orgId);
      }
    });
  }

  ngOnInit(): void {
    // Load partners when component initializes
    const orgId = this.currentOrgId();
    if (orgId) {
      this.partnerStore.loadPartners(orgId);
    }
  }

  getMemberCount(partnerId: string): number {
    return this.partnerStore.getMemberCount(partnerId);
  }

  refreshPartners(): void {
    const orgId = this.currentOrgId();
    if (orgId) {
      this.message.info('正在重新整理...');
      this.partnerStore.loadPartners(orgId);
    }
  }

  readonly currentOrgId = computed(() =>
    this.workspaceContext.contextType() === ContextType.ORGANIZATION ? this.workspaceContext.contextId() : null
  );

  readonly partners = computed<Partner[]>(() => {
    const orgId = this.currentOrgId();
    if (!orgId) {
      return [];
    }
    return this.partnerStore.partners();
  });

  readonly loading = this.partnerStore.loading;

  isOrganizationContext(): boolean {
    return this.workspaceContext.contextType() === ContextType.ORGANIZATION;
  }

  getPartnerTypeLabel(type?: PartnerType): string {
    const labels: Record<PartnerType, string> = {
      [PartnerType.CONTRACTOR]: '承包商',
      [PartnerType.SUPPLIER]: '供應商',
      [PartnerType.CONSULTANT]: '顧問',
      [PartnerType.SUBCONTRACTOR]: '次承包商',
      [PartnerType.CLIENT]: '客戶',
      [PartnerType.OTHER]: '其他'
    };
    return type ? labels[type] || type : '未分類';
  }

  getPartnerTypeColor(type?: PartnerType): string {
    const colors: Record<PartnerType, string> = {
      [PartnerType.CONTRACTOR]: 'blue',
      [PartnerType.SUPPLIER]: 'green',
      [PartnerType.CONSULTANT]: 'purple',
      [PartnerType.SUBCONTRACTOR]: 'orange',
      [PartnerType.CLIENT]: 'cyan',
      [PartnerType.OTHER]: 'default'
    };
    return type ? colors[type] || 'default' : 'default';
  }

  formatDate(dateStr: string | Date | undefined): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  openCreatePartnerModal(): void {
    const orgId = this.currentOrgId();
    if (!orgId) {
      this.message.error('無法獲取組織 ID');
      return;
    }

    const modalRef = this.modal.create({
      nzTitle: '新增夥伴',
      nzContent: CreatePartnerModalComponent,
      nzData: {
        organizationId: orgId
      },
      nzFooter: null,
      nzWidth: 600
    });

    modalRef.afterClose.subscribe((result: Partner | undefined) => {
      if (result) {
        this.message.success('夥伴新增成功');
        this.workspaceContext.reloadData();
      }
    });
  }

  openEditPartnerModal(partner: Partner): void {
    const modalRef = this.modal.create({
      nzTitle: '編輯夥伴',
      nzContent: EditPartnerModalComponent,
      nzData: {
        partner: partner
      },
      nzFooter: null,
      nzWidth: 600
    });

    modalRef.afterClose.subscribe((result: Partner | undefined) => {
      if (result) {
        this.message.success('夥伴更新成功');
        this.workspaceContext.reloadData();
      }
    });
  }

  manageMembers(partner: Partner): void {
    // Navigate to partner members management page
    this.router.navigate(['/partner', partner.id, 'members']);
  }

  async deletePartner(partner: Partner): Promise<void> {
    try {
      await this.partnerStore.deletePartner(partner.id);
      this.message.success('夥伴已刪除');
      this.workspaceContext.reloadData();
    } catch (error) {
      console.error('Failed to delete partner:', error);
      this.message.error('刪除夥伴失敗');
    }
  }
}
