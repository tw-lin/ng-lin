import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./monitoring-dashboard.component').then(m => m.MonitoringDashboardComponent),
    data: { title: '系統監控' }
  }
];
