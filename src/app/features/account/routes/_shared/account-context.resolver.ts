import { Injectable, inject } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { AccountService } from '../../index';

/**
 * Account context resolver that preloads profile/dashboard/settings through the account facade.
 */
@Injectable({ providedIn: 'root' })
export class AccountContextResolver implements Resolve<Promise<any>> {
  private readonly accountService = inject(AccountService);

  async resolve(route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Promise<any> {
    const profileId = route.paramMap.get('profileId') ?? 'profile-default';
    const dashboardId = route.paramMap.get('dashboardId') ?? 'dashboard-default';
    const settingsId = route.paramMap.get('settingsId') ?? 'settings-default';

    const [profile, dashboard, settings] = await Promise.all([
      this.accountService.loadProfile(profileId),
      this.accountService.loadDashboard(dashboardId),
      this.accountService.loadSettings(settingsId)
    ]);

    return { profile, dashboard, settings };
  }
}
