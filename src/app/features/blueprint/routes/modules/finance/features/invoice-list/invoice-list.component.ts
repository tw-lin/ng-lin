/**
 * Invoice List Component - 請款/付款單列表
 *
 * SETC-030: Invoice/Payment UI Components
 *
 * 使用 ng-alain ST 表格顯示請款單或付款單列表
 * 支援狀態篩選、搜尋、操作按鈕
 *
 * @module InvoiceListComponent
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed, input, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { STColumn, STChange } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';

import type { Invoice, InvoiceStatus } from '../../core/models';

/**
 * 請款/付款單列表元件
 */
@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-card [nzTitle]="cardTitle" [nzExtra]="cardExtra">
      <ng-template #cardTitle>
        <span style="font-size: 18px; font-weight: 500;">
          {{ pageTitle() }}
        </span>
        <span style="color: #999; font-size: 14px; margin-left: 12px;"> 管理請款與付款單據 </span>
      </ng-template>
      <ng-template #cardExtra>
        <button nz-button nzType="primary" (click)="create()">
          <span nz-icon nzType="plus"></span>
          {{ invoiceType() === 'receivable' ? '新增請款單' : '新增付款單' }}
        </button>
      </ng-template>

      <!-- 篩選區域 -->
      <div class="filter-bar" style="margin-bottom: 16px; display: flex; gap: 16px; flex-wrap: wrap;">
        <nz-select [(ngModel)]="statusFilter" (ngModelChange)="reload()" style="width: 160px;" nzPlaceHolder="篩選狀態" nzAllowClear>
          @for (status of statusOptions; track status.value) {
            <nz-option [nzValue]="status.value" [nzLabel]="status.label"></nz-option>
          }
        </nz-select>

        <nz-date-picker [(ngModel)]="startDate" (ngModelChange)="reload()" nzPlaceHolder="開始日期"> </nz-date-picker>

        <nz-date-picker [(ngModel)]="endDate" (ngModelChange)="reload()" nzPlaceHolder="結束日期"> </nz-date-picker>

        <nz-input-group nzSearch [nzAddOnAfter]="searchBtn" style="width: 240px;">
          <input type="text" nz-input [(ngModel)]="searchKeyword" placeholder="搜尋編號或名稱" (keyup.enter)="reload()" />
        </nz-input-group>
        <ng-template #searchBtn>
          <button nz-button nzType="primary" nzSearch (click)="reload()">
            <span nz-icon nzType="search"></span>
          </button>
        </ng-template>
      </div>

      <!-- 表格 -->
      <st
        [data]="filteredInvoices()"
        [columns]="columns"
        [loading]="loading()"
        [page]="{ show: true, front: true }"
        (change)="handleChange($event)"
      >
      </st>
    </nz-card>
  `
})
export class InvoiceListComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly modal = inject(NzModalService);
  private readonly message = inject(NzMessageService);
  private readonly destroyRef = inject(DestroyRef);

  /** 請款類型: receivable (應收) 或 payable (應付) */
  invoiceType = input<'receivable' | 'payable'>('receivable');

  /** 藍圖 ID */
  blueprintId = signal<string>('');

  /** 原始請款單列表 */
  private invoices = signal<Invoice[]>([]);

  /** 載入狀態 */
  loading = signal(false);

  /** 篩選條件 */
  statusFilter = '';
  startDate: Date | null = null;
  endDate: Date | null = null;
  searchKeyword = '';

  /** 頁面標題 */
  pageTitle = computed(() => (this.invoiceType() === 'receivable' ? '請款單管理' : '付款單管理'));

  /** 篩選後的請款單 */
  filteredInvoices = computed(() => {
    let result = this.invoices().filter(inv => inv.invoiceType === this.invoiceType());

    // 狀態篩選
    if (this.statusFilter) {
      result = result.filter(inv => inv.status === this.statusFilter);
    }

    // 日期範圍篩選
    if (this.startDate && this.endDate) {
      result = result.filter(inv => {
        const date = inv.createdAt instanceof Date ? inv.createdAt : new Date(inv.createdAt);
        return date >= this.startDate! && date <= this.endDate!;
      });
    }

    // 關鍵字搜尋
    if (this.searchKeyword) {
      const keyword = this.searchKeyword.toLowerCase();
      result = result.filter(
        inv =>
          inv.invoiceNumber.toLowerCase().includes(keyword) ||
          inv.billingParty.name.toLowerCase().includes(keyword) ||
          inv.payingParty.name.toLowerCase().includes(keyword)
      );
    }

    return result;
  });

  /** 狀態選項 */
  statusOptions = [
    { value: 'draft', label: '草稿' },
    { value: 'submitted', label: '已送出' },
    { value: 'under_review', label: '審核中' },
    { value: 'approved', label: '已核准' },
    { value: 'rejected', label: '已退回' },
    { value: 'invoiced', label: '已開票' },
    { value: 'partial_paid', label: '部分付款' },
    { value: 'paid', label: '已付款' },
    { value: 'cancelled', label: '已取消' }
  ];

  /** 表格欄位定義 */
  columns: STColumn[] = [
    { title: '編號', index: 'invoiceNumber', width: 150 },
    {
      title: '對象',
      index: 'payingParty.name',
      width: 150
    },
    {
      title: '金額',
      index: 'total',
      type: 'number',
      width: 120,
      className: 'text-right'
    },
    {
      title: '狀態',
      index: 'status',
      width: 100,
      type: 'badge',
      badge: {
        draft: { text: '草稿', color: 'default' },
        submitted: { text: '已送出', color: 'processing' },
        under_review: { text: '審核中', color: 'warning' },
        approved: { text: '已核准', color: 'success' },
        rejected: { text: '已退回', color: 'error' },
        invoiced: { text: '已開票', color: 'processing' },
        partial_paid: { text: '部分付款', color: 'warning' },
        paid: { text: '已付款', color: 'success' },
        cancelled: { text: '已取消', color: 'default' }
      }
    },
    {
      title: '到期日',
      index: 'dueDate',
      type: 'date',
      dateFormat: 'yyyy-MM-dd',
      width: 110
    },
    {
      title: '建立日期',
      index: 'createdAt',
      type: 'date',
      dateFormat: 'yyyy-MM-dd',
      width: 110
    },
    {
      title: '操作',
      width: 180,
      buttons: [
        {
          text: '查看',
          click: (record: Invoice) => this.view(record)
        },
        {
          text: '審核',
          click: (record: Invoice) => this.approve(record),
          iif: (record: Invoice) => this.canApprove(record)
        },
        {
          text: '送出',
          click: (record: Invoice) => this.submit(record),
          iif: (record: Invoice) => record.status === 'draft'
        }
      ]
    }
  ];

  ngOnInit(): void {
    // 從路由取得 blueprintId
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.blueprintId.set(id);
        this.loadData();
      }
    });
  }

  /** 載入資料 */
  loadData(): void {
    this.loading.set(true);

    // MVP: 使用模擬資料
    // 正式環境應從 InvoiceService 載入
    setTimeout(() => {
      this.invoices.set(this.getMockData());
      this.loading.set(false);
    }, 500);
  }

  /** 重新載入（篩選變更時觸發） */
  reload(): void {
    // 觸發 computed signal 重新計算
    // 不需要重新載入資料，只需更新篩選結果
  }

  /** 表格變更事件 */
  handleChange(event: STChange): void {
    // 處理分頁、排序等變更
    console.log('ST change:', event);
  }

  /** 新增請款單 */
  create(): void {
    this.message.info('新增功能開發中');
  }

  /** 查看詳情 */
  view(record: Invoice): void {
    this.modal.info({
      nzTitle: `${this.invoiceType() === 'receivable' ? '請款單' : '付款單'}詳情`,
      nzContent: `
        <div>
          <p><strong>編號：</strong>${record.invoiceNumber}</p>
          <p><strong>金額：</strong>$${record.total.toLocaleString()}</p>
          <p><strong>狀態：</strong>${this.getStatusLabel(record.status)}</p>
          <p><strong>${this.invoiceType() === 'receivable' ? '業主' : '承商'}：</strong>${record.payingParty.name}</p>
        </div>
      `,
      nzWidth: 600
    });
  }

  /** 審核 */
  approve(record: Invoice): void {
    this.modal.confirm({
      nzTitle: '審核請款單',
      nzContent: `確定要核准請款單 ${record.invoiceNumber} 嗎？`,
      nzOkText: '核准',
      nzCancelText: '取消',
      nzOnOk: () => {
        this.message.success('已核准');
        // TODO: 呼叫 InvoiceApprovalService.approve()
      }
    });
  }

  /** 送出審核 */
  submit(record: Invoice): void {
    this.modal.confirm({
      nzTitle: '確認送出',
      nzContent: '送出後將進入審核流程，確定要送出嗎？',
      nzOnOk: () => {
        this.message.success('已送出');
        // TODO: 呼叫 InvoiceApprovalService.submit()
      }
    });
  }

  /** 判斷是否可審核 */
  canApprove(record: Invoice): boolean {
    return record.status === 'submitted' || record.status === 'under_review';
  }

  /** 取得狀態顯示文字 */
  private getStatusLabel(status: InvoiceStatus): string {
    const option = this.statusOptions.find(s => s.value === status);
    return option?.label ?? status;
  }

  /** 取得模擬資料 */
  private getMockData(): Invoice[] {
    const now = new Date();
    const dueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return [
      this.createMockInvoice('INV-20251216-001', 'receivable', 'approved', 150000, now, dueDate),
      this.createMockInvoice('INV-20251215-002', 'receivable', 'submitted', 85000, now, dueDate),
      this.createMockInvoice('INV-20251214-003', 'receivable', 'draft', 42000, now, dueDate),
      this.createMockInvoice('PAY-20251216-001', 'payable', 'approved', 120000, now, dueDate),
      this.createMockInvoice('PAY-20251215-002', 'payable', 'paid', 65000, now, dueDate)
    ];
  }

  private createMockInvoice(
    invoiceNumber: string,
    invoiceType: 'receivable' | 'payable',
    status: InvoiceStatus,
    total: number,
    createdAt: Date,
    dueDate: Date
  ): Invoice {
    return {
      id: `mock-${invoiceNumber}`,
      blueprintId: this.blueprintId(),
      invoiceNumber,
      invoiceType,
      contractId: 'contract-001',
      taskIds: ['task-001'],
      invoiceItems: [],
      subtotal: Math.round(total / 1.05),
      tax: total - Math.round(total / 1.05),
      taxRate: 0.05,
      total,
      billingPercentage: 100,
      billingParty: {
        id: 'org-001',
        name: invoiceType === 'receivable' ? '承攬廠商 A' : '業主公司',
        taxId: '12345678',
        address: '台北市信義區',
        contactName: '王經理',
        contactPhone: '02-12345678',
        contactEmail: 'contact@example.com'
      },
      payingParty: {
        id: 'org-002',
        name: invoiceType === 'receivable' ? '業主公司' : '承攬廠商 A',
        taxId: '87654321',
        address: '台北市中山區',
        contactName: '李會計',
        contactPhone: '02-87654321',
        contactEmail: 'accounting@example.com'
      },
      status,
      approvalWorkflow: {
        currentStep: status === 'approved' ? 2 : 1,
        totalSteps: 2,
        approvers: [],
        history: []
      },
      dueDate,
      attachments: [],
      createdBy: 'user-001',
      createdAt,
      updatedAt: createdAt
    };
  }
}
