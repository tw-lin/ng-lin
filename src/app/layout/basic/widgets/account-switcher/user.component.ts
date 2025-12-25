import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthFacade } from '@core';
import { I18nPipe, SettingsService, User } from '@delon/theme';
import { WorkspaceContextService } from '@shared';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMenuModule } from 'ng-zorro-antd/menu';

@Component({
  selector: 'header-user',
  template: `
    <div class="alain-default__nav-item d-flex align-items-center px-sm" nz-dropdown nzPlacement="bottomRight" [nzDropdownMenu]="userMenu">
      @if (user && user.avatar) {
        <nz-avatar [nzSrc]="user.avatar" nzSize="small" class="mr-sm" />
      } @else {
        <nz-avatar [nzIcon]="contextIcon()" nzSize="small" class="mr-sm" />
      }
      {{ contextLabel() }}
    </div>
    <nz-dropdown-menu #userMenu="nzDropdownMenu">
      <div nz-menu class="width-sm">
        <div nz-menu-item routerLink="/pro/account/center">
          <i nz-icon nzType="user" class="mr-sm"></i>
          {{ 'menu.account.center' | i18n }}
        </div>
        <div nz-menu-item routerLink="/pro/account/settings">
          <i nz-icon nzType="setting" class="mr-sm"></i>
          {{ 'menu.account.settings' | i18n }}
        </div>
        <div nz-menu-item routerLink="/exception/trigger">
          <i nz-icon nzType="close-circle" class="mr-sm"></i>
          {{ 'menu.account.trigger' | i18n }}
        </div>
        <li nz-menu-divider></li>
        <div nz-menu-item (click)="logout()">
          <i nz-icon nzType="logout" class="mr-sm"></i>
          {{ 'menu.account.logout' | i18n }}
        </div>
      </div>
    </nz-dropdown-menu>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NzDropDownModule, NzMenuModule, NzIconModule, I18nPipe, NzAvatarModule]
})
export class HeaderUserComponent {
  private readonly settings = inject(SettingsService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthFacade);
  private readonly workspaceContext = inject(WorkspaceContextService);

  // Use workspace context for label and icon (these change based on context)
  readonly contextLabel = this.workspaceContext.contextLabel;
  readonly contextIcon = this.workspaceContext.contextIcon;

  // Avatar comes from SettingsService (single source of truth, updated by WorkspaceContextService)
  // This follows ng-alain patterns and Occam's Razor (simplest solution)
  get user(): User {
    return this.settings.user;
  }

  async logout(): Promise<void> {
    await this.auth.signOut();
    // AuthFacade (core/auth) already handles token clearing
  }
}
