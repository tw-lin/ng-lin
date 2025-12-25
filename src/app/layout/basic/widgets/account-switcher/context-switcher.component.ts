/**
 * Context Switcher Component (Firebase Version)
 *
 * 帳戶上下文切換器元件 (Firebase 版本)
 * Account context switcher component (Firebase version)
 *
 * Allows users to switch between personal account, organizations, teams, partners, and bots.
 * Integrated with WorkspaceContextService for state management.
 *
 * This component renders just menu items (<li> elements) without any dropdown wrapper.
 * It's designed to be embedded inside a parent menu container.
 *
 * @module layout/basic/widgets
 */

import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ContextType, Team, Partner, Bot } from '@core';
import { WorkspaceContextService } from '@shared/services';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMenuModule } from 'ng-zorro-antd/menu';

@Component({
  selector: 'header-context-switcher',
  standalone: true,
  imports: [NzMenuModule, NzIconModule],
  template: `
    <!-- Personal account (flat) -->
    @if (currentUser()) {
      <li nz-menu-item (click)="switchToUser()" [class.ant-menu-item-selected]="isUserContext()">
        <i nz-icon nzType="user" class="mr-sm"></i>
        <span>{{ currentUser()?.name || '個人帳戶' }}</span>
      </li>
    }

    <!-- Organizations with their teams and partners (flat + nested) -->
    @for (org of organizations(); track org.id) {
      @if (getTeamsForOrg(org.id).length > 0 || getPartnersForOrg(org.id).length > 0) {
        <!-- Organization with teams/partners -->
        <li nz-submenu [nzTitle]="org.name" nzIcon="team">
          <ul nz-menu>
            <!-- Organization itself -->
            <li nz-menu-item (click)="switchToOrganization(org.id)" [class.ant-menu-item-selected]="isOrganizationContext(org.id)">
              <i nz-icon nzType="team" class="mr-sm"></i>
              <span>{{ org.name }}</span>
            </li>
            <li nz-menu-divider></li>
            <!-- Teams under this organization (內部) -->
            @if (getTeamsForOrg(org.id).length > 0) {
              <li nz-menu-group nzTitle="內部團隊">
                @for (team of getTeamsForOrg(org.id); track team.id) {
                  <li nz-menu-item (click)="switchToTeam(team.id)" [class.ant-menu-item-selected]="isTeamContext(team.id)">
                    <i nz-icon nzType="usergroup-add" class="mr-sm"></i>
                    <span>{{ team.name }}</span>
                  </li>
                }
              </li>
            }
            <!-- Partners under this organization (外部) -->
            @if (getPartnersForOrg(org.id).length > 0) {
              <li nz-menu-group nzTitle="外部夥伴">
                @for (partner of getPartnersForOrg(org.id); track partner.id) {
                  <li nz-menu-item (click)="switchToPartner(partner.id)" [class.ant-menu-item-selected]="isPartnerContext(partner.id)">
                    <i nz-icon nzType="solution" class="mr-sm"></i>
                    <span>{{ partner.name }}</span>
                  </li>
                }
              </li>
            }
          </ul>
        </li>
      } @else {
        <!-- Organization without teams/partners (flat item) -->
        <li nz-menu-item (click)="switchToOrganization(org.id)" [class.ant-menu-item-selected]="isOrganizationContext(org.id)">
          <i nz-icon nzType="team" class="mr-sm"></i>
          <span>{{ org.name }}</span>
        </li>
      }
    }

    <!-- Bots (flat items) -->
    @for (bot of bots(); track bot.id) {
      <li nz-menu-item (click)="switchToBot(bot.id)" [class.ant-menu-item-selected]="isBotContext(bot.id)">
        <i nz-icon nzType="robot" class="mr-sm"></i>
        <span>{{ bot.name }}</span>
      </li>
    }

    <!-- No accounts message -->
    @if (!currentUser() && organizations().length === 0) {
      <li nz-menu-item nzDisabled>
        <i nz-icon nzType="info-circle" class="mr-sm"></i>
        <span>暫無可用帳戶</span>
      </li>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderContextSwitcherComponent {
  private readonly workspaceContext = inject(WorkspaceContextService);

  // Expose ContextType enum to template
  readonly ContextType = ContextType;

  // Use WorkspaceContextService signals
  readonly currentUser = this.workspaceContext.currentUser;
  readonly organizations = this.workspaceContext.organizations;
  readonly teams = this.workspaceContext.teams;
  readonly partners = this.workspaceContext.partners;
  readonly bots = this.workspaceContext.bots;
  readonly teamsByOrganization = this.workspaceContext.teamsByOrganization;
  readonly partnersByOrganization = this.workspaceContext.partnersByOrganization;
  readonly contextLabel = this.workspaceContext.contextLabel;
  readonly contextIcon = this.workspaceContext.contextIcon;
  readonly switching = this.workspaceContext.switching;

  // Computed signals for type-safe comparisons
  readonly currentContextType = this.workspaceContext.contextType;
  readonly currentContextId = this.workspaceContext.contextId;

  /**
   * Get teams for a specific organization
   */
  getTeamsForOrg(orgId: string): Team[] {
    return this.workspaceContext.getTeamsForOrg(orgId);
  }

  /**
   * Get partners for a specific organization
   */
  getPartnersForOrg(orgId: string): Partner[] {
    return this.workspaceContext.getPartnersForOrg(orgId);
  }

  /**
   * Check if current context is user
   */
  isUserContext(): boolean {
    return this.currentContextType() === ContextType.USER;
  }

  /**
   * Check if current context is the specified organization
   */
  isOrganizationContext(orgId: string): boolean {
    return this.currentContextType() === ContextType.ORGANIZATION && this.currentContextId() === orgId;
  }

  /**
   * Check if current context is the specified team
   */
  isTeamContext(teamId: string): boolean {
    return this.currentContextType() === ContextType.TEAM && this.currentContextId() === teamId;
  }

  /**
   * Check if current context is the specified partner
   */
  isPartnerContext(partnerId: string): boolean {
    return this.currentContextType() === ContextType.PARTNER && this.currentContextId() === partnerId;
  }

  /**
   * Check if current context is the specified bot
   */
  isBotContext(botId: string): boolean {
    return this.currentContextType() === ContextType.BOT && this.currentContextId() === botId;
  }

  /**
   * Switch to user context
   */
  switchToUser(): void {
    const userId = this.currentUser()?.id;
    if (userId) {
      this.workspaceContext.switchToUser(userId);
    }
  }

  /**
   * Switch to organization context
   */
  switchToOrganization(orgId: string): void {
    this.workspaceContext.switchToOrganization(orgId);
  }

  /**
   * Switch to team context
   */
  switchToTeam(teamId: string): void {
    this.workspaceContext.switchToTeam(teamId);
  }

  /**
   * Switch to partner context
   */
  switchToPartner(partnerId: string): void {
    this.workspaceContext.switchToPartner(partnerId);
  }

  /**
   * Switch to bot context
   */
  switchToBot(botId: string): void {
    this.workspaceContext.switchToBot(botId);
  }
}
