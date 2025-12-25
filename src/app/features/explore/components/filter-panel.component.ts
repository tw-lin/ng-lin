import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

import { SearchEntityType } from '../models';
import { ExploreSearchFacade } from '../services';

/**
 * Filter Panel Component
 *
 * Advanced filters for search results.
 *
 * Features:
 * - Entity type filter (Users, Organizations, Blueprints)
 * - Status filter (for Blueprints)
 * - Sort options
 * - Clear filters button
 *
 * Based on docs/Explore_Search_Architecture.md
 */
@Component({
  selector: 'app-filter-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="filter-panel">
      <!-- Entity Type Filters -->
      <div class="filter-section">
        <div class="filter-label">類型</div>
        <nz-space>
          <button *nzSpaceItem nz-button [nzType]="isAllSelected() ? 'primary' : 'default'" (click)="selectAllTypes()" nzSize="small">
            全部
          </button>
          <button
            *nzSpaceItem
            nz-button
            [nzType]="isTypeSelected('account') ? 'primary' : 'default'"
            (click)="toggleType('account')"
            nzSize="small"
          >
            <span nz-icon nzType="user" nzTheme="outline"></span>
            使用者
          </button>
          <button
            *nzSpaceItem
            nz-button
            [nzType]="isTypeSelected('organization') ? 'primary' : 'default'"
            (click)="toggleType('organization')"
            nzSize="small"
          >
            <span nz-icon nzType="team" nzTheme="outline"></span>
            組織
          </button>
          <button
            *nzSpaceItem
            nz-button
            [nzType]="isTypeSelected('blueprint') ? 'primary' : 'default'"
            (click)="toggleType('blueprint')"
            nzSize="small"
          >
            <span nz-icon nzType="project" nzTheme="outline"></span>
            藍圖
          </button>
        </nz-space>
      </div>

      <!-- Status Filter (for Blueprints) -->
      @if (showStatusFilter()) {
        <div class="filter-section">
          <div class="filter-label">狀態</div>
          <nz-select
            [ngModel]="currentFilters().status"
            (ngModelChange)="onStatusChange($event)"
            nzPlaceHolder="選擇狀態"
            nzAllowClear
            style="width: 120px"
            nzSize="small"
          >
            <nz-option nzLabel="全部" nzValue="all"></nz-option>
            <nz-option nzLabel="草稿" nzValue="draft"></nz-option>
            <nz-option nzLabel="啟用" nzValue="active"></nz-option>
            <nz-option nzLabel="封存" nzValue="archived"></nz-option>
          </nz-select>
        </div>
      }

      <!-- Sort Options -->
      <div class="filter-section">
        <div class="filter-label">排序</div>
        <nz-select [ngModel]="currentFilters().sortBy" (ngModelChange)="onSortChange($event)" style="width: 120px" nzSize="small">
          <nz-option nzLabel="相關性" nzValue="relevance"></nz-option>
          <nz-option nzLabel="名稱" nzValue="name"></nz-option>
          <nz-option nzLabel="建立時間" nzValue="created"></nz-option>
          <nz-option nzLabel="更新時間" nzValue="updated"></nz-option>
        </nz-select>
      </div>

      <!-- Clear Filters -->
      @if (hasActiveFilters()) {
        <div class="filter-section">
          <button nz-button nzType="link" nzSize="small" (click)="clearFilters()">
            <span nz-icon nzType="close" nzTheme="outline"></span>
            清除篩選
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .filter-panel {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        align-items: center;
        padding: 12px 0;
      }

      .filter-section {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .filter-label {
        font-size: 13px;
        white-space: nowrap;
      }

      @media (max-width: 768px) {
        .filter-panel {
          flex-direction: column;
          align-items: flex-start;
        }

        .filter-section {
          width: 100%;
        }
      }
    `
  ]
})
export class FilterPanelComponent {
  private readonly searchFacade = inject(ExploreSearchFacade);

  readonly currentFilters = this.searchFacade.filters;

  /**
   * Check if all entity types are selected
   */
  isAllSelected(): boolean {
    const types = this.currentFilters().entityTypes;
    return types.length === 3;
  }

  /**
   * Check if a specific type is selected
   */
  isTypeSelected(type: SearchEntityType): boolean {
    return this.currentFilters().entityTypes.includes(type);
  }

  /**
   * Toggle a specific entity type filter
   */
  toggleType(type: SearchEntityType): void {
    const current = this.currentFilters().entityTypes;

    if (current.includes(type)) {
      // Don't allow deselecting if it's the only one
      if (current.length === 1) {
        this.selectAllTypes();
        return;
      }
      this.searchFacade.updateFilters({
        entityTypes: current.filter(t => t !== type)
      });
    } else {
      // Add the type to the current selection
      this.searchFacade.updateFilters({
        entityTypes: [...current, type]
      });
    }
  }

  /**
   * Select all entity types
   */
  selectAllTypes(): void {
    this.searchFacade.updateFilters({
      entityTypes: ['account', 'organization', 'blueprint']
    });
  }

  /**
   * Check if status filter should be shown
   * Only show when blueprints are in the search
   */
  showStatusFilter(): boolean {
    return this.currentFilters().entityTypes.includes('blueprint');
  }

  /**
   * Handle status filter change
   */
  onStatusChange(status: 'draft' | 'active' | 'archived' | 'all'): void {
    this.searchFacade.updateFilters({ status: status || 'all' });
  }

  /**
   * Handle sort change
   */
  onSortChange(sortBy: 'relevance' | 'name' | 'created' | 'updated'): void {
    this.searchFacade.updateFilters({ sortBy });
  }

  /**
   * Check if any filters are active (not default)
   */
  hasActiveFilters(): boolean {
    const filters = this.currentFilters();
    return filters.entityTypes.length !== 3 || filters.status !== 'all' || filters.sortBy !== 'relevance';
  }

  /**
   * Clear all filters to default
   */
  clearFilters(): void {
    this.searchFacade.updateFilters({
      entityTypes: ['account', 'organization', 'blueprint'],
      status: 'all',
      sortBy: 'relevance'
    });
  }
}
