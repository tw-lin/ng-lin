/**
 * Finance Routes - 財務模組路由配置
 *
 * SETC-030: Invoice/Payment UI Components
 *
 * 路由結構：
 * - /blueprints/user/:id/finance - 財務儀表板
 * - /blueprints/user/:id/finance/invoices - 請款單列表
 * - /blueprints/user/:id/finance/payments - 付款單列表
 *
 * @module FinanceRoutes
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Routes } from '@angular/router';

export const financeRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/dashboard').then(m => m.FinanceDashboardComponent),
    data: { title: '財務概覽' }
  },
  {
    path: 'invoices',
    loadComponent: () => import('./features/invoice-list').then(m => m.InvoiceListComponent),
    data: {
      title: '請款單管理',
      invoiceType: 'receivable'
    }
  },
  {
    path: 'payments',
    loadComponent: () => import('./features/invoice-list').then(m => m.InvoiceListComponent),
    data: {
      title: '付款單管理',
      invoiceType: 'payable'
    }
  }
];
