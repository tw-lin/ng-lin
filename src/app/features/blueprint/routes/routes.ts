import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./blueprint-list.component').then(m => m.BlueprintListComponent),
    data: { title: '藍圖管理' }
  },
  {
    path: ':id',
    loadComponent: () => import('./blueprint-detail.component').then(m => m.BlueprintDetailComponent),
    data: { title: '藍圖詳情' }
  },
  {
    path: ':id/designer',
    loadComponent: () => import('./blueprint-designer.component').then(m => m.BlueprintDesignerComponent),
    data: { title: '藍圖設計器' }
  },
  {
    path: ':id/members',
    loadComponent: () => import('./modules/members').then(m => m.MembersModuleViewComponent),
    data: { title: '成員管理' }
  },
  {
    path: ':id/agreement',
    loadComponent: () => import('./modules/agreement').then(m => m.AgreementModuleViewComponent),
    data: { title: '協議' }
  },
  {
    path: ':id/audit',
    loadComponent: () => import('./modules/audit-logs').then(m => m.AuditLogsComponent),
    data: { title: '審計日誌' }
  },
  {
    path: ':id/finance',
    loadChildren: () => import('./modules/finance/routes').then(m => m.financeRoutes),
    data: { title: '財務管理' }
  }
];
