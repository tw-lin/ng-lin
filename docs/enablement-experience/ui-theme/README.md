# 主題 (UI Theme)

> 本目錄包含 GigHub 專案的 UI 主題系統、設計規範、色彩系統與元件指南。

## 📋 目錄結構

```
ui-theme/
├── README.md                           # 本檔案
├── 01-ui-theme-best-practices.md       # 最佳實踐
├── 02-ui-theme-color-system.md         # 色彩系統
├── 03-ui-theme-components.md           # 元件指南
├── 04-ui-theme-design-system.md        # 設計系統
├── 05-ui-theme-implementation-guide.md # 實作指南
├── 06-ui-theme-migration.md            # 遷移指南
├── 07-ui-theme-testing.md              # 測試指南
└── 08-ui-theme-xuanwu-theme.md         # 玄武主題
```

## 🎨 主題系統概述

GigHub 使用基於 ng-zorro-antd 的企業級主題系統，結合玄武設計理念，打造專業且易用的使用者介面。

### 核心特點

- **響應式設計**: 支援桌面、平板、手機多種裝置
- **深淺雙模式**: 支援淺色與深色主題切換
- **模組化設計**: 元件獨立可重用
- **無障礙支援**: 符合 WCAG 2.1 AA 標準
- **效能優化**: 基於 Angular Signals 的細粒度更新

## 🎯 設計原則

### 1. 一致性 (Consistency)

整個應用保持視覺與互動的一致性：

- **視覺一致**: 統一的色彩、字體、間距
- **互動一致**: 相同操作有相同的互動方式
- **語言一致**: 統一的術語與描述

### 2. 回饋性 (Feedback)

每個操作都應給予即時回饋：

```typescript
// 載入狀態
loading = signal(false);

async loadData() {
  this.loading.set(true);
  try {
    await this.dataService.fetch();
    this.message.success('載入成功');
  } catch (error) {
    this.message.error('載入失敗');
  } finally {
    this.loading.set(false);
  }
}
```

### 3. 容錯性 (Fault Tolerance)

降低使用者錯誤的可能性：

- 使用預設值減少輸入
- 提供自動完成與建議
- 確認重要操作（如刪除）
- 提供取消與撤銷功能

### 4. 效率性 (Efficiency)

讓常用操作更容易執行：

- 提供鍵盤快捷鍵
- 記住使用者偏好設定
- 智慧排序與篩選
- 批次操作支援

## 🎨 色彩系統

### 主色系 (Primary Colors)

基於玄武主題的專業色彩系統：

```scss
// 主色 - 玄武藍
$primary-color: #1890ff;
$primary-dark: #096dd9;
$primary-light: #40a9ff;

// 輔助色
$success-color: #52c41a;
$warning-color: #faad14;
$error-color: #f5222d;
$info-color: #1890ff;
```

### 中性色 (Neutral Colors)

```scss
// 文字色
$text-primary: rgba(0, 0, 0, 0.85);
$text-secondary: rgba(0, 0, 0, 0.65);
$text-disabled: rgba(0, 0, 0, 0.25);

// 背景色
$bg-primary: #ffffff;
$bg-secondary: #fafafa;
$bg-tertiary: #f5f5f5;

// 邊框色
$border-color: #d9d9d9;
$divider-color: #f0f0f0;
```

### 語意化色彩 (Semantic Colors)

```scss
// 狀態色
$status-pending: #1890ff;
$status-in-progress: #faad14;
$status-completed: #52c41a;
$status-cancelled: #d9d9d9;
```

## 📐 間距系統

使用 8px 網格系統：

```scss
$spacing-xs: 8px;   // 0.5rem
$spacing-sm: 16px;  // 1rem
$spacing-md: 24px;  // 1.5rem
$spacing-lg: 32px;  // 2rem
$spacing-xl: 48px;  // 3rem
```

## 🔤 字體系統

### 字體家族

```scss
$font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
              'Helvetica Neue', Arial, 'Noto Sans', sans-serif,
              'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
              'Noto Color Emoji';

$font-family-code: 'SFMono-Regular', Consolas, 'Liberation Mono', 
                   Menlo, Courier, monospace;
```

### 字體大小

```scss
$font-size-sm: 12px;
$font-size-base: 14px;
$font-size-lg: 16px;
$font-size-xl: 20px;
$font-size-xxl: 24px;
```

### 字重

```scss
$font-weight-normal: 400;
$font-weight-medium: 500;
$font-weight-semibold: 600;
$font-weight-bold: 700;
```

## 🧩 元件庫

### ng-zorro-antd 元件

GigHub 使用以下 ng-zorro-antd 元件：

| 類別 | 元件 |
|------|------|
| 資料展示 | Table, Card, List, Tree, Timeline |
| 資料輸入 | Form, Input, Select, DatePicker, Upload |
| 回饋 | Message, Notification, Modal, Drawer |
| 導航 | Menu, Breadcrumb, Tabs, Pagination |
| 佈局 | Layout, Grid, Divider |

### 自定義元件

| 元件 | 用途 | 檔案位置 |
|------|------|----------|
| BlueprintCard | Blueprint 卡片 | `src/app/shared/components/` |
| TaskItem | 任務項目 | `src/app/shared/components/` |
| StatusBadge | 狀態徽章 | `src/app/shared/components/` |
| UserAvatar | 使用者頭像 | `src/app/shared/components/` |

## 🔧 實作範例

### 使用 Signals 管理主題

```typescript
import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  // 主題狀態
  isDark = signal(false);
  
  constructor() {
    // 從 localStorage 載入主題設定
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDark.set(true);
    }
    
    // 監聽主題變更
    effect(() => {
      const dark = this.isDark();
      document.documentElement.setAttribute(
        'data-theme', 
        dark ? 'dark' : 'light'
      );
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    });
  }
  
  toggleTheme(): void {
    this.isDark.update(dark => !dark);
  }
}
```

### 使用主題元件

```typescript
import { Component, signal, inject } from '@angular/core';
import { ThemeService } from '@core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  template: `
    <button 
      nz-button 
      nzType="text"
      (click)="toggleTheme()">
      @if (themeService.isDark()) {
        <i nz-icon nzType="sun" nzTheme="outline"></i>
      } @else {
        <i nz-icon nzType="moon" nzTheme="outline"></i>
      }
    </button>
  `
})
export class ThemeToggleComponent {
  themeService = inject(ThemeService);
  
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
```

## 📱 響應式設計

### 斷點系統

```scss
$screen-xs: 480px;  // 手機
$screen-sm: 576px;  // 手機橫向
$screen-md: 768px;  // 平板
$screen-lg: 992px;  // 桌面
$screen-xl: 1200px; // 大桌面
$screen-xxl: 1600px; // 超大桌面
```

### 使用範例

```scss
// 響應式佈局
.container {
  padding: $spacing-md;
  
  @media (max-width: $screen-md) {
    padding: $spacing-sm;
  }
}

// Grid 系統
.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: $spacing-md;
  
  @media (max-width: $screen-md) {
    grid-template-columns: repeat(6, 1fr);
  }
  
  @media (max-width: $screen-sm) {
    grid-template-columns: 1fr;
  }
}
```

## ♿ 無障礙設計

### WCAG 2.1 AA 合規

- **色彩對比**: 文字與背景對比度 ≥ 4.5:1
- **鍵盤導航**: 所有功能可用鍵盤操作
- **螢幕閱讀器**: 提供適當的 ARIA 屬性
- **焦點管理**: 清楚的焦點指示器

### 實作範例

```html
<!-- 語意化 HTML -->
<nav aria-label="主導航">
  <ul>
    <li><a href="/blueprints">專案</a></li>
    <li><a href="/tasks">任務</a></li>
  </ul>
</nav>

<!-- ARIA 屬性 -->
<button 
  aria-label="刪除任務"
  aria-describedby="delete-hint"
  (click)="deleteTask()">
  <i nz-icon nzType="delete"></i>
</button>
<span id="delete-hint" class="sr-only">
  此操作無法復原
</span>

<!-- 鍵盤快捷鍵 -->
<div 
  tabindex="0"
  role="button"
  (keydown.enter)="handleAction()"
  (keydown.space)="handleAction()">
  點擊或按 Enter/Space
</div>
```

## 🧪 主題測試

### 視覺回歸測試

```typescript
// 使用 Playwright 進行視覺測試
import { test, expect } from '@playwright/test';

test('theme toggle works correctly', async ({ page }) => {
  await page.goto('/');
  
  // 截圖淺色主題
  await expect(page).toHaveScreenshot('light-theme.png');
  
  // 切換到深色主題
  await page.click('[aria-label="切換主題"]');
  
  // 截圖深色主題
  await expect(page).toHaveScreenshot('dark-theme.png');
});
```

### 無障礙測試

```typescript
// 使用 axe-core 進行無障礙測試
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('should not have accessibility violations', async ({ page }) => {
  await page.goto('/');
  
  const accessibilityScanResults = await new AxeBuilder({ page })
    .analyze();
  
  expect(accessibilityScanResults.violations).toEqual([]);
});
```

## 📚 相關文件

- [設計規範](../design(設計)/README.md) - UI/UX 設計指南
- [元件開發](../getting-started(快速開始)/README.md) - 開發環境設定
- [測試指南](../operations(維運)/README.md) - 測試與品質保證
- [架構設計](../architecture(架構)/README.md) - 系統架構

## 🔄 變更記錄

### v1.0.0 (2025-12-21)
- ✅ 建立主題系統文件
- ✅ 定義色彩與字體系統
- ✅ 提供實作範例
- ✅ 統一檔案命名規範

---

**維護者**: GigHub 開發團隊  
**最後更新**: 2025-12-21  
**版本**: v1.0.0
