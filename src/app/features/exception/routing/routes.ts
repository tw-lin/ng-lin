import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '403',
    loadComponent: () => import('../pages/exception.component').then(m => m.ExceptionComponent),
    data: { type: 403 }
  },
  {
    path: '404',
    loadComponent: () => import('../pages/exception.component').then(m => m.ExceptionComponent),
    data: { type: 404 }
  },
  {
    path: '500',
    loadComponent: () => import('../pages/exception.component').then(m => m.ExceptionComponent),
    data: { type: 500 }
  },
  {
    path: 'trigger',
    loadComponent: () => import('../pages/trigger.component').then(m => m.ExceptionTriggerComponent)
  }
];
