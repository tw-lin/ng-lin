import { Component, inject, output, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { SHARED_IMPORTS } from '@shared';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

import { SearchResult, AccountMetadata, OrganizationMetadata, BlueprintMetadata } from '../models';
import { ExploreSearchFacade } from '../services';

/**
 * Result Grid Component
 *
 * Displays search results in a card grid layout.
 *
 * Features:
 * - Grid layout with responsive columns
 * - Entity-specific card rendering
 * - Click navigation to detail pages
 * - Empty state handling
 * - Infinite scroll support
 *
 * Based on docs/Explore_Search_Architecture.md
 */
@Component({
  selector: 'app-result-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzEmptyModule],
  template: `
    <!-- Loading State -->
    @if (loading()) {
      <div class="loading-container">
        <nz-spin nzSimple nzSize="large"></nz-spin>
        <p class="loading-text">搜尋中...</p>
      </div>
    } @else if (isEmpty()) {
      <!-- Empty State -->
      <div class="empty-container" data-testid="empty-results">
        <nz-empty [nzNotFoundContent]="emptyContent">
          <ng-template #emptyContent>
            <span>找不到符合「{{ query() }}」的結果</span>
          </ng-template>
        </nz-empty>
        <p class="empty-hint">試試其他關鍵字或調整篩選條件</p>
      </div>
    } @else if (results().length > 0) {
      <!-- Results Header -->
      <div class="results-header">
        <span class="results-count">找到 {{ totalCount() }} 個結果</span>
      </div>

      <!-- Results Grid -->
      <div class="results-grid" data-testid="search-results">
        @for (result of results(); track result.id) {
          <nz-card class="result-card" [nzHoverable]="true" [attr.data-entity-type]="result.type" (click)="onResultClick(result)">
            <div class="card-content">
              <!-- Avatar / Icon -->
              <div class="card-avatar">
                @if (result.avatarUrl) {
                  <nz-avatar [nzSrc]="result.avatarUrl" [nzSize]="48"></nz-avatar>
                } @else {
                  <nz-avatar [nzIcon]="getEntityIcon(result.type)" [nzSize]="48"> </nz-avatar>
                }
              </div>

              <!-- Content -->
              <div class="card-info">
                <div class="card-title">
                  {{ result.title }}
                  @if (result.type === 'blueprint' && getBlueprintMetadata(result).isPublic) {
                    <nz-tag nzColor="blue" class="public-tag">公開</nz-tag>
                  }
                </div>
                <div class="card-subtitle">{{ result.subtitle }}</div>
                <div class="card-meta">
                  <nz-tag [nzColor]="getEntityTagColor(result.type)">
                    <span nz-icon [nzType]="getEntityIcon(result.type)" nzTheme="outline"></span>
                    {{ getEntityLabel(result.type) }}
                  </nz-tag>
                  @if (result.type === 'blueprint') {
                    <nz-tag [nzColor]="getStatusColor(getBlueprintMetadata(result).status)">
                      {{ getStatusLabel(getBlueprintMetadata(result).status) }}
                    </nz-tag>
                  }
                </div>
              </div>

              <!-- Stats -->
              <div class="card-stats">
                @switch (result.type) {
                  @case ('account') {
                    <div class="stat-item">
                      <span nz-icon nzType="team" nzTheme="outline"></span>
                      {{ getAccountMetadata(result).organizationCount }} 組織
                    </div>
                  }
                  @case ('organization') {
                    <div class="stat-item">
                      <span nz-icon nzType="user" nzTheme="outline"></span>
                      {{ getOrganizationMetadata(result).memberCount }} 成員
                    </div>
                  }
                  @case ('blueprint') {
                    <div class="stat-item">
                      <span nz-icon nzType="check-square" nzTheme="outline"></span>
                      {{ getBlueprintMetadata(result).taskCount }} 任務
                    </div>
                  }
                }
              </div>
            </div>
          </nz-card>
        }
      </div>

      <!-- Load More -->
      @if (hasMore()) {
        <div class="load-more-container">
          <button nz-button nzType="default" (click)="loadMore()">
            <span nz-icon nzType="reload" nzTheme="outline"></span>
            載入更多
          </button>
        </div>
      }
    }
  `,
  styles: [
    `
      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
      }

      .loading-text {
        margin-top: 16px;
      }

      .empty-container {
        padding: 60px 20px;
        text-align: center;
      }

      .empty-hint {
        margin-top: 8px;
        font-size: 13px;
      }

      .results-header {
        margin-bottom: 16px;
      }

      .results-count {
        font-size: 13px;
      }

      .results-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
        gap: 16px;
      }

      .result-card {
        cursor: pointer;
        transition:
          box-shadow 0.2s,
          transform 0.2s;

        &:hover {
          transform: translateY(-2px);
        }
      }

      .card-content {
        display: flex;
        gap: 16px;
        align-items: flex-start;
      }

      .card-avatar {
        flex-shrink: 0;
      }

      .card-info {
        flex: 1;
        min-width: 0;
      }

      .card-title {
        font-size: 15px;
        font-weight: 500;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .public-tag {
        font-size: 11px;
        line-height: 1;
        padding: 2px 6px;
      }

      .card-subtitle {
        font-size: 13px;
        margin-bottom: 8px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .card-meta {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
      }

      .card-stats {
        flex-shrink: 0;
        text-align: right;

        .stat-item {
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
          justify-content: flex-end;
        }
      }

      .load-more-container {
        display: flex;
        justify-content: center;
        margin-top: 24px;
      }

      @media (max-width: 576px) {
        .results-grid {
          grid-template-columns: 1fr;
        }

        .card-content {
          flex-direction: column;
        }

        .card-stats {
          text-align: left;
        }
      }
    `
  ]
})
export class ResultGridComponent {
  private readonly searchFacade = inject(ExploreSearchFacade);
  private readonly router = inject(Router);

  // Outputs
  readonly resultClicked = output<SearchResult>();

  // Facade state
  readonly results = this.searchFacade.results;
  readonly loading = this.searchFacade.loading;
  readonly isEmpty = this.searchFacade.isEmpty;
  readonly hasMore = this.searchFacade.hasMore;
  readonly query = this.searchFacade.query;
  readonly totalCount = this.searchFacade.totalCount;

  /**
   * Handle result card click
   */
  onResultClick(result: SearchResult): void {
    this.resultClicked.emit(result);
    this.navigateToResult(result);
  }

  /**
   * Navigate to the appropriate detail page based on entity type
   */
  private navigateToResult(result: SearchResult): void {
    switch (result.type) {
      case 'account':
        // Navigate to user profile
        this.router.navigate(['/user', result.id]);
        break;
      case 'organization':
        // Navigate to organization detail
        this.router.navigate(['/organization', result.id]);
        break;
      case 'blueprint':
        // Navigate to blueprint detail
        this.router.navigate(['/blueprints/user', result.id]);
        break;
    }
  }

  /**
   * Load more results
   */
  loadMore(): void {
    this.searchFacade.loadNextPage();
  }

  // Helper methods for type-safe metadata access
  getAccountMetadata(result: SearchResult): AccountMetadata {
    return result.metadata as AccountMetadata;
  }

  getOrganizationMetadata(result: SearchResult): OrganizationMetadata {
    return result.metadata as OrganizationMetadata;
  }

  getBlueprintMetadata(result: SearchResult): BlueprintMetadata {
    return result.metadata as BlueprintMetadata;
  }

  /**
   * Get icon for entity type
   */
  getEntityIcon(type: string): string {
    const icons: Record<string, string> = {
      account: 'user',
      organization: 'team',
      blueprint: 'project'
    };
    return icons[type] || 'file';
  }

  /**
   * Get tag color for entity type
   */
  getEntityTagColor(type: string): string {
    return 'default';
  }

  /**
   * Get label for entity type
   */
  getEntityLabel(type: string): string {
    const labels: Record<string, string> = {
      account: '使用者',
      organization: '組織',
      blueprint: '藍圖'
    };
    return labels[type] || type;
  }

  /**
   * Get status color for blueprint status
   */
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      draft: 'default',
      active: 'success',
      archived: 'default'
    };
    return colors[status] || 'default';
  }

  /**
   * Get label for blueprint status
   */
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: '草稿',
      active: '啟用',
      archived: '封存'
    };
    return labels[status] || status;
  }
}
