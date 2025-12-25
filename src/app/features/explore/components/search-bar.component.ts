import { Component, signal, inject, DestroyRef, output, input, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SHARED_IMPORTS } from '@shared';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { ExploreSearchFacade } from '../services';

/**
 * Search Bar Component
 *
 * Search input with debouncing and recent searches dropdown.
 *
 * Features:
 * - Debounced search input (300ms)
 * - Recent searches history
 * - Clear button
 * - Loading indicator
 *
 * Based on docs/Explore_Search_Architecture.md
 */
@Component({
  selector: 'app-search-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="search-bar-container">
      <nz-input-group [nzPrefix]="prefixIcon" [nzSuffix]="suffixTpl" nzSize="large">
        <input
          nz-input
          type="text"
          [placeholder]="placeholder()"
          [value]="inputValue()"
          (input)="onInput($event)"
          (keydown.enter)="onEnter()"
          (focus)="onFocus()"
          (blur)="onBlur()"
          data-testid="search-input"
        />
      </nz-input-group>

      <ng-template #prefixIcon>
        <span nz-icon nzType="search" nzTheme="outline"></span>
      </ng-template>

      <ng-template #suffixTpl>
        @if (loading()) {
          <span nz-icon nzType="loading" nzTheme="outline"></span>
        } @else if (inputValue()) {
          <span
            nz-icon
            nzType="close-circle"
            nzTheme="fill"
            class="search-clear-icon"
            (click)="clearInput()"
            role="button"
            tabindex="0"
          ></span>
        }
      </ng-template>

      <!-- Recent Searches Dropdown -->
      @if (showDropdown() && recentSearches().length > 0) {
        <div class="recent-searches-dropdown" data-testid="recent-searches">
          <div class="dropdown-header">
            <span>最近搜尋</span>
            <button nz-button nzType="link" nzSize="small" (click)="clearRecentSearches()"> 清除 </button>
          </div>
          @for (search of recentSearches(); track search) {
            <div class="dropdown-item" (click)="selectRecentSearch(search)" role="button" tabindex="0">
              <span nz-icon nzType="history" nzTheme="outline"></span>
              <span class="item-text">{{ search }}</span>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .search-bar-container {
        position: relative;
        width: 100%;
        max-width: 600px;
      }

      .search-clear-icon {
        cursor: pointer;
        transition: color 0.2s;

        &:hover {
        }
      }

      .recent-searches-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid;
        border-radius: 4px;
        z-index: 1000;
        margin-top: 4px;
      }

      .dropdown-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        border-bottom: 1px solid;
        font-weight: 500;
        font-size: 12px;
      }

      .dropdown-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        cursor: pointer;
        transition: background 0.2s;

        &:hover {
        }

        .item-text {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    `
  ]
})
export class SearchBarComponent {
  private readonly searchFacade = inject(ExploreSearchFacade);
  private readonly destroyRef = inject(DestroyRef);

  // Inputs
  placeholder = input('搜尋使用者、組織、藍圖...');

  // Outputs
  readonly searchTriggered = output<string>();

  // Local state
  inputValue = signal('');
  showDropdown = signal(false);

  // Facade state
  loading = this.searchFacade.loading;
  recentSearches = this.searchFacade.recentSearches;

  // Debounced search subject
  private searchSubject = new Subject<string>();

  constructor() {
    // Setup debounced search (300ms)
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe(query => {
      if (query.length >= 1) {
        this.searchFacade.search(query);
        this.searchTriggered.emit(query);
      } else if (query.length === 0) {
        this.searchFacade.clearSearch();
      }
    });
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.inputValue.set(value);
    this.searchSubject.next(value);
  }

  onEnter(): void {
    const query = this.inputValue();
    if (query.length >= 1) {
      this.searchFacade.search(query);
      this.searchTriggered.emit(query);
      this.showDropdown.set(false);
    }
  }

  onFocus(): void {
    if (!this.inputValue() && this.recentSearches().length > 0) {
      this.showDropdown.set(true);
    }
  }

  onBlur(): void {
    // Delay to allow click on dropdown items
    setTimeout(() => {
      this.showDropdown.set(false);
    }, 200);
  }

  selectRecentSearch(search: string): void {
    this.inputValue.set(search);
    this.searchFacade.search(search);
    this.searchTriggered.emit(search);
    this.showDropdown.set(false);
  }

  clearInput(): void {
    this.inputValue.set('');
    this.searchFacade.clearSearch();
    this.showDropdown.set(false);
  }

  clearRecentSearches(): void {
    this.searchFacade.clearRecentSearches();
    this.showDropdown.set(false);
  }
}
