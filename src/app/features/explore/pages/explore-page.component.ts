import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

import { FilterPanelComponent } from '../components/filter-panel.component';
import { ResultGridComponent } from '../components/result-grid.component';
import { SearchBarComponent } from '../components/search-bar.component';
import { ExploreSearchFacade } from '../services';

/**
 * Explore Page Component
 *
 * Main container for the GitHub-like Explore search feature.
 * Enables users to discover Users, Organizations, and Blueprints.
 *
 * Features:
 * - Unified search across multiple entity types
 * - Advanced filtering and sorting
 * - Responsive grid display
 * - Recent search history
 *
 * Based on docs/Explore_Search_Architecture.md
 */
@Component({
  selector: 'app-explore-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, SearchBarComponent, FilterPanelComponent, ResultGridComponent],
  template: `
    <page-header [title]="'探索'">
      <p class="page-subtitle">探索使用者、組織和藍圖</p>
    </page-header>

    <nz-card class="explore-container">
      <!-- Search Section -->
      <div class="search-section">
        <app-search-bar />
      </div>

      <!-- Filter Section -->
      @if (hasQuery()) {
        <div class="filter-section">
          <app-filter-panel />
        </div>
      }

      <!-- Results Section -->
      <div class="results-section">
        @if (hasQuery()) {
          <app-result-grid />
        } @else {
          <!-- Welcome State -->
          <div class="welcome-state">
            <div class="welcome-icon">
              <span nz-icon nzType="search" nzTheme="outline"></span>
            </div>
            <h3 class="welcome-title">開始探索</h3>
            <p class="welcome-description">輸入關鍵字搜尋使用者、組織或藍圖</p>

            <!-- Quick Stats -->
            @if (recentSearches().length > 0) {
              <div class="recent-searches-section">
                <h4 class="section-title">最近搜尋</h4>
                <div class="recent-tags">
                  @for (search of recentSearches().slice(0, 5); track search) {
                    <nz-tag class="recent-tag" (click)="quickSearch(search)">
                      <span nz-icon nzType="history" nzTheme="outline"></span>
                      {{ search }}
                    </nz-tag>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    </nz-card>
  `,
  styles: [
    `
      .page-subtitle {
        margin: 0;
        font-size: 14px;
      }

      .explore-container {
        min-height: 500px;
      }

      .search-section {
        display: flex;
        justify-content: center;
        padding: 24px 0;
      }

      .filter-section {
        border-bottom: 1px solid;
        margin-bottom: 16px;
      }

      .results-section {
        min-height: 300px;
      }

      .welcome-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        text-align: center;
      }

      .welcome-icon {
        font-size: 64px;
        margin-bottom: 24px;
      }

      .welcome-title {
        font-size: 20px;
        font-weight: 500;
        margin-bottom: 8px;
      }

      .welcome-description {
        margin-bottom: 32px;
      }

      .recent-searches-section {
        margin-top: 24px;
        width: 100%;
        max-width: 500px;
      }

      .section-title {
        font-size: 14px;
        margin-bottom: 12px;
        font-weight: normal;
      }

      .recent-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: center;
      }

      .recent-tag {
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
        }
      }
    `
  ]
})
export class ExplorePageComponent {
  private readonly searchFacade = inject(ExploreSearchFacade);

  readonly hasQuery = this.searchFacade.hasQuery;
  readonly recentSearches = this.searchFacade.recentSearches;

  /**
   * Execute a quick search from recent searches
   */
  quickSearch(query: string): void {
    this.searchFacade.search(query);
  }
}
