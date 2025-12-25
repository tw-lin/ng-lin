export type InvoiceStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'invoiced'
  | 'partial_paid'
  | 'paid'
  | 'cancelled';

export interface FinancialSummary {
  blueprintId: string;
  receivables: { total: number; collected: number; pending: number; collectionRate: number };
  payables: { total: number; paid: number; pending: number; paymentRate: number };
  grossProfit: number;
  grossProfitMargin: number;
  asOf: Date;
  totalBilled: number;
  totalReceived: number;
  pendingReceivable: number;
  overdueReceivable: number;
  receivableInvoiceCount: number;
  paidReceivableCount: number;
  overdueInvoiceCount: number;
  totalPayable: number;
  totalPaid: number;
  accountsReceivableBalance: number;
  accountsPayableBalance: number;
  monthlyBilled: number;
  monthlyReceived: number;
}

export interface BillableItem {
  id: string;
  taskName: string;
  contractAmount: number;
  billablePercentage: number;
  billableAmount: number;
  billedAmount: number;
  remainingAmount: number;
  type: 'receivable' | 'payable';
  party: string;
}

export interface InvoiceParty {
  id: string;
  name: string;
  taxId?: string;
  address?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export interface Invoice {
  id: string;
  blueprintId: string;
  invoiceNumber: string;
  invoiceType: 'receivable' | 'payable';
  contractId: string;
  taskIds: string[];
  invoiceItems: unknown[];
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  billingPercentage: number;
  billingParty: InvoiceParty;
  payingParty: InvoiceParty;
  status: InvoiceStatus;
  approvalWorkflow: { currentStep: number; totalSteps: number; approvers: unknown[]; history: unknown[] };
  dueDate: Date;
  attachments: unknown[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinanceData {
  summary: FinancialSummary;
  receivableItems: BillableItem[];
  payableItems: BillableItem[];
  receivableInvoices: Invoice[];
  payableInvoices: Invoice[];
}
