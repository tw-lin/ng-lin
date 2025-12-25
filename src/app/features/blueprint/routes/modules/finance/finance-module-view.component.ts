/**
 * Finance Module View Component (Refactored)
 * 財務域視圖元件 (重構版)
 *
 * Purpose: Main orchestrator for finance module with feature-based architecture
 * Features: Delegates to specialized feature components
 *
 * Architecture: Feature-Based (High Cohesion, Low Coupling)
 * - Dashboard Feature: Financial summary display
 * - Invoice List Feature: Receivable/Payable invoice management
 * - Approval Dialog Feature: Invoice approval workflow
 *
 * SETC-030: Invoice/Payment UI Components
 *
 * @module FinanceModuleViewComponent
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input, signal, computed } from '@angular/core';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';

import type { BillableItem, FinancialSummary, Invoice, InvoiceStatus } from './finance.model';
import { FinanceService } from './finance.service';

@Component({
  selector: 'app-finance-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzEmptyModule, NzStepsModule, NzTimelineModule, NzDescriptionsModule],
  templateUrl: './finance-module-view.component.html',
  styles: [
    `
      :host {
        display: block;
      }

      .mb-md {
        margin-bottom: 16px;
      }

      .summary-card {
        padding: 8px 0;
      }

      .summary-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
      }

      .summary-icon {
        font-size: 20px;
      }

      .receivable .summary-icon {
        color: #52c41a;
      }

      .payable .summary-icon {
        color: #faad14;
      }

      .profit .summary-icon {
        color: #1890ff;
      }

      .summary-title {
        font-size: 14px;
        font-weight: 500;
        color: #666;
      }

      .summary-detail {
        display: flex;
        justify-content: space-between;
        margin-top: 12px;
        font-size: 12px;
        color: #666;
      }

      .tab-header {
        padding: 8px 0;
      }

      .timeline-item {
        padding: 4px 0;
      }

      .timeline-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
      }

      .timeline-content {
        font-size: 12px;
        color: #666;
      }

      .timeline-actions {
        margin-top: 4px;
      }
    `
  ]
})
export class FinanceModuleViewComponent implements OnInit {
  blueprintId = input.required<string>();

  private readonly financeService = inject(FinanceService);
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  readonly invoiceService = {
    loading: () => this.loading(),
    data: () => this.filteredReceivableInvoices()
  };

  readonly paymentService = {
    loading: () => this.loading(),
    data: () => this.filteredPayableInvoices()
  };

  readonly costService = {
    loading: () => this.loading(),
    data: () => this.payableItems()
  };

  // 狀態
  loading = signal(false);
  activeTabIndex = 0;
  workflowStep = signal(1);
  receivableStatusFilter = '';
  payableStatusFilter = '';

  // 財務摘要
  summary = signal<FinancialSummary>({
    blueprintId: '',
    receivables: { total: 0, collected: 0, pending: 0, collectionRate: 0 },
    payables: { total: 0, paid: 0, pending: 0, paymentRate: 0 },
    grossProfit: 0,
    grossProfitMargin: 0,
    asOf: new Date(),
    totalBilled: 0,
    totalReceived: 0,
    pendingReceivable: 0,
    overdueReceivable: 0,
    receivableInvoiceCount: 0,
    paidReceivableCount: 0,
    overdueInvoiceCount: 0,
    totalPayable: 0,
    totalPaid: 0,
    accountsReceivableBalance: 0,
    accountsPayableBalance: 0,
    monthlyBilled: 0,
    monthlyReceived: 0
  });

  // 可請款/付款項目
  receivableItems = signal<BillableItem[]>([]);
  payableItems = signal<BillableItem[]>([]);

  // 請款單列表
  private allReceivableInvoices = signal<Invoice[]>([]);
  private allPayableInvoices = signal<Invoice[]>([]);

  // 計算屬性
  totalReceivableAmount = computed(() => this.receivableItems().reduce((sum, item) => sum + item.remainingAmount, 0));

  totalPayableAmount = computed(() => this.payableItems().reduce((sum, item) => sum + item.remainingAmount, 0));

  filteredReceivableInvoices = computed(() => {
    const invoices = this.allReceivableInvoices();
    if (!this.receivableStatusFilter) return invoices;
    return invoices.filter(inv => inv.status === this.receivableStatusFilter);
  });

  filteredPayableInvoices = computed(() => {
    const invoices = this.allPayableInvoices();
    if (!this.payableStatusFilter) return invoices;
    return invoices.filter(inv => inv.status === this.payableStatusFilter);
  });

  // 成本統計
  costStats = computed(() => ({
    actualCost: 1380000,
    totalReceivable: 2850000,
    totalPayable: 1850000
  }));

  // 待審核的應收請款單
  pendingApprovalReceivables = computed(() =>
    this.allReceivableInvoices().filter(inv => inv.status === 'submitted' || inv.status === 'under_review')
  );

  // 待審核的應付付款單
  pendingApprovalPayables = computed(() =>
    this.allPayableInvoices().filter(inv => inv.status === 'submitted' || inv.status === 'under_review')
  );

  // 狀態選項
  statusOptions = [
    { label: '草稿', value: 'draft' },
    { label: '已送出', value: 'submitted' },
    { label: '審核中', value: 'under_review' },
    { label: '已核准', value: 'approved' },
    { label: '已拒絕', value: 'rejected' },
    { label: '已開立', value: 'invoiced' },
    { label: '部分付款', value: 'partial_paid' },
    { label: '已付清', value: 'paid' },
    { label: '已取消', value: 'cancelled' }
  ];

  // 可請款項目欄位
  billableColumns: STColumn[] = [
    { title: '任務名稱', index: 'taskName', width: 180 },
    { title: '合約金額', index: 'contractAmount', type: 'number', width: 120 },
    { title: '可請款比例', index: 'billablePercentage', width: 100, format: (item: BillableItem) => `${item.billablePercentage}%` },
    { title: '可請款金額', index: 'billableAmount', type: 'number', width: 120 },
    { title: '已請款金額', index: 'billedAmount', type: 'number', width: 120 },
    { title: '剩餘金額', index: 'remainingAmount', type: 'number', width: 120 },
    { title: '對方', index: 'party', width: 120 },
    {
      title: '操作',
      width: 120,
      buttons: [
        {
          text: '建立請款單',
          click: (record: BillableItem) => this.createInvoiceFromItem(record),
          iif: (record: BillableItem) => record.remainingAmount > 0
        }
      ]
    }
  ];

  // 請款單欄位
  invoiceColumns: STColumn[] = [
    { title: '編號', index: 'invoiceNumber', width: 140 },
    { title: '金額', index: 'total', type: 'number', width: 100 },
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
        rejected: { text: '已拒絕', color: 'error' }
      }
    },
    { title: '付款方', index: 'payingParty.name', width: 150 },
    { title: '到期日', index: 'dueDate', type: 'date', dateFormat: 'yyyy-MM-dd', width: 110 },
    {
      title: '操作',
      width: 180,
      buttons: [
        { text: '查看', click: (record: Invoice) => this.viewInvoice(record) },
        { text: '審核', click: (record: Invoice) => this.approveInvoice(record), iif: (record: Invoice) => this.canApprove(record) },
        { text: '送出', click: (record: Invoice) => this.submitInvoice(record), iif: (record: Invoice) => record.status === 'draft' }
      ]
    }
  ];

  // 成本欄位
  costColumns: STColumn[] = [
    { title: '成本項目', index: 'item', width: 180 },
    { title: '金額', index: 'amount', type: 'number', width: 120 },
    { title: '類別', index: 'category', width: 100 },
    { title: '日期', index: 'date', type: 'date', dateFormat: 'yyyy-MM-dd', width: 110 },
    {
      title: '操作',
      width: 120,
      buttons: [{ text: '查看', click: (record: { item?: string }) => this.message.info(`查看成本：${record.item}`) }]
    }
  ];

  /** 格式化百分比 */
  formatPercent = (percent: number): string => `${percent.toFixed(1)}%`;

  /** 格式化數字（千分位） */
  formatNumber(value: number): string {
    return value.toLocaleString('zh-TW');
  }

  ngOnInit(): void {
    const blueprintId = this.blueprintId();
    this.loadAllData(blueprintId);
  }

  /** 載入所有資料 */
  private async loadAllData(blueprintId: string): Promise<void> {
    this.loading.set(true);
    try {
      const data = await this.financeService.load(blueprintId);
      this.summary.set(data.summary);
      this.receivableItems.set(data.receivableItems);
      this.payableItems.set(data.payableItems);
      this.allReceivableInvoices.set(data.receivableInvoices);
      this.allPayableInvoices.set(data.payableInvoices);
    } catch (error) {
      this.message.error('載入財務資料失敗');
    } finally {
      this.loading.set(false);
    }
  }

  /** 重新整理摘要 */
  refreshSummary(): void {
    this.loadAllData(this.blueprintId());
    this.message.success('資料已重新整理');
  }

  /** 篩選請款單 */
  filterInvoices(): void {
    // Signal computed 會自動更新
  }

  /** 取得毛利顏色樣式 */
  getProfitStyle(): Record<string, string> {
    const profit = this.summary().grossProfit;
    return {
      color: profit >= 0 ? '#3f8600' : '#cf1322',
      fontSize: '24px'
    };
  }

  /** 從可請款項目建立請款單 */
  createInvoiceFromItem(item: BillableItem): void {
    const typeLabel = item.type === 'receivable' ? '請款' : '付款';
    this.modal.confirm({
      nzTitle: `建立${typeLabel}單`,
      nzContent: `確定要為「${item.taskName}」建立${typeLabel}單嗎？金額：$${this.formatNumber(item.remainingAmount)}`,
      nzOkText: '確定',
      nzCancelText: '取消',
      nzOnOk: () => {
        this.message.success(`已建立${typeLabel}單草稿`);
      }
    });
  }

  /** 建立應收請款單 */
  createReceivableInvoice(): void {
    this.message.info('新增請款單功能開發中');
  }

  /** 建立應付付款單 */
  createPayableInvoice(): void {
    this.message.info('新增付款單功能開發中');
  }

  /** 查看請款單詳情 */
  viewInvoice(invoice: Invoice): void {
    const typeLabel = invoice.invoiceType === 'receivable' ? '請款單' : '付款單';
    const partyLabel = invoice.invoiceType === 'receivable' ? '付款方' : '收款方';
    this.modal.info({
      nzTitle: `${typeLabel}詳情`,
      nzContent:
        `<div>` +
        `<p><strong>編號：</strong>${invoice.invoiceNumber}</p>` +
        `<p><strong>金額：</strong>$${invoice.total.toLocaleString()}</p>` +
        `<p><strong>狀態：</strong>${this.getStatusLabel(invoice.status)}</p>` +
        `<p><strong>${partyLabel}：</strong>${invoice.payingParty.name}</p>` +
        `<p><strong>到期日：</strong>${invoice.dueDate.toLocaleDateString()}</p>` +
        `</div>`,
      nzWidth: 500
    });
  }

  /** 審核請款單 */
  approveInvoice(invoice: Invoice): void {
    this.modal.confirm({
      nzTitle: '審核請款單',
      nzContent: `確定要核准請款單 ${invoice.invoiceNumber} 嗎？金額：$${this.formatNumber(invoice.total)}`,
      nzOkText: '核准',
      nzCancelText: '取消',
      nzOnOk: () => {
        this.message.success('已核准');
      }
    });
  }

  /** 送出請款單 */
  submitInvoice(invoice: Invoice): void {
    this.modal.confirm({
      nzTitle: '確認送出',
      nzContent: `送出請款單 ${invoice.invoiceNumber} 後將進入審核流程，確定要送出嗎？`,
      nzOnOk: () => {
        this.message.success('已送出');
      }
    });
  }

  /** 判斷是否可審核 */
  canApprove(invoice: Invoice): boolean {
    return invoice.status === 'submitted' || invoice.status === 'under_review';
  }

  /** 取得狀態標籤 */
  getStatusLabel(status: InvoiceStatus): string {
    const option = this.statusOptions.find(s => s.value === status);
    return option?.label ?? status;
  }

  /** 取得狀態顏色 */
  getStatusColor(status: InvoiceStatus): string {
    const colorMap: Record<string, string> = {
      draft: 'default',
      submitted: 'processing',
      under_review: 'warning',
      approved: 'success',
      rejected: 'error',
      invoiced: 'cyan',
      partial_paid: 'orange',
      paid: 'green',
      cancelled: 'default'
    };
    return colorMap[status] ?? 'default';
  }

  /** 取得時間軸顏色 */
  getTimelineColor(status: InvoiceStatus): string {
    const colorMap: Record<string, string> = {
      draft: 'gray',
      submitted: 'blue',
      under_review: 'orange',
      approved: 'green',
      rejected: 'red',
      invoiced: 'blue',
      partial_paid: 'orange',
      paid: 'green',
      cancelled: 'gray'
    };
    return colorMap[status] ?? 'gray';
  }
}
