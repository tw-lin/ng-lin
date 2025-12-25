import { Component, ChangeDetectionStrategy, input } from '@angular/core';

import { MemberListComponent } from './features/member-list';

/**
 * Members Module View Component
 * 成員模組檢視元件 - 主要協調器
 *
 * Architecture:
 * - Main orchestrator for members module
 * - Delegates to feature components
 * - Maintains clear separation of concerns
 *
 * Feature-Based Architecture:
 * ✅ High Cohesion (高內聚性): All member functionality in one module
 * ✅ Low Coupling (低耦合性): Clear interfaces via barrel exports
 * ✅ Extensibility (可擴展性): Easy to add features (e.g., bulk import, export)
 *
 * Future Extension Points:
 * - Member bulk import feature
 * - Member export/report feature
 * - Member activity history
 * - Member permissions matrix view
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-members-module-view',
  standalone: true,
  imports: [MemberListComponent],
  template: ` <app-member-list [blueprintId]="blueprintId()" [blueprintOwnerType]="blueprintOwnerType()" /> `,
  styles: [
    `
      :host {
        display: block;
      }
    `
  ]
})
export class MembersModuleViewComponent {
  // Input: blueprint context
  blueprintId = input.required<string>();
  blueprintOwnerType = input.required<string>();
}
