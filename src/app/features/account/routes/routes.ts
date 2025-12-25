import { Routes } from '@angular/router';

import { AccountContextResolver } from './_shared/account-context.resolver';
import { AccountLayoutComponent } from './_shared/account-layout.component';
import { accountGuard } from './_shared/account.guard';

export const routes: Routes = [
  {
    path: '',
    component: AccountLayoutComponent,
    canActivate: [accountGuard],
    resolve: {
      accountContext: AccountContextResolver
    },
    children: [
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      {
        path: 'profile',
        loadComponent: () =>
          import('../profile/components/account-profile-page.component').then(
            m => m.AccountProfilePageComponent
          ),
        data: { title: '個人設定', defaultProfileId: 'profile-default' }
      },
      {
        path: 'profile/:profileId',
        loadComponent: () =>
          import('../profile/components/account-profile-page.component').then(
            m => m.AccountProfilePageComponent
          ),
        data: { title: '個人設定', defaultProfileId: 'profile-default' }
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../dashboard/components/account-dashboard-page.component').then(
            m => m.AccountDashboardPageComponent
          ),
        data: { title: '儀表板', defaultDashboardId: 'dashboard-default' }
      },
      {
        path: 'dashboard/:dashboardId',
        loadComponent: () =>
          import('../dashboard/components/account-dashboard-page.component').then(
            m => m.AccountDashboardPageComponent
          ),
        data: { title: '儀表板', defaultDashboardId: 'dashboard-default' }
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('../settings/components/account-settings-page.component').then(
            m => m.AccountSettingsPageComponent
          ),
        data: { title: '偏好設定', defaultSettingsId: 'settings-default' }
      },
      {
        path: 'settings/:settingsId',
        loadComponent: () =>
          import('../settings/components/account-settings-page.component').then(
            m => m.AccountSettingsPageComponent
          ),
        data: { title: '偏好設定', defaultSettingsId: 'settings-default' }
      }
    ]
  }
];
