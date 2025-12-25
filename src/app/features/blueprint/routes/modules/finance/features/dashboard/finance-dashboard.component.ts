/**
 * Finance Dashboard Component - 財務概覽儀表板
 *
 * SETC-030: Invoice/Payment UI Components
 *
 * 顯示藍圖財務摘要
 *
 * @module FinanceDashboardComponent
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { SHARED_IMPORTS } from '@shared';

import type { FinancialSummary } from '../../finance.model';

/**
 * 財務概覽儀表板元件
 */
@Component({
  selector: 'app-finance-dashboard',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './finance-dashboard.component.html'
})
export class FinanceDashboardComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** 藍圖 ID */
  blueprintId = signal<string>('');

  /** 載入狀態 */
  loading = signal(false);

  /** 財務摘要 */
  summary = signal<FinancialSummary>({
    blueprintId: '',
    receivables: { total: 0, collected: 0, pending: 0, collectionRate: 0 },
    payables: { total: 0, paid: 0, pending: 0, paymentRate: 0 },
    grossProfit: 0,
    grossProfitMargin: 0,
    asOf: new Date(),
    // 擴展欄位
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

  /** 格式化百分比 */
  formatPercent = (percent: number): string => `${percent.toFixed(1)}%`;

  /** 格式化數字（千分位） */
  formatNumber(value: number): string {
    return value.toLocaleString('zh-TW');
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.blueprintId.set(id);
        this.loadSummary();
      }
    });
  }

  /** 載入財務摘要 */
  loadSummary(): void {
    this.loading.set(true);

    // MVP: 使用模擬資料
    setTimeout(() => {
      this.summary.set({
        blueprintId: this.blueprintId(),
        receivables: {
          total: 2850000,
          collected: 1920000,
          pending: 930000,
          collectionRate: 67.4
        },
        payables: {
          total: 1850000,
          paid: 1450000,
          pending: 400000,
          paymentRate: 78.4
        },
        grossProfit: 470000,
        grossProfitMargin: 24.5,
        asOf: new Date(),
        // 擴展欄位
        totalBilled: 2850000,
        totalReceived: 1920000,
        pendingReceivable: 930000,
        overdueReceivable: 180000,
        receivableInvoiceCount: 12,
        paidReceivableCount: 8,
        overdueInvoiceCount: 2,
        totalPayable: 1850000,
        totalPaid: 1450000,
        accountsReceivableBalance: 930000,
        accountsPayableBalance: 400000,
        monthlyBilled: 450000,
        monthlyReceived: 320000
      });
      this.loading.set(false);
    }, 500);
  }

  /** 重新整理 */
  refresh(): void {
    this.loadSummary();
  }

  /** 取得毛利顏色樣式 */
  getProfitStyle(): Record<string, string> {
    const profit = this.summary().grossProfit;
    return { color: profit >= 0 ? '#3f8600' : '#cf1322' };
  }

  /** 導航到請款單列表 */
  goToInvoices(): void {
    this.router.navigate(['blueprints', 'user', this.blueprintId(), 'finance', 'invoices']);
  }

  /** 導航到付款單列表 */
  goToPayments(): void {
    this.router.navigate(['blueprints', 'user', this.blueprintId(), 'finance', 'payments']);
  }

  /** 新增請款單 */
  createInvoice(): void {
    // TODO: 開啟新增請款單對話框
  }

  /** 新增付款單 */
  createPayment(): void {
    // TODO: 開啟新增付款單對話框
  }
}
