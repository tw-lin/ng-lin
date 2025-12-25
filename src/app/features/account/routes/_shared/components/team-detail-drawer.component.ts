import { Component, ChangeDetectionStrategy, inject, input } from '@angular/core';
import { Team } from '@core';
import { SHARED_IMPORTS } from '@shared';

/**
 * Team Detail Drawer Component
 * 團隊詳情抽屜元件
 *
 * Features:
 * - Display team details
 * - Show team members
 * - Quick actions
 *
 * ✅ Modern Angular pattern with Signals
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-team-detail-drawer',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="team-detail-drawer">
      <nz-descriptions nzTitle="團隊資訊" nzBordered [nzColumn]="1">
        @if (team(); as teamData) {
          <nz-descriptions-item nzTitle="團隊名稱">
            {{ teamData.name }}
          </nz-descriptions-item>
          <nz-descriptions-item nzTitle="團隊 ID">
            {{ teamData.id }}
          </nz-descriptions-item>
          @if (teamData.description) {
            <nz-descriptions-item nzTitle="描述">
              {{ teamData.description }}
            </nz-descriptions-item>
          }
          <nz-descriptions-item nzTitle="組織 ID">
            {{ teamData.organization_id }}
          </nz-descriptions-item>
          @if (teamData.created_at) {
            <nz-descriptions-item nzTitle="建立時間">
              {{ teamData.created_at | date: 'medium' }}
            </nz-descriptions-item>
          }
        }
      </nz-descriptions>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        padding: 24px;
      }

      .team-detail-drawer {
        max-width: 800px;
      }
    `
  ]
})
export class TeamDetailDrawerComponent {
  // Input: team to display
  team = input.required<Team>();
}
