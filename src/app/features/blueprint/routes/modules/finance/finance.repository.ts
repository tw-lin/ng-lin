import { Injectable } from '@angular/core';

import type { BillableItem, FinanceData, Invoice, InvoiceStatus } from './finance.model';

@Injectable({ providedIn: 'root' })
export class FinanceRepository {
  async loadFinanceData(blueprintId: string): Promise<FinanceData> {
    const summary = {
      blueprintId,
      receivables: { total: 2850000, collected: 1920000, pending: 930000, collectionRate: 67.4 },
      payables: { total: 1850000, paid: 1450000, pending: 400000, paymentRate: 78.4 },
      grossProfit: 470000,
      grossProfitMargin: 24.5,
      asOf: new Date(),
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
    };

    const receivableItems: BillableItem[] = [
      {
        id: '1',
        taskName: '基礎工程-第一期',
        contractAmount: 500000,
        billablePercentage: 80,
        billableAmount: 400000,
        billedAmount: 320000,
        remainingAmount: 80000,
        type: 'receivable',
        party: '業主公司'
      },
      {
        id: '2',
        taskName: '結構工程-A棟',
        contractAmount: 800000,
        billablePercentage: 60,
        billableAmount: 480000,
        billedAmount: 300000,
        remainingAmount: 180000,
        type: 'receivable',
        party: '業主公司'
      },
      {
        id: '3',
        taskName: '機電工程-第一階段',
        contractAmount: 350000,
        billablePercentage: 100,
        billableAmount: 350000,
        billedAmount: 350000,
        remainingAmount: 0,
        type: 'receivable',
        party: '業主公司'
      }
    ];

    const payableItems: BillableItem[] = [
      {
        id: '4',
        taskName: '鋼筋採購',
        contractAmount: 420000,
        billablePercentage: 100,
        billableAmount: 420000,
        billedAmount: 380000,
        remainingAmount: 40000,
        type: 'payable',
        party: '承商A'
      },
      {
        id: '5',
        taskName: '混凝土工程',
        contractAmount: 280000,
        billablePercentage: 70,
        billableAmount: 196000,
        billedAmount: 150000,
        remainingAmount: 46000,
        type: 'payable',
        party: '承商B'
      }
    ];

    const receivableInvoices = this.createMockInvoices('receivable', blueprintId);
    const payableInvoices = this.createMockInvoices('payable', blueprintId);

    return {
      summary,
      receivableItems,
      payableItems,
      receivableInvoices,
      payableInvoices
    };
  }

  private createMockInvoices(type: 'receivable' | 'payable', blueprintId: string): Invoice[] {
    const now = new Date();
    const dueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const prefix = type === 'receivable' ? 'INV' : 'PAY';

    return [
      this.createMockInvoice(`${prefix}-20251217-001`, type, 'approved', 150000, now, dueDate, blueprintId),
      this.createMockInvoice(`${prefix}-20251216-002`, type, 'submitted', 85000, now, dueDate, blueprintId),
      this.createMockInvoice(`${prefix}-20251215-003`, type, 'under_review', 42000, now, dueDate, blueprintId),
      this.createMockInvoice(`${prefix}-20251214-004`, type, 'draft', 68000, now, dueDate, blueprintId)
    ];
  }

  private createMockInvoice(
    invoiceNumber: string,
    invoiceType: 'receivable' | 'payable',
    status: InvoiceStatus,
    total: number,
    createdAt: Date,
    dueDate: Date,
    blueprintId: string
  ): Invoice {
    return {
      id: `mock-${invoiceNumber}`,
      blueprintId,
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
        name: invoiceType === 'receivable' ? '本公司' : '承商公司',
        taxId: '12345678',
        address: '台北市信義區',
        contactName: '王經理',
        contactPhone: '02-12345678',
        contactEmail: 'contact@example.com'
      },
      payingParty: {
        id: 'org-002',
        name: invoiceType === 'receivable' ? '業主公司' : '本公司',
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
