import { Routes } from '@angular/router';

import { LayoutPassportComponent } from '../../layout';

export const routes: Routes = [
  {
    path: 'passport',
    component: LayoutPassportComponent,
    children: [
      {
        path: 'login',
        loadComponent: () => import('./pages/login/login.component').then(m => m.UserLoginComponent),
        data: { title: '登录', titleI18n: 'app.login.login' }
      },
      {
        path: 'register',
        loadComponent: () => import('./pages/register/register.component').then(m => m.UserRegisterComponent),
        data: { title: '注册', titleI18n: 'app.register.register' }
      },
      {
        path: 'register-result',
        loadComponent: () => import('./pages/register-result/register-result.component').then(m => m.UserRegisterResultComponent),
        data: { title: '注册结果', titleI18n: 'app.register.register' }
      },
      {
        path: 'lock',
        loadComponent: () => import('./pages/lock/lock.component').then(m => m.UserLockComponent),
        data: { title: '锁屏', titleI18n: 'app.lock' }
      }
    ]
  },
  {
    path: 'passport/callback/:type',
    loadComponent: () => import('./pages/callback.component').then(m => m.CallbackComponent)
  }
];
