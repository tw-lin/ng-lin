# 玄武主題實施指南
# Xuanwu Theme Implementation Guide

> **技術實作方法與程式碼範例**

## 📖 目錄 (Table of Contents)

1. [執行時配置](#執行時配置-runtime-configuration)
2. [編譯時配置](#編譯時配置-compile-time-configuration)
3. [動態主題切換](#動態主題切換-dynamic-theme-switching)
4. [Less 變數配置](#less-變數配置)
5. [Angular 整合](#angular-整合)
6. [常見問題](#常見問題-troubleshooting)

---

## 執行時配置 (Runtime Configuration)

### 方法 1: 使用 NzConfig (推薦)

#### 步驟 1: 配置 app.config.ts

```typescript
// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNzConfig, NzConfig } from 'ng-zorro-antd/core/config';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

// 玄武主題配置
const ngZorroConfig: NzConfig = {
  theme: {
    primaryColor: '#1E3A8A',    // 玄武深藍 (Xuanwu Navy)
    successColor: '#0D9488',    // 深青綠 (Deep Teal)
    warningColor: '#F59E0B',    // 琥珀黃 (Amber)
    errorColor: '#EF4444',      // 赤紅 (Crimson)
    infoColor: '#64748B'        // 鋼藍 (Steel Blue)
  }
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideNzConfig(ngZorroConfig)
  ]
};
```

#### 步驟 2: 在 main.ts 中使用

```typescript
// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));
```

---

## 編譯時配置 (Compile-time Configuration)

### 方法 2: Less 變數配置

#### 步驟 1: 建立 theme.less

```less
// src/styles/theme.less

// ========== 主題色彩定義 ==========
// 必須在導入 @delon/theme 之前定義

// 主色系
@primary-color: #1E3A8A; // 玄武深藍
@primary-color-hover: #1E40AF;
@primary-color-active: #1D4ED8;
@primary-color-outline: fade(#1E3A8A, 20%);

// 成功色
@success-color: #0D9488; // 深青綠
@success-color-hover: #0F766E;
@success-color-active: #115E59;
@success-color-bg: #F0FDFA;

// 警告色
@warning-color: #F59E0B; // 琥珀黃
@warning-color-hover: #D97706;
@warning-color-active: #B45309;
@warning-color-bg: #FEF3C7;

// 錯誤色
@error-color: #EF4444; // 赤紅
@error-color-hover: #DC2626;
@error-color-active: #B91C1C;
@error-color-bg: #FEE2E2;

// 資訊色
@info-color: #64748B; // 鋼藍
@info-color-hover: #475569;
@info-color-active: #334155;
@info-color-bg: #F8FAFC;

// 文字色
@text-color: #1E293B;
@text-color-secondary: #64748B;
@heading-color: #0F172A;
@disabled-color: #94A3B8;

// 邊框色
@border-color-base: #CBD5E1;
@border-color-split: #E2E8F0;

// 背景色
@body-background: #F8FAFC;
@component-background: #ffffff;
@layout-body-background: #F1F5F9;

// ========== 導入主題 ==========
@import '@delon/theme/theme-default.less';

// ========== 自訂玄武色彩變數 ==========
// 10 級主色階梯
@xuanwu-1: #EFF6FF;
@xuanwu-2: #DBEAFE;
@xuanwu-3: #BFDBFE;
@xuanwu-4: #93C5FD;
@xuanwu-5: #60A5FA;
@xuanwu-6: #1E3A8A; // 主色
@xuanwu-7: #1E40AF;
@xuanwu-8: #1D4ED8;
@xuanwu-9: #172554;
@xuanwu-10: #0F172A;

// 6 級成功色階梯
@teal-1: #F0FDFA;
@teal-2: #CCFBF1;
@teal-3: #99F6E4;
@teal-4: #0D9488; // 成功色
@teal-5: #0F766E;
@teal-6: #115E59;

// 5 級資訊色階梯
@steel-1: #F8FAFC;
@steel-2: #F1F5F9;
@steel-3: #64748B; // 資訊色
@steel-4: #475569;
@steel-5: #334155;

// 4 級強調色階梯
@silver-1: #F8FAFC;
@silver-2: #E2E8F0;
@silver-3: #94A3B8;
@silver-4: #64748B;

// ========== 漸層系統 ==========
@gradient-northern-waters: linear-gradient(135deg, #1E3A8A 0%, #0D9488 100%);
@gradient-tortoise-shell: linear-gradient(45deg, #172554 0%, #1E3A8A 50%, #64748B 100%);
@gradient-winter-night: linear-gradient(180deg, #0F172A 0%, #1E3A8A 50%, #0D9488 100%);
@gradient-silver-frost: linear-gradient(135deg, #EFF6FF 0%, #E2E8F0 50%, #CBD5E1 100%);
@gradient-deep-mystery: linear-gradient(135deg, #172554 0%, #115E59 100%);

// ========== 陰影系統 ==========
@shadow-xuanwu-sm: 0 1px 2px rgba(30, 58, 138, 0.05);
@shadow-xuanwu-md: 0 4px 6px rgba(30, 58, 138, 0.1);
@shadow-xuanwu-lg: 0 10px 15px rgba(30, 58, 138, 0.15);
@shadow-xuanwu-xl: 0 20px 25px rgba(30, 58, 138, 0.2);

// ========== 光暈效果 ==========
@glow-xuanwu: 0 0 20px rgba(30, 58, 138, 0.5);
@glow-teal: 0 0 20px rgba(13, 148, 136, 0.5);

// ========== 過渡系統 ==========
@transition-fast: 0.15s ease;
@transition-base: 0.3s ease;
@transition-slow: 0.5s ease;
```

#### 步驟 2: 在 styles.less 中導入

```less
// src/styles.less
@import './styles/theme.less';
@import './styles/index.less'; // 自訂樣式
```

#### 步驟 3: 配置 angular.json

```json
{
  "projects": {
    "your-project": {
      "architect": {
        "build": {
          "options": {
            "styles": [
              "src/styles.less"
            ]
          }
        }
      }
    }
  }
}
```

---

## 動態主題切換 (Dynamic Theme Switching)

### 方法 3: 使用 NzConfigService

#### 步驟 1: 建立主題服務

```typescript
// src/app/core/services/theme.service.ts
import { Injectable, inject } from '@angular/core';
import { NzConfigService } from 'ng-zorro-antd/core/config';

export interface ThemeConfig {
  name: string;
  primaryColor: string;
  successColor: string;
  warningColor: string;
  errorColor: string;
  infoColor: string;
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private nzConfigService = inject(NzConfigService);
  
  // 預定義主題
  private themes: Record<string, ThemeConfig> = {
    xuanwu: {
      name: '玄武主題',
      primaryColor: '#1E3A8A',
      successColor: '#0D9488',
      warningColor: '#F59E0B',
      errorColor: '#EF4444',
      infoColor: '#64748B'
    },
    light: {
      name: '淺色主題',
      primaryColor: '#1890ff',
      successColor: '#52c41a',
      warningColor: '#faad14',
      errorColor: '#f5222d',
      infoColor: '#1890ff'
    },
    dark: {
      name: '深色主題',
      primaryColor: '#177ddc',
      successColor: '#49aa19',
      warningColor: '#d89614',
      errorColor: '#d32029',
      infoColor: '#177ddc'
    }
  };
  
  /**
   * 切換到指定主題
   */
  switchTheme(themeName: string): void {
    const theme = this.themes[themeName];
    if (!theme) {
      console.error(`主題 "${themeName}" 不存在`);
      return;
    }
    
    this.nzConfigService.set('theme', {
      primaryColor: theme.primaryColor,
      successColor: theme.successColor,
      warningColor: theme.warningColor,
      errorColor: theme.errorColor,
      infoColor: theme.infoColor
    });
    
    // 儲存使用者偏好
    localStorage.setItem('selectedTheme', themeName);
  }
  
  /**
   * 獲取當前主題
   */
  getCurrentTheme(): string {
    return localStorage.getItem('selectedTheme') || 'xuanwu';
  }
  
  /**
   * 獲取所有可用主題
   */
  getAvailableThemes(): ThemeConfig[] {
    return Object.values(this.themes);
  }
  
  /**
   * 初始化主題（在應用啟動時呼叫）
   */
  initializeTheme(): void {
    const savedTheme = this.getCurrentTheme();
    this.switchTheme(savedTheme);
  }
}
```

#### 步驟 2: 在元件中使用

```typescript
// src/app/routes/settings/theme-settings.component.ts
import { Component, inject, signal } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { ThemeService, ThemeConfig } from '@core/services/theme.service';

@Component({
  selector: 'app-theme-settings',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-card nzTitle="主題設定">
      <nz-radio-group [(ngModel)]="selectedTheme" (ngModelChange)="onThemeChange($event)">
        @for (theme of themes(); track theme.name) {
          <label nz-radio [nzValue]="theme.name">
            <div class="theme-option">
              <span class="theme-name">{{ theme.name }}</span>
              <div class="theme-preview">
                <span 
                  class="color-dot" 
                  [style.background]="theme.primaryColor"
                ></span>
                <span 
                  class="color-dot" 
                  [style.background]="theme.successColor"
                ></span>
                <span 
                  class="color-dot" 
                  [style.background]="theme.errorColor"
                ></span>
              </div>
            </div>
          </label>
        }
      </nz-radio-group>
    </nz-card>
  `,
  styles: [`
    .theme-option {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .theme-preview {
      display: flex;
      gap: 4px;
    }
    
    .color-dot {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: inline-block;
      border: 1px solid rgba(0, 0, 0, 0.1);
    }
  `]
})
export class ThemeSettingsComponent {
  private themeService = inject(ThemeService);
  
  themes = signal<ThemeConfig[]>([]);
  selectedTheme = '';
  
  ngOnInit(): void {
    this.themes.set(this.themeService.getAvailableThemes());
    this.selectedTheme = this.themeService.getCurrentTheme();
  }
  
  onThemeChange(themeName: string): void {
    this.themeService.switchTheme(themeName);
  }
}
```

#### 步驟 3: 在應用初始化時載入主題

```typescript
// src/app/app.config.ts
import { APP_INITIALIZER } from '@angular/core';
import { ThemeService } from '@core/services/theme.service';

export function initializeTheme(themeService: ThemeService) {
  return () => themeService.initializeTheme();
}

export const appConfig: ApplicationConfig = {
  providers: [
    // ... 其他 providers
    {
      provide: APP_INITIALIZER,
      useFactory: initializeTheme,
      deps: [ThemeService],
      multi: true
    }
  ]
};
```

---

## Less 變數配置

### 完整變數清單

```less
// ========== ng-zorro-antd 官方變數 ==========
// 參考: https://ng.ant.design/docs/customize-theme/zh

// 主色
@primary-color: #1E3A8A;
@link-color: @primary-color;
@link-hover-color: #1E40AF;
@link-active-color: #1D4ED8;

// 成功色
@success-color: #0D9488;
@success-bg: #F0FDFA;

// 警告色
@warning-color: #F59E0B;
@warning-bg: #FEF3C7;

// 錯誤色
@error-color: #EF4444;
@error-bg: #FEE2E2;

// 資訊色
@info-color: #64748B;
@info-bg: #F8FAFC;

// 文字色
@text-color: #1E293B;
@text-color-secondary: #64748B;
@text-color-inverse: #ffffff;
@heading-color: #0F172A;
@disabled-color: #94A3B8;

// 邊框
@border-radius-base: 4px;
@border-width-base: 1px;
@border-color-base: #CBD5E1;
@border-color-split: #E2E8F0;

// 背景色
@body-background: #F8FAFC;
@component-background: #ffffff;
@layout-body-background: #F1F5F9;
@layout-header-background: #ffffff;
@layout-footer-background: @layout-body-background;

// 陰影
@shadow-color: rgba(30, 58, 138, 0.1);
@shadow-1-up: @shadow-xuanwu-sm;
@shadow-1-down: @shadow-xuanwu-sm;
@shadow-2: @shadow-xuanwu-md;

// 字體
@font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
@code-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
@font-size-base: 14px;
@font-size-lg: 16px;
@font-size-sm: 12px;

// 高度
@height-base: 32px;
@height-lg: 40px;
@height-sm: 24px;

// ========== @delon/theme 變數 ==========
@alain-default-header-hg: 64px;
@alain-default-header-bg: @component-background;
@alain-default-header-padding: 16px;

// 側邊欄
@alain-default-aside-wd: 200px;
@alain-default-aside-bg: @component-background;
@alain-default-aside-scrollbar-width: 0;

// 內容區
@alain-default-content-bg: @layout-body-background;
@alain-default-content-padding: 24px;
```

---

## Angular 整合

### ng-zorro-antd 元件樣式覆寫

```less
// src/styles/index.less

// ========== 按鈕元件 ==========
.ant-btn-primary {
  background: @gradient-northern-waters;
  border: none;
  
  &:hover {
    background: @xuanwu-7;
  }
  
  &:active {
    background: @xuanwu-8;
  }
}

// ========== 卡片元件 ==========
.ant-card {
  box-shadow: @shadow-xuanwu-sm;
  border-radius: 8px;
  
  &:hover {
    box-shadow: @shadow-xuanwu-md;
  }
}

// ========== 表格元件 ==========
.ant-table {
  .ant-table-thead > tr > th {
    background: @gradient-silver-frost;
    color: @xuanwu-7;
    font-weight: 600;
  }
  
  .ant-table-tbody > tr:hover > td {
    background: fade(@xuanwu-1, 80%);
  }
}

// ========== 表單元件 ==========
.ant-input:focus,
.ant-input-focused {
  border-color: @xuanwu-6;
  box-shadow: 0 0 0 2px fade(@xuanwu-6, 20%);
}

// ========== 選單元件 ==========
.ant-menu-item-selected {
  background-color: @xuanwu-1;
  color: @xuanwu-6;
  
  &::after {
    border-right-color: @xuanwu-6;
  }
}
```

### ng-alain 佈局樣式

```less
// src/styles/index.less

// ========== 頁首 ==========
.alain-default__header {
  background: @component-background;
  box-shadow: @shadow-xuanwu-sm;
}

// ========== 側邊欄 ==========
.alain-default__aside {
  background: @component-background;
  
  .alain-default__nav-item {
    &:hover {
      background: @xuanwu-1;
    }
    
    &.active {
      background: @xuanwu-1;
      color: @xuanwu-6;
      border-left: 3px solid @xuanwu-6;
    }
  }
}

// ========== 內容區 ==========
.alain-default__content {
  background: @layout-body-background;
}
```

---

## 常見問題 (Troubleshooting)

### Q1: 主題顏色沒有生效？

**解決方案**:
1. 確認 Less 變數定義在導入 `@delon/theme` 之前
2. 清除 Angular 快取: `rm -rf .angular`
3. 重新建置專案: `yarn build`

### Q2: 動態切換主題後某些元件顏色沒有更新？

**解決方案**:
1. 使用 `ChangeDetectorRef.markForCheck()` 觸發變更檢測
2. 確保元件使用 `OnPush` 變更檢測策略
3. 重新載入頁面以確保所有樣式生效

### Q3: 自訂漸層在某些瀏覽器不顯示？

**解決方案**:
1. 檢查瀏覽器相容性
2. 添加瀏覽器前綴:
```less
background: -webkit-linear-gradient(135deg, #1E3A8A 0%, #0D9488 100%);
background: -moz-linear-gradient(135deg, #1E3A8A 0%, #0D9488 100%);
background: linear-gradient(135deg, #1E3A8A 0%, #0D9488 100%);
```

### Q4: 打包後樣式檔案過大？

**解決方案**:
1. 啟用 CSS 壓縮:
```json
{
  "optimization": {
    "styles": {
      "minify": true,
      "inlineCritical": true
    }
  }
}
```

2. 移除未使用的樣式（PurgeCSS）

### Q5: Less 編譯錯誤？

**解決方案**:
1. 確認 Less 版本相容性: `yarn add less@^4.0.0 -D`
2. 檢查語法錯誤
3. 確保所有變數都已定義

---

## 📚 相關資源

- [ng-zorro-antd 主題化](https://ng.ant.design/docs/customize-theme/zh)
- [ng-alain 主題系統](https://ng-alain.com/theme/getting-started/zh)
- [Less 官方文件](https://lesscss.org/)
- [Angular 樣式指南](https://angular.dev/guide/components/styling)

---

**版本**: 2.0.0  
**最後更新**: 2025-12-17  
**維護者**: GitHub Copilot  
**狀態**: ✅ 生產環境就緒
